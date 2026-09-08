# Wowai — AI that feels simple

> “Ask anything. Create anything. Get things done.”

**Wowai** is a modern, production-ready AI chat web application built with clean typography, generous whitespace, fast token streaming, and full bilingual support (**English** and **বাংলা**).

Developed by **Ahanaf Akif** (Built with passion by **Ahanf Akif**).

---

## Features

- **Minimalist Premium Identity**: Original brand aesthetic, custom geometric logo mark, and zero SaaS clutter.
- **Bilingual Interface (EN | বাংলা)**: Centralized translations, natural Bengali typography with Google's *Hind Siliguri*, and instant language toggling.
- **Dual Complete Themes**: Polished light and dark modes with system preference detection and `localStorage` persistence.
- **Modern Chat Interface**:
  - Auto-expanding fixed input with Enter-to-send (Shift+Enter for multi-line).
  - Stop generating control.
  - Streaming SSE (Server-Sent Events) progressive text reveal with typing animation.
  - Full Markdown support: headings, bold/italics, bulleted & numbered lists, tables, inline code, and syntax code blocks with one-click **Copy Code** button.
  - Pre-built suggestion cards for **💡 Learn**, **💻 Code**, **✍️ Write**, and **🔍 Analyze**.
- **Conversation Management**:
  - Auto-generated and editable chat titles.
  - Real-time chat search and filtering.
  - Context menu with Rename and Delete.
  - Local history persistence ready for cloud database upgrade (Firebase, PostgreSQL, Supabase, etc.).
- **Smart AI Architecture**:
  - Secure server-side `/api/chat` proxy with **BAILU AI** (OpenAI-compatible protocol at `https://bailucode.com/openapi`).
  - Model discovery via `https://bailucode.com/openapi/v1/models` and customizable `BAILU_MODEL`.
  - Automatic fallback to **Smart Demo Mode** when an API key is not yet configured, ensuring instant testability out of the box without errors.
- **User Authentication Ready**:
  - Sign in, Sign up, Continue with Google, and Logout UI.
  - Profile menu with settings, theme, and language shortcuts.
- **Comprehensive Settings**:
  - Appearance (Light / Dark / System).
  - Language switcher.
  - Chat preferences (Enter to send, Timestamps, Auto-scroll, Streaming toggle).
  - Privacy controls (Clear history, Delete all conversations).
- **PWA Ready**: Web app manifest, theme colors, and responsive viewport.

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm

### Installation

1. Clone or download the repository:
   ```bash
   git clone <repo-url>
   cd wowai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Add your BAILU API key and optional model:
   ```env
   BAILU_API_KEY=your_bailu_api_key_here
   BAILU_MODEL=bailu-turing
   ```
   *(If `BAILU_API_KEY` is not configured, Wowai automatically runs in **Demo Mode**, providing instant intelligent bilingual responses!)*

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

---

## Production Build

To build the optimized client bundle and bundled Express server:

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, React Markdown, Remark GFM
- **Backend / API**: Express 4, Vite middleware, Server-Sent Events (SSE)
- **AI SDK**: `@google/genai` (Google Gemini 3.8 Flash)
- **Typography**: Plus Jakarta Sans, Hind Siliguri (বাংলা), JetBrains Mono
