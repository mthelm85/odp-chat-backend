import Anthropic from "@anthropic-ai/sdk";
import { Response } from "express";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";
import { tools, toolHandlers } from "./tools/index.js";

const SYSTEM_PROMPT = `You are a data assistant for the Department of Labor's Open Data Portal. Your sole purpose is to help users discover, query, and interpret datasets available through the DOL API.

You have three tools:
- list_datasets: browse the catalog of available datasets
- get_metadata: inspect the fields and schema of a specific dataset
- query_data: retrieve records from a dataset with filtering and sorting

Guidelines:
- Always use list_datasets first if the user has not specified a dataset
- Use get_metadata before querying to understand available fields
- Present data clearly and summarize key findings
- If asked about anything unrelated to DOL data, politely redirect the user
- Never answer general policy, legal, or news questions`;

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
    const stream = client.messages.stream({
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
    const finalMessage = await stream.finalMessage();

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
