import Anthropic from "@anthropic-ai/sdk";
import { handleQueryData } from "./handlers.js";

export const tools: Anthropic.Tool[] = [
  {
    name: "query_data",
    description:
      "Query records from a DOL dataset. The dataset catalog with all available agencies and endpoints is provided in your system prompt. Supports pagination, field selection, sorting, and conditional filtering. For filter_object: single condition: {\"field\":\"year\",\"operator\":\"eq\",\"value\":\"2022\"}. AND/OR: {\"and\":[...]} / {\"or\":[...]}. Operators: eq, neq, gt, lt, in, not_in, like (use % as wildcard).",
    input_schema: {
      type: "object",
      properties: {
        agency: {
          type: "string",
          description: "Agency abbreviation (e.g., 'OSHA', 'MSHA', 'WHD', 'ETA', 'ILAB', 'WB', 'VETS', 'EBSA', 'TRNG')",
        },
        endpoint: {
          type: "string",
          description: "Dataset endpoint name from the catalog in your system prompt",
        },
        format: {
          type: "string",
          description: "Response format (default: 'json')",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return (default: 10, max: 10000)",
        },
        offset: {
          type: "number",
          description: "Number of records to skip for pagination (default: 0)",
        },
        fields: {
          type: "string",
          description: "Comma-separated list of field names to return (e.g., 'case_id,trade_nm,city_nm'). Omit to return all fields.",
        },
        sort: {
          type: "string",
          description: "Sort direction: 'asc' for ascending, 'desc' for descending",
        },
        sort_by: {
          type: "string",
          description: "Field name to sort by",
        },
        filter_object: {
          type: "string",
          description: "JSON filter string for conditional filtering. Examples: {\"field\":\"state\",\"operator\":\"eq\",\"value\":\"CA\"} or {\"and\":[{\"field\":\"year\",\"operator\":\"gt\",\"value\":\"2020\"},{\"field\":\"state\",\"operator\":\"eq\",\"value\":\"TX\"}]}",
        },
      },
      required: ["agency", "endpoint"],
    },
  },
];

export const toolHandlers: Record<string, (input: any) => Promise<any>> = {
  query_data: handleQueryData,
};
