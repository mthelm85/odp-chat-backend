import { MessageParam } from "@anthropic-ai/sdk/resources/messages.js";

export interface ChatRequestBody {
  message: string;
  history: MessageParam[];
}

export interface SSEEvent {
  type: "text" | "tool_call" | "tool_result" | "done" | "error";
  data: unknown;
}

export interface PaginationMeta {
  current_page: number;
  next_page: number | null;
  prev_page: number | null;
  total_pages: number;
  total_count: number;
}

export interface DOLDataset {
  name: string;
  agency: string;
  endpoint: string;
  description: string;
  category: string;
  frequency: string;
  tags: string[];
  updated_at: string;
}
