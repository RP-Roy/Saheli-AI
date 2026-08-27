import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import fs from 'fs'
import path from 'path'

function saheliDevApiPlugin(): Plugin {
  return {
    name: 'saheli-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/saheli-chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            // Read GEMINI_API_KEY from process.env or supabase/functions/.env
            let apiKey = process.env.GEMINI_API_KEY;
            if (!apiKey) {
              const envPath = path.resolve(process.cwd(), 'supabase/functions/.env');
              if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/GEMINI_API_KEY=(.+)/);
                if (match) apiKey = match[1].trim();
              }
            }

            if (!apiKey) {
              res.statusCode = 503;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                error: 'GEMINI_API_KEY not found in supabase/functions/.env',
                reply: "I'm currently unable to connect to Gemini because GEMINI_API_KEY is not set in supabase/functions/.env."
              }));
              return;
            }

            const data = JSON.parse(body);
            const userMessage = data.message?.trim();
            if (!userMessage) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Message is required' }));
              return;
            }

            // Standalone AI safety and personal assistance system prompt
            const systemPrompt = `You are Saheli, an empathetic, calm, and practical AI personal safety and assistance companion for women and solo travelers.
Your core mission:
- Provide actionable, reassuring safety guidance, situational awareness advice, solo travel tips, de-escalation strategies, and general personal assistance.
- Prioritize conflict avoidance, maintaining personal boundaries, and heading toward populated, well-lit spaces.
- For emergency situations, immediately prioritize emergency numbers (such as 112 or 911) and alerting trusted contacts.
- Provide direct, helpful answers to user questions. Keep answers clear, thoughtful, empathetic, and concise.`;

            const contents: any[] = [];
            if (Array.isArray(data.conversationHistory)) {
              for (const item of data.conversationHistory.slice(-8)) {
                if (item.content) {
                  contents.push({
                    role: item.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: item.content }]
                  });
                }
              }
            }
            contents.push({ role: 'user', parts: [{ text: userMessage }] });

            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
            const geminiRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents,
                generationConfig: { temperature: 0.6, maxOutputTokens: 500, topP: 0.9 },
              }),
            });

            if (!geminiRes.ok) {
              const errText = await geminiRes.text();
              console.error('Local Gemini API error:', errText);
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Gemini API call failed', details: errText }));
              return;
            }

            const geminiJson: any = await geminiRes.json();
            const replyText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help. Stay aware of your surroundings and let me know how I can support your route safety.";

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ reply: replyText }));
          } catch (err: any) {
            console.error('Dev server saheli-chat error:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err?.message || 'Internal error' }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saheliDevApiPlugin()],
})

