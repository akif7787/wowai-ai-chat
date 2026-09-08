import { GoogleGenAI } from '@google/genai';
import { BailuAIProvider } from './bailu.ts';

export interface ChatMessageParam {
  role: 'user' | 'assistant' | 'model' | 'system';
  content: string;
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onError?: (err: Error) => void;
  onDone?: () => void;
}

export interface AIProvider {
  id: string;
  name: string;
  isDemo: boolean;
  model?: string;
  streamChat(
    message: string,
    history: ChatMessageParam[],
    callbacks: StreamCallbacks,
    options?: {
      language?: 'en' | 'bn';
      signal?: AbortSignal;
      messages?: ChatMessageParam[];
    }
  ): Promise<string>;
}

// Helper to detect Bengali text
function isBengaliText(text: string): boolean {
  return /[\u0980-\u09FF]/.test(text);
}

// 1. Google Gemini Provider
export class GeminiAIProvider implements AIProvider {
  id = 'gemini';
  name = 'Google Gemini (gemini-3.8-flash)';
  isDemo = false;
  private client: GoogleGenAI | null = null;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async streamChat(
    message: string,
    history: ChatMessageParam[],
    callbacks: StreamCallbacks,
    options?: { language?: 'en' | 'bn' }
  ): Promise<string> {
    if (!this.client) {
      throw new Error('Gemini client not initialized.');
    }

    const systemInstruction = `You are Wowai, a minimalist, friendly, intelligent, and fast AI assistant.
Your tagline is "AI that feels simple."
Guidelines:
- Provide clear, direct, and well-formatted answers without unnecessary fluff or excessive greetings.
- When generating code, use clean Markdown blocks with proper language identifiers.
- When explaining complex ideas, make them intuitive, structured, and easy to grasp.
- Respond in the language requested or spoken by the user (${options?.language === 'bn' || isBengaliText(message) ? 'Bengali (বাংলা)' : 'English'}).
- Maintain a calm, respectful, modern, and helpful tone at all times.`;

    // Map history to Gemini format
    const contents = [];
    
    // Add past history (limit to last 10 messages for fast token exchange)
    const recentHistory = history.slice(-10);
    for (const item of recentHistory) {
      contents.push({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }]
      });
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    try {
      const responseStream = await this.client.models.generateContentStream({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text || '';
        if (text) {
          fullText += text;
          callbacks.onChunk(text);
        }
      }
      callbacks.onDone?.();
      return fullText;
    } catch (err: any) {
      console.error('[GeminiAIProvider error]', err);
      callbacks.onError?.(err);
      throw err;
    }
  }
}

// 2. Intelligent Demo Provider (for seamless evaluation when API key is not configured)
export class DemoAIProvider implements AIProvider {
  id = 'demo';
  name = 'Wowai Smart Demo Engine';
  isDemo = true;

  async streamChat(
    message: string,
    _history: ChatMessageParam[],
    callbacks: StreamCallbacks,
    options?: { language?: 'en' | 'bn' }
  ): Promise<string> {
    const isBn = options?.language === 'bn' || isBengaliText(message);
    const query = message.toLowerCase();

    let reply = '';

    if (isBn) {
      if (query.includes('কেমন') || query.includes('হ্যালো') || query.includes('নমস্কার') || query.includes('হাই')) {
        reply = `**হ্যালো! আমি Wowai** — আপনার বুদ্ধিমান ও সহজ এআই সহকারী।

আমি আপনাকে কীভাবে সাহায্য করতে পারি?
- 💡 যেকোনো কঠিন বিষয় সহজ করে বোঝা
- 💻 কোডিং ও সফটওয়্যার সমস্যা সমাধান
- ✍️ প্রবন্ধ, ইমেইল বা আইডিয়া তৈরি
- 🔍 তথ্য ও ডেটা বিশ্লেষণ

*(দ্রষ্টব্য: এটি Wowai ডেমো মোডে চলছে। লাইভ মডেল সক্রিয় করতে BAILU_API_KEY সংযোগ করুন।)*`;
      } else if (query.includes('কোড') || query.includes('রিঅ্যাক্ট') || query.includes('react') || query.includes('python')) {
        reply = `এখানে একটি আধুনিক এবং পরিষ্কার React কম্পোনেন্টের উদাহরণ দেওয়া হলো:

\`\`\`tsx
import React, { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="p-4 border rounded-xl bg-neutral-900 text-white flex items-center gap-4">
      <span className="text-lg font-medium">কাউন্টার: {count}</span>
      <button 
        onClick={() => setCount(c => c + 1)}
        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm transition"
      >
        যোগ করুন +
      </button>
    </div>
  );
}
\`\`\`

### কী কী বজায় রাখা হয়েছে:
1. **Clean State Management**: সহজ \`useState\` হুক
2. **Minimal Layout**: পরিচ্ছন্ন ও রেসপনসিভ স্টাইলিং
3. **Type Safety**: সম্পূর্ণ টাইপস্ক্রিপ্ট ফ্রেন্ডলি`;
      } else if (query.includes('কোয়ান্টাম') || query.includes('quantum')) {
        reply = `### কোয়ান্টাম কম্পিউটিং কী?

সহজ ভাষায়, সাধারণ কম্পিউটার যেখানে **বিট (Bit)** ব্যবহার করে (যা ০ অথবা ১ হতে পারে), সেখানে কোয়ান্টাম কম্পিউটার ব্যবহার করে **কিউবিট (Qubit)**।

- **সুপারপজিশন (Superposition)**: একটি কিউবিট একই সাথে ০ এবং ১ উভয় অবস্থায় থাকতে পারে।
- **এন্ট্যাঙ্গলমেন্ট (Entanglement)**: দুটি কিউবিট একে অপরের সাথে এমনভাবে যুক্ত হতে পারে যে একটির অবস্থা জানলেই মুহূর্তের মধ্যে অন্যটির অবস্থা নির্ধারণ করা যায়।

> কোয়ান্টাম কম্পিউটার প্রচলিত কম্পিউটারের চেয়ে অনেক দ্রুত জটিল গাণিতিক এবং বৈজ্ঞানিক সমস্যা সমাধান করতে পারে।`;
      } else {
        reply = `আপনার বার্তাটি পেয়েছি: **"${message}"**

Wowai আপনাকে এই বিষয়ে সহায়তা করতে প্রস্তুত। 

1. **মূল পয়েন্ট**: জটিল সমস্যাগুলোকে ভেঙে ছোট ধাপে রূপান্তর করা।
2. **পরবর্তী পদক্ষেপ**: আপনার প্রয়োজন অনুযায়ী কোড, বিশ্লেষণ বা লেখার খসড়া প্রস্তুত করা।

*(বর্তমানে ডেমো ইঞ্জিনে উত্তর প্রদান করা হয়েছে। পূর্ণাঙ্গ এআই পাওয়ারের জন্য BAILU_API_KEY ব্যবহার করুন।)*`;
      }
    } else {
      // English responses
      if (query.includes('hello') || query.includes('hi') || query.includes('who are you')) {
        reply = `**Hello! I'm Wowai** — an AI assistant designed around simplicity, clarity, and speed.

How can I help you today?
- 💡 **Learn**: Explain complex topics in plain language
- 💻 **Code**: Help build components, debug, or architect solutions
- ✍️ **Write**: Draft articles, polish emails, or brainstorm ideas
- 🔍 **Analyze**: Break down data and extract actionable insights

*(Note: Running in Wowai Demo Mode. Configure \`BAILU_API_KEY\` to activate live BAILU AI inference).*`;
      } else if (query.includes('quantum') || query.includes('explain')) {
        reply = `### Quantum Computing, Explained Simply

Classical computers process information in bits that are either **0 or 1** — like a standard light switch turned either off or on.

Quantum computers use **qubits**, which leverage quantum mechanics:

1. **Superposition**: A qubit can represent both 0 and 1 simultaneously until measured. Imagine a spinning coin that is both heads and tails until caught.
2. **Entanglement**: Qubits can be linked so that the state of one instantly influences another, allowing parallel computations across massive search spaces.

#### Why It Matters
Quantum computers aren't just "faster laptops" — they excel at problems requiring astronomical combinations, such as:
- Molecular modeling for medicine
- Optimization of global supply chains
- Advanced cryptographic research`;
      } else if (query.includes('code') || query.includes('react') || query.includes('python')) {
        reply = `Here is an elegant and minimal TypeScript solution:

\`\`\`typescript
interface UserSession {
  id: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export function validateSession(session: unknown): session is UserSession {
  if (!session || typeof session !== 'object') return false;
  const s = session as Record<string, unknown>;
  return (
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    (s.role === 'admin' || s.role === 'user')
  );
}
\`\`\`

### Highlights:
- **Type Guard**: Uses TypeScript's \`is\` operator for compile-time narrowing.
- **Defensive**: Handles \`null\`, \`undefined\`, and arbitrary object shapes safely.
- **Zero Overhead**: Strips down cleanly with zero external runtime dependencies.`;
      } else if (query.includes('cybersecurity') || query.includes('roadmap')) {
        reply = `### Cybersecurity Learning Roadmap

Here is a structured, practical 4-stage path:

| Stage | Focus Area | Recommended Skills & Tools |
| :--- | :--- | :--- |
| **1. Foundations** | Networking & Systems | TCP/IP, DNS, Subnetting, Linux CLI, Bash |
| **2. Security Basics** | Defense & Threats | OWASP Top 10, Firewalls, Cryptography (AES, RSA) |
| **3. Hands-on Practice** | Labs & CTFs | TryHackMe, HackTheBox, Wireshark, Nmap |
| **4. Specialization** | Blue / Red Teaming | SOC Analysis, SIEM (Splunk/Elastic), Penetration Testing |

> **Pro Tip**: Start by setting up a local virtual lab with Kali Linux and an intentionally vulnerable target machine (like Metasploitable).`;
      } else {
        reply = `I have received your request: **"${message}"**

Here is a clear breakdown to address this:

1. **Direct Answer**: Wowai focuses on providing direct, actionable insight without unnecessary noise.
2. **Structure**: Keep logic modular, state deterministic, and interfaces responsive.
3. **Next Step**: Let me know if you'd like me to expand on code implementation, deep analysis, or step-by-step guidance!

*(Running on the Wowai Smart Demo Engine. Configure \`BAILU_API_KEY\` in your environment for real-time generative responses).*`;
      }
    }

    // Stream the mock reply progressively in small chunks to simulate real streaming
    const words = reply.split(' ');
    let accumulated = '';
    
    for (let i = 0; i < words.length; i++) {
      const chunk = (i === 0 ? '' : ' ') + words[i];
      accumulated += chunk;
      callbacks.onChunk(chunk);
      // Fast non-blocking delay
      await new Promise(r => setTimeout(r, 22));
    }

    callbacks.onDone?.();
    return reply;
  }
}

// Factory function
export function getAIProvider(): AIProvider {
  const bailuKey = process.env.BAILU_API_KEY;
  if (bailuKey && bailuKey.trim() !== '' && bailuKey !== 'your_bailu_api_key_here') {
    return new BailuAIProvider(bailuKey.trim(), process.env.BAILU_MODEL);
  }

  // Fallback to Demo Mode when BAILU_API_KEY is missing
  return new DemoAIProvider();
}
