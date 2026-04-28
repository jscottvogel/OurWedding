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
      
      let additionalInfo = '';
      if (parsed.checklist && parsed.checklist.length > 0) {
        additionalInfo += `\nChecklist (${parsed.checklist.length} items):\n` + parsed.checklist.map((t: any) => `- [${t.status}] ${t.title} (${t.category})`).join('\n');
      }
      if (parsed.vendors && parsed.vendors.length > 0) {
        additionalInfo += `\n\nHired Vendors:\n` + parsed.vendors.map((v: any) => `- ${v.category}: ${v.name} (${v.status})`).join('\n');
      }
      if (parsed.runsheet && parsed.runsheet.length > 0) {
        additionalInfo += `\n\nWedding Day Schedule:\n` + parsed.runsheet.map((r: any) => `- ${r.time}: ${r.title}`).join('\n');
      }

      contextStr = `
        Couple: ${parsed.coupleName1} and ${parsed.coupleName2}
        Date: ${parsed.weddingDate}
        Venue: ${parsed.venueName || 'Not decided'}
        Budget: $${parsed.budgetTotal || 'Not set'}
        ${additionalInfo}
      `;
    }
  } catch (e) {
    console.error('Failed to parse wedding context:', e);
  }

  const isChecklistGeneration = message === 'GENERATE_CHECKLIST_JSON';

  let systemPrompt = `
    You are Ivy, a helpful, enthusiastic, and highly organized virtual wedding planner assistant.
    You assist the couple in planning their wedding. Be concise and keep answers short (under 3 paragraphs).
    Here is the context about their wedding:
    ${contextStr}
  `;

  if (isChecklistGeneration) {
    systemPrompt = `
      You are Ivy, a master wedding planner. Based on the couple's context:
      ${contextStr}
      Generate a comprehensive, tailored timeline of 25-35 tasks.
      Return ONLY a raw JSON array of objects.
      DO NOT include any conversational text, greetings, or markdown formatting blocks (like \`\`\`json).
      Each object MUST have exactly these keys:
      - "title" (string, the name of the task)
      - "category" (string, MUST BE EXACTLY ONE OF: 'TWELVE_MONTHS', 'SIX_MONTHS', 'THREE_MONTHS', 'ONE_MONTH', 'TWO_WEEKS', 'ONE_WEEK', 'DAY_BEFORE', 'DAY_OF')
      - "notes" (string, a short helpful tip or context for this specific couple)
    `;
  }

  try {
    const command = new InvokeModelCommand({
      modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: isChecklistGeneration ? 4000 : 500,
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
      let responseText = result.content[0].text;
      
      // If we asked for JSON, cleanly strip any accidental markdown blocks Claude might return
      if (isChecklistGeneration) {
        responseText = responseText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      }
      
      return responseText;
    }

    return "I'm sorry, I couldn't process that request right now.";
  } catch (error: any) {
    console.error('Bedrock invocation failed:', error);
    throw new Error(`Bedrock Error: ${error.message || 'Unknown failure'}`);
  }
};
