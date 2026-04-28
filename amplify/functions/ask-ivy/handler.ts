import type { Schema } from '../../data/resource';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler: Schema['askIvy']['functionHandler'] = async (event, context) => {
  const { message, weddingContext } = event.arguments;

  if (!message) {
    throw new Error('Message is required');
  }

  // Parse the wedding context safely
  let contextStr = '';
  try {
    if (weddingContext) {
      const parsed = JSON.parse(weddingContext);
      contextStr = `
        Couple: ${parsed.coupleName1} and ${parsed.coupleName2}
        Date: ${parsed.weddingDate}
        Venue: ${parsed.venueName || 'Not decided'}
        Budget: $${parsed.budgetTotal || 'Not set'}
      `;
    }
  } catch (e) {
    console.error('Failed to parse wedding context:', e);
  }

  const systemPrompt = `
    You are Ivy, a helpful, enthusiastic, and highly organized virtual wedding planner assistant.
    You assist the couple in planning their wedding. Be concise and keep answers short (under 3 paragraphs).
    Here is the context about their wedding:
    ${contextStr}
  `;

  try {
    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
      }),
    });

    const response = await bedrockClient.send(command);
    const resultString = new TextDecoder().decode(response.body);
    const result = JSON.parse(resultString);

    if (result.content && result.content.length > 0) {
      return result.content[0].text;
    }

    return "I'm sorry, I couldn't process that request right now.";
  } catch (error) {
    console.error('Bedrock invocation failed:', error);
    throw new Error('Failed to generate response from Ivy.');
  }
};
