import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { ChatRequestBody } from "./types.js";
import { handleChat } from "./chat.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { message, history = [] } = req.body as ChatRequestBody;

    // Validation
    if (!message?.trim()) {
      res.status(400).json({ error: "Message is required." });
      return;
    }

    if (message.length > 2000) {
      res.status(400).json({ error: "Message too long." });
      return;
    }

    // Truncate history if too long
    let validHistory = history;
    if (history.length > 20) {
      validHistory = history.slice(-20);
    }

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Handle the chat
    await handleChat(message, validHistory, res);
  } catch (error) {
    console.error("Chat error:", error);
    
    // Send error event if headers already sent (SSE mode)
    if (res.headersSent) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          message: "An internal error occurred.",
        })}\n\n`
      );
    } else {
      res.status(500).json({ error: "An internal error occurred." });
    }
  } finally {
    if (res.headersSent) {
      res.end();
    }
  }
});

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
