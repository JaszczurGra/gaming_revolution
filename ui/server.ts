import express from 'express';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '100mb' })); // Allow large payloads for images/pdfs
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Allow large URL-encoded payloads

// Lazy init SDKs to prevent startup crashes if keys are missing
let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key, { apiVersion: '2026-08-26.dahlia' });
  }
  return stripeClient;
}

let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

const pdfCache = new Map<string, string>();

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

app.post('/api/gemini/chat', async (req, res) => {
  const logStream = (msg: string) => {
    try {
      fs.appendFileSync(path.join(process.cwd(), 'server.log'), `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) {}
  };

  try {
    const { message, gameName, gameNotes, history, pdfUrl, imageBase64 } = req.body;
    logStream(`Received chat request for gameName: "${gameName}", message length: ${message?.length || 0}, hasImage: ${!!imageBase64}, hasPdf: ${!!pdfUrl}, history length: ${history?.length || 0}`);
    
    const ai = getAI();

    const parts: any[] = [];
    
    if (pdfUrl) {
      try {
        if (!pdfCache.has(pdfUrl)) {
          logStream(`Downloading PDF from url: ${pdfUrl}`);
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds max
          
          const pdfRes = await fetch(pdfUrl, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          if (!pdfRes.ok) {
            throw new Error(`PDF fetch failed with status ${pdfRes.status}`);
          }
          
          const arrayBuffer = await pdfRes.arrayBuffer();
          pdfCache.set(pdfUrl, Buffer.from(arrayBuffer).toString('base64'));
          logStream("PDF cached successfully.");
        } else {
          logStream("Using cached PDF.");
        }
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: pdfCache.get(pdfUrl)!
          }
        });
      } catch (err: any) {
        logStream(`Failed to fetch PDF: ${err.message || err}`);
        console.error("Failed to fetch PDF:", err);
      }
    }

    if (imageBase64) {
      logStream("Processing image input...");
      const mimeMatch = imageBase64.match(/^data:(image\/\w+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      
      parts.push({
        inlineData: {
          mimeType: mimeType,
          data: imageBase64.replace(/^data:image\/\w+;base64,/, "")
        }
      });
      logStream(`Image added to parts (mime: ${mimeType})`);
    }

    parts.push({ text: message });

    let systemInstruction = `You are a helpful AI assistant for the board game "${gameName || 'unknown'}". `;
    if (gameNotes) {
      systemInstruction += `\n\nCustom Player Notes / House Rules:\n${gameNotes}\n\n`;
    }
    systemInstruction += "Answer questions clearly and concisely. If rules are provided in a document, use them as your primary source of truth.";

    // Simple history formatting
    const formattedHistory = (history || []).map((h: any) => ({
      role: h.role, // 'user' or 'model'
      parts: [{ text: h.content }]
    }));
    
    // We append the current user message as the last part in history or separate contents
    const contents = [
      ...formattedHistory,
      { role: "user", parts }
    ];

    logStream("Calling Gemini generateContentStream...");
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.2
      }
    });

    logStream("Stream response received, setting headers...");
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    let chunkCount = 0;
    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(chunk.text);
        chunkCount++;
      }
    }
    logStream(`Stream finished writing ${chunkCount} chunks.`);
    res.end();

  } catch (err: any) {
    logStream(`Gemini error: ${err.message || err}`);
    console.error('Gemini error:', err);
    res.status(500).json({ error: err.message || 'Error communicating with AI' });
  }
});

app.post('/api/stripe/create-checkout-session', async (req, res) => {
  try {
    const { userId, returnUrl } = req.body;
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Unlimited Board Game AI Access',
              description: 'One-time payment for unlimited AI plays and features.',
            },
            unit_amount: 999, // $9.99
          },
          quantity: 1,
        },
      ],
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: returnUrl,
      client_reference_id: userId,
      metadata: {
        userId
      }
    });

    res.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe/verify', async (req, res) => {
  try {
    const { sessionId, userId } = req.body;
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err: any) {
    console.error('Stripe verify error:', err);
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// Vite or Static Serving
// -------------------------------------------------------------
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client', 'index.html'));
    });
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } else {
    // Development mode uses Vite
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
    
    // We also need to let Vite handle HTML requests
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
    app.listen(PORT, () => {
      console.log(`Dev server listening on port ${PORT}`);
    });
  }
}

startServer();
