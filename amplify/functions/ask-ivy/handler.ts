import type { Schema } from '../../data/resource';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export const handler: Schema['askIvy']['functionHandler'] = async (event, context) => {
  const { message, weddingContext, conversationHistory, imageBase64 } = event.arguments;

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
        additionalInfo += `\nChecklist (${parsed.checklist.length} items):\n` + parsed.checklist.map((t: any) => `- [ID: ${t.id}] [${t.status}] ${t.title} (${t.category})`).join('\n');
      }
      if (parsed.vendors && parsed.vendors.length > 0) {
        additionalInfo += `\n\nHired Vendors:\n` + parsed.vendors.map((v: any) => `- [ID: ${v.id}] ${v.category}: ${v.name} (${v.status})`).join('\n');
      }
      if (parsed.runsheet && parsed.runsheet.length > 0) {
        additionalInfo += `\n\nWedding Day Schedule:\n` + parsed.runsheet.map((r: any) => `- ${r.time}: ${r.title}`).join('\n');
      }
      if (parsed.gallery && parsed.gallery.length > 0) {
        additionalInfo += `\n\nGallery Photos:\n` + parsed.gallery.map((g: any) => `- [ID: ${g.id}] Uploaded by: ${g.uploader} | Current Caption: ${g.caption || 'None'}`).join('\n');
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
    You have tools to add tasks, vendors, runsheet items, and update gallery captions. If the user asks you to create a "typical" schedule, checklist, or list, you CAN and SHOULD use your tools multiple times in a row to generate the full list of items in a single response!
    For a typical runsheet, you MUST generate a granular breakdown containing at least 10 to 15 distinct events (e.g. hair/makeup, arrivals, first look, photos, ceremony, cocktail hour, reception, speeches, dancing, send-off).
    IMPORTANT: NEVER clear or delete existing items when asked to populate or add to a schedule unless the user EXPLICITLY says "clear" or "start over".
    VISION CAPABILITY: If the user provides an image, carefully analyze it. If it is a picture of handwritten notes, an invoice, a checklist, or an inspiration board, extract the relevant information and explicitly use your tools (e.g., \`add_task\`, \`add_vendor\`, \`add_runsheet_item\`) to digitize and save it to their dashboard!
    CRITICAL: You DO NOT have a multi-turn tool execution loop. If the user asks you to perform multiple actions (e.g., "clear the run sheet AND populate it"), you MUST output ALL necessary tool blocks in the EXACT SAME response. Do NOT output a single tool and stop. Output the clear tool and all 15 add tools simultaneously!
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

  let formattedMessages = [];
  try {
    if (conversationHistory) {
      const parsedHistory = JSON.parse(conversationHistory);
      // Filter out the initial greeting so it doesn't duplicate system prompt context
      formattedMessages = parsedHistory
        .filter((msg: any) => msg.id !== '1' && msg.content)
        .map((msg: any) => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }));
    }
  } catch (e) {
    console.error('Failed to parse history:', e);
  }

  // If no history or last message isn't the current message, append current message
  if (formattedMessages.length === 0 || formattedMessages[formattedMessages.length - 1].content !== message || imageBase64) {
    if (imageBase64) {
      // Anthropic vision format
      formattedMessages.push({
        role: 'user',
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64
            }
          },
          {
            type: "text",
            text: message
          }
        ]
      });
    } else {
      formattedMessages.push({ role: 'user', content: message });
    }
  }

  const requestBody: any = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 4000,
    system: systemPrompt,
    messages: formattedMessages,
  };

  // Add tools if it's a standard chat
  if (!isChecklistGeneration) {
    requestBody.tools = [
      {
        name: "add_task",
        description: "Add a new task to the user's wedding checklist.",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "The name of the task to add." },
            category: { type: "string", description: "The timeline phase. Must be one of: 'TWELVE_MONTHS', 'SIX_MONTHS', 'THREE_MONTHS', 'ONE_MONTH', 'TWO_WEEKS', 'ONE_WEEK', 'DAY_BEFORE', 'DAY_OF'" }
          },
          required: ["title", "category"]
        }
      },
      {
        name: "add_vendor",
        description: "Add a new vendor to the user's vendor list.",
        input_schema: {
          type: "object",
          properties: {
            companyName: { type: "string", description: "The name of the vendor company or person." },
            category: { type: "string", description: "The vendor category (e.g. Photography, Catering, Florist)." }
          },
          required: ["companyName", "category"]
        }
      },
      {
        name: "update_task",
        description: "Update an existing task in the checklist.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the task to update." },
            updates: {
              type: "object",
              properties: {
                title: { type: "string" },
                category: { type: "string" },
                isCompleted: { type: "boolean" },
                notes: { type: "string" },
                dueDate: { type: "string", description: "YYYY-MM-DD format" }
              }
            }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "delete_task",
        description: "Delete an existing task from the checklist.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the task to delete." }
          },
          required: ["id"]
        }
      },
      {
        name: "update_vendor",
        description: "Update an existing vendor.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the vendor to update." },
            updates: {
              type: "object",
              properties: {
                companyName: { type: "string" },
                category: { type: "string" },
                contractStatus: { type: "string" }
              }
            }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "delete_vendor",
        description: "Delete an existing vendor from the list.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the vendor to delete." }
          },
          required: ["id"]
        }
      },
      {
        name: "add_runsheet_item",
        description: "Add a new item to the wedding day run sheet (schedule).",
        input_schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "Title or name of the event." },
            eventTime: { type: "string", description: "Time of the event in HH:MM format (e.g. '14:00')." },
            description: { type: "string", description: "Details about what happens." },
            location: { type: "string", description: "Where the event takes place." },
            durationMinutes: { type: "integer", description: "Expected duration in minutes." }
          },
          required: ["title", "eventTime"]
        }
      },
      {
        name: "update_runsheet_item",
        description: "Update an existing run sheet item.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the run sheet item to update." },
            updates: {
              type: "object",
              properties: {
                title: { type: "string" },
                eventTime: { type: "string" },
                description: { type: "string" },
                location: { type: "string" },
                durationMinutes: { type: "integer" }
              }
            }
          },
          required: ["id", "updates"]
        }
      },
      {
        name: "delete_runsheet_item",
        description: "Delete an existing run sheet item.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the run sheet item to delete." }
          },
          required: ["id"]
        }
      },
      {
        name: "clear_runsheet",
        description: "Deletes all events from the user's wedding day run sheet. Use this ONLY when the user explicitly asks to 'clear', 'delete all', or 'start over'. DO NOT use this tool if the user is asking to generate or populate a schedule.",
        input_schema: {
          type: "object",
          properties: {}
        }
      },
      {
        name: "update_gallery_caption",
        description: "Update the caption of a photo or video in the gallery.",
        input_schema: {
          type: "object",
          properties: {
            id: { type: "string", description: "The ID of the gallery item." },
            caption: { type: "string", description: "The new caption text." }
          },
          required: ["id", "caption"]
        }
      }
    ];
  }

  try {
    const command = new InvokeModelCommand({
      modelId: 'us.anthropic.claude-haiku-4-5-20251001-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const resultString = new TextDecoder().decode(response.body);
    const result = JSON.parse(resultString);

    if (result.stop_reason === 'tool_use' || result.content.some((block: any) => block.type === 'tool_use')) {
      const toolUseBlocks = result.content.filter((block: any) => block.type === 'tool_use');
      if (toolUseBlocks.length > 0) {
        return `[TOOL_CALLS] ${JSON.stringify(toolUseBlocks.map((b: any) => ({
          name: b.name,
          input: b.input
        })))}`;
      }
    }

    if (result.content && result.content.length > 0) {
      let responseText = result.content.find((block: any) => block.type === 'text')?.text || '';
      
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
