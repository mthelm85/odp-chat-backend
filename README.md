# DOL Open Data Portal Backend

A Node.js/TypeScript Express backend that acts as middleware between a Svelte frontend and the Anthropic API. The backend exposes a `/chat` SSE endpoint that runs an agentic loop to help users discover, query, and interpret Department of Labor datasets.

## Features

- **Agentic Loop**: Claude can call three DOL tools sequentially before returning a final answer
- **Topic Guardrails**: Validates user messages to ensure they're related to DOL data
- **Server-Sent Events (SSE)**: Streams responses back to the client in real-time
- **TypeScript**: Fully typed with strict mode enabled
- **ESM Modules**: Modern JavaScript module system

## Tech Stack

- **Runtime**: Node.js (ESM modules)
- **Language**: TypeScript
- **Framework**: Express
- **AI SDK**: @anthropic-ai/sdk
- **Other**: cors, dotenv
- **Dev Tools**: tsx, tsup

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Express app and endpoints
│   ├── chat.ts           # Agentic chat loop
│   ├── guardrails.ts     # Topic validation
│   ├── types.ts          # TypeScript interfaces
│   └── tools/
│       ├── index.ts      # Tool definitions and handlers map
│       ├── handlers.ts   # DOL tool handler functions
│       └── dol.ts        # DOL API request wrapper
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your keys:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   DOL_API_KEY=              # Optional
   FRONTEND_URL=http://localhost:5173
   PORT=3000
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### GET `/health`
Health check endpoint.

**Response**:
```json
{
  "status": "ok"
}
```

### POST `/chat`
Main chat endpoint that handles user messages and returns SSE stream.

**Request Body**:
```json
{
  "message": "What OSHA datasets are available?",
  "history": []
}
```

**Response**: Server-Sent Events stream with the following event types:

- `text`: Claude's text response chunks
  ```json
  { "delta": "Here are the " }
  ```

- `tool_call`: When Claude calls a tool
  ```json
  { "name": "list_datasets", "input": { "page": 1 } }
  ```

- `tool_result`: After a tool completes
  ```json
  { "name": "list_datasets" }
  ```

- `done`: Stream completed successfully
  ```json
  {}
  ```

- `error`: An error occurred
  ```json
  { "message": "An internal error occurred." }
  ```

**Off-Topic Response** (non-SSE):
If the message is not related to DOL data:
```json
{
  "type": "off_topic",
  "message": "I can only help with the DOL Open Data Portal..."
}
```

## Available Tools

The assistant has access to three DOL Open Data Portal tools:

### 1. `list_datasets`
Browse the Department of Labor Data Catalog.
- **Parameters**: `page` (optional, default: 1)
- **Returns**: Array of datasets with pagination metadata

### 2. `get_metadata`
Get metadata for a specific dataset.
- **Parameters**: `agency`, `endpoint`, `format` (optional)
- **Returns**: Column names, types, and descriptions

### 3. `query_data`
Query records from a dataset.
- **Parameters**: `agency`, `endpoint`, `format`, `limit`, `offset`, `fields`, `sort`, `sort_by`, `filter_object`
- **Returns**: Dataset records

## Validation

The `/chat` endpoint validates:
- Message is required and not empty
- Message length ≤ 2000 characters
- History is truncated to last 20 entries if longer
- Message topic relevance (using Claude Haiku for classification)

## Example Usage

```bash
# Check health
curl http://localhost:3000/health

# Send a chat message
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me recent OSHA fatality data",
    "history": []
  }'
```

## Development

```bash
# Development with hot reload
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build

# Run built version
npm start
```

## Error Handling

- **Tool handlers**: Never throw errors; return `{ error: "..." }` objects
- **DOL API failures**: Return `null` and log errors
- **Guardrail failures**: Fail open (allow request) to avoid blocking users
- **Chat errors**: Send `error` SSE event and log to console

## License

ISC
