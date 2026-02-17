import Anthropic from "@anthropic-ai/sdk";
import {
  handleListDatasets,
  handleGetMetadata,
  handleQueryData,
} from "./handlers.js";

export const tools: Anthropic.Tool[] = [
  {
    name: "list_datasets",
    description:
      "Browse the Department of Labor Data Catalog to find available datasets. Returns agency names, dataset names, and API endpoint URLs. Results are paginated (default page 1). Use the agency 'abbr' and 'api_url' values from the response as the 'agency' and 'endpoint' parameters in get_metadata and query_data.",
    input_schema: {
      type: "object",
      properties: {
        page: {
          type: "number",
          description: "Page number for pagination (default 1)",
        },
      },
    },
  },
  {
    name: "get_metadata",
    description:
      "Get the metadata (column names, types, descriptions) for a specific DOL dataset. Use list_datasets first to find the agency abbreviation and endpoint name.",
    input_schema: {
      type: "object",
      properties: {
        agency: {
          type: "string",
          description: "Agency abbreviation (e.g., 'OSHA', 'MSHA', 'WHD')",
        },
        endpoint: {
          type: "string",
          description: "Dataset endpoint name from list_datasets",
        },
        format: {
          type: "string",
          description: "Response format (default: 'json')",
        },
      },
      required: ["agency", "endpoint"],
    },
  },
  {
    name: "query_data",
    description:
      "Query records from a DOL dataset. Supports pagination, field selection, sorting, and conditional filtering. Use list_datasets to find agency/endpoint, and get_metadata to discover available fields. For filter_object: single condition: {\"field\":\"year\",\"operator\":\"eq\",\"value\":\"2022\"}. AND/OR: {\"and\":[...]} / {\"or\":[...]}. Operators: eq, neq, gt, lt, in, not_in, like.",
    input_schema: {
      type: "object",
      properties: {
        agency: {
          type: "string",
          description: "Agency abbreviation",
        },
        endpoint: {
          type: "string",
          description: "Dataset endpoint name",
        },
        format: {
          type: "string",
          description: "Response format (default: 'json')",
        },
        limit: {
          type: "number",
          description: "Maximum number of records to return",
        },
        offset: {
          type: "number",
          description: "Number of records to skip (for pagination)",
        },
        fields: {
          type: "string",
          description: "Comma-separated list of field names to return",
        },
        sort: {
          type: "string",
          description: "Sort direction ('asc' or 'desc')",
        },
        sort_by: {
          type: "string",
          description: "Field name to sort by",
        },
        filter_object: {
          type: "string",
          description: "JSON string for filtering records",
        },
      },
      required: ["agency", "endpoint"],
    },
  },
];

export const toolHandlers: Record<string, (input: any) => Promise<any>> = {
  list_datasets: handleListDatasets,
  get_metadata: handleGetMetadata,
  query_data: handleQueryData,
};
