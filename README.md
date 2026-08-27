# Saheli AI 🛡️
> **Predictive Safety Intelligence & Active Guardian Companion for Women and Solo Commuters**

---

## 🌟 Overview

Saheli AI is a proactive personal safety platform designed to provide real-time route safety scoring, active journey tracking, verified self-defense learning, and an AI safety companion powered by Google Gemini.

---

## 🔒 Gemini API Configuration (Supabase Edge Functions)

Saheli AI uses a secure **Server-Side Edge Function architecture** to interface with Google Gemini. 

> [!IMPORTANT]
> **Zero Client-Side Secret Exposure:**
> - `GEMINI_API_KEY` is **strictly stored as a Supabase Edge Function secret**.
> - The React frontend **never** accesses or contains `GEMINI_API_KEY`.
> - Do **not** prefix or place `GEMINI_API_KEY` in `.env` as a `VITE_*` variable.
> - The frontend communicates with Gemini exclusively by invoking the deployed Supabase Edge Function `saheli-chat`.

---

### Manual Setup Instructions (Production / Remote Supabase)

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation, go to **Edge Functions** (or **Project Settings** → **Edge Functions**).
4. Click on **Secrets**.
5. Click **Add new secret**:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `<your-google-gemini-api-key>`
6. Click **Save**.

#### Or via Supabase CLI:
```bash
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key
supabase functions deploy saheli-chat
```

---

### Local Edge Function Testing

For local development with the Supabase CLI:

1. Copy the secrets template:
   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   ```
2. Set your `GEMINI_API_KEY` inside `supabase/functions/.env`.
3. Serve the edge function locally:
   ```bash
   supabase functions serve saheli-chat --env-file ./supabase/functions/.env
   ```

---

## 🧠 Architectural Flow: Saheli Companion AI

```
┌─────────────────────────┐
│     React Frontend      │
│  (Companion / Journey)  │
└────────────┬────────────┘
             │  POST /functions/v1/saheli-chat
             │  Payload: { message, conversationHistory,
             │            journeyContext, routeContext,
             │            relevantResources }
             ▼
┌──────────────────────────────┐
│    Supabase Edge Function    │
│       (`saheli-chat`)        │
│                              │
│  • Reads Deno.env (Secret)   │
│  • Validates & sanitizes     │
│  • Injects grounded context  │
│  • Enforces safety persona   │
└────────────┬─────────────────┘
             │  Server-to-Server HTTPS Request
             ▼
┌──────────────────────────────┐
│   Google Gemini 2.5 Flash    │
│    `generateContent` API     │
└──────────────────────────────┘
```

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Frontend Environment
Create a `.env` file in the root for public client keys:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GEOAPIFY_API_KEY=your-geoapify-key
```

### 3. Run Development Server
```bash
npm run dev
```

### 4. Run Automated Tests
```bash
npm run test
```

---

## 🧪 Testing Saheli AI Services

Run Vitest to verify deterministic route scoring, detour recommendations, and Edge Function chat integrations:
```bash
npx vitest run
```