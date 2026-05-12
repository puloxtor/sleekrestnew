import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";
import { Resend } from "resend";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Resend - use hardcoded key for immediate user request, 
// though normally we'd rely on process.env.RESEND_API_KEY
const resend = new Resend(process.env.RESEND_API_KEY || "re_KBvf61Ew_BEveENC7ejzdJBvZLN5mFgeB");

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/notify-click", async (req, res) => {
    const { email, type } = req.body;
    console.log(`[SMOKE TEST ALERT] User clicked ${type}. Target Email: ${email || 'Anonymous'}`);
    
    try {
      const isEmailCapture = type === 'EMAIL_CAPTURE';
      const subject = isEmailCapture 
        ? `🚨 NEW LEAD: ${email}` 
        : `🔥 Buy Clicked: Anonymous`;

      const text = isEmailCapture
        ? `You have a new interested customer!\n\nEmail: ${email}\nUser Action: Shared email after seeing out-of-stock message.\nTimestamp: ${new Date().toLocaleString()}\n\nGo to your Firebase console to see all leads.`
        : `A potential customer just clicked the "КУПИ СЕГА" button.\n\nUser Action: Clicked Buy Button\nTimestamp: ${new Date().toLocaleString()}`;

      await resend.emails.send({
        from: 'SleekREST <onboarding@resend.dev>',
        to: 'kotzegien@gmail.com',
        subject: subject,
        text: text,
      });

      console.log(`Notification sent to kotzegien@gmail.com: Someone clicked ${type}`);
      res.json({ success: true, message: "Notification sent via Resend." });
    } catch (error) {
      console.error("Failed to send email via Resend:", error);
      res.status(500).json({ success: false, message: "Failed to send notification email." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
