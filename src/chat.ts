import Anthropic from "@anthropic-ai/sdk";
import { Response } from "express";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { tools, toolHandlers } from "./tools/index.js";
import { loadDatasets, getDatasetCatalog } from "./catalog.js";

const datasets = loadDatasets();
const DATASET_CATALOG = getDatasetCatalog(datasets);

const SYSTEM_PROMPT = `You are a data assistant for the Department of Labor's Open Data Portal. Your purpose is to help users query and interpret datasets available through the DOL API.

${DATASET_CATALOG}

## Your Capabilities

You have ONE tool available:
- query_data: Retrieve records from any dataset listed above using the agency and endpoint identifiers

## Guidelines

- When users ask "what datasets are available" or similar questions, list the relevant datasets from the catalog above
- When users ask about a dataset's fields or schema, explain that they can query the data to see what fields are returned
- Always specify both the agency and endpoint when using the query_data tool (e.g., agency: "OSHA", endpoint: "inspection")
- Present data clearly and summarize key findings
- Focus exclusively on DOL data topics - if asked about unrelated topics, politely redirect users to DOL-related questions
- Never fabricate data or make up statistics - only present actual query results`;


function sendEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function handleChat(
  userMessage: string,
  history: MessageParam[],
  res: Response
): Promise<void> {
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const messages: MessageParam[] = [
    ...history,
    { role: "user", content: userMessage },
  ];

  while (true) {
    let stream;
    let finalMessage;

    try {
      stream = client.messages.stream({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools,
        messages,
      });

      // Stream text deltas
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          sendEvent(res, "text", { delta: event.delta.text });
        }
      }

      // Get the final message
      finalMessage = await stream.finalMessage();
    } catch (error: any) {
      // Log the error structure for debugging
      console.error("Caught error in chat handler:", {
        type: error?.type,
        errorType: error?.error?.type,
        message: error?.message,
        fullError: JSON.stringify(error, null, 2)
      });

      // Handle Claude API overload errors
      if (error?.error?.type === "overloaded_error" || error?.type === "overloaded_error") {
        sendEvent(res, "error", {
          message: "The AI service is currently experiencing high demand. Please try again in a moment.",
        });
        return;
      }
      // Re-throw other errors
      throw error;
    }

    // Extract tool use blocks
    const toolUseBlocks = finalMessage.content.filter(
      (block): block is Anthropic.Messages.ToolUseBlock =>
        block.type === "tool_use"
    );

    // Add assistant message to history
    messages.push({
      role: "assistant",
      content: finalMessage.content,
    });

    // Check if we need to execute tools
    if (finalMessage.stop_reason === "tool_use" && toolUseBlocks.length > 0) {
      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        sendEvent(res, "tool_call", {
          name: toolUse.name,
          input: toolUse.input,
        });

        let result: any;
        const handler = toolHandlers[toolUse.name];

        if (!handler) {
          result = { error: `Unknown tool: ${toolUse.name}` };
        } else {
          result = await handler(toolUse.input);
        }

        // Check for critical errors that should stop execution
        if (result?.error) {
          const errorMsg = result.error.toLowerCase();

          // Rate limit error - stop immediately
          if (errorMsg.includes('429') || errorMsg.includes('rate limit') || errorMsg.includes('too many requests')) {
            sendEvent(res, "error", {
              message: "The DOL API is rate limiting requests. Please wait a moment and try again.",
            });
            return;
          }

          // General API failure - stop immediately
          if (errorMsg.includes('failed to fetch') || errorMsg.includes('api error')) {
            sendEvent(res, "error", {
              message: "Unable to connect to the DOL API. Please try again later.",
            });
            return;
          }
        }

        sendEvent(res, "tool_result", { name: toolUse.name });

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      // Add tool results to messages
      messages.push({
        role: "user",
        content: toolResults,
      });

      // Continue the loop to get the next response
      continue;
    }

    // No more tool calls, we're done
    sendEvent(res, "done", {});
    break;
  }
}
