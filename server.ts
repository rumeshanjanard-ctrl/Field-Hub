import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import sendEmailHandler from "./api/send-email";

// Load environment variables for development
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Enable body parsing for our API endpoints
  app.use(express.json());

  // Register our serverless endpoint on our Express routing pipeline
  app.post("/api/send-email", sendEmailHandler);

  // Vite middleware setup for Development vs Production builds
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite middleware in development...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Running in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] LBCL Field Operations Hub listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("[Server] Boot failure:", err);
});
