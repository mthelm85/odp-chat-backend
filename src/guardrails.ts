import Anthropic from "@anthropic-ai/sdk";

export const OFF_TOPIC_MESSAGE =
  "I can only help with the DOL Open Data Portal — discovering datasets, querying data, and understanding field metadata. Try asking something like: 'What OSHA datasets are available?' or 'Show me recent workplace fatality records.'";

export async function isOnTopic(message: string): Promise<boolean> {
  try {
    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 5,
      system:
        "You are a strict topic classifier. The user is interacting with a DOL Open Data Portal assistant. Determine if the user's message is asking about: discovering DOL datasets, querying or filtering DOL data, understanding dataset fields or metadata, or interpreting DOL data results. Answer only YES or NO.",
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    });

    const text = response.content[0]?.type === "text" 
      ? response.content[0].text 
      : "";
    
    return text.trim().toUpperCase().startsWith("YES");
  } catch (error) {
    console.error("Topic classifier failed:", error);
    // Fail open - don't block users if classifier fails
    return true;
  }
}
