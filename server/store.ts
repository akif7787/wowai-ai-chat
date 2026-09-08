import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { hashPassword } from './auth.ts';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  name: string;
  avatar: string;
  createdAt: number;
}

export interface ChatMessageRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isError?: boolean;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessageRecord[];
  createdAt: number;
  updatedAt: number;
}

interface DatabaseSchema {
  users: Record<string, UserRecord>;
  conversations: Record<string, ConversationRecord>;
}

class Store {
  private memoryDb: DatabaseSchema = {
    users: {},
    conversations: {},
  };
  private dbFilePath: string;
  private isLoaded = false;

  constructor() {
    // Persistent storage file in process.cwd()/data/database.json
    const dataDir = path.join(process.cwd(), 'data');
    this.dbFilePath = path.join(dataDir, 'database.json');
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.memoryDb.users = parsed.users || {};
          this.memoryDb.conversations = parsed.conversations || {};
        }
      } else {
        // Seed initial default demo user (akif7787@gmail.com) with secure hashed password
        const { hash, salt } = hashPassword('password123');
        const defaultUser: UserRecord = {
          id: 'user_default_akif',
          email: 'akif7787@gmail.com',
          passwordHash: hash,
          salt: salt,
          name: 'Ahanaf Akif',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          createdAt: Date.now(),
        };
        this.memoryDb.users[defaultUser.id] = defaultUser;
        this.saveToDisk();
      }
      this.isLoaded = true;
    } catch (err) {
      console.warn('[Store] Notice: Disk persistence fallback to in-memory mode:', err);
      this.isLoaded = true;
    }
  }

  private saveToDisk() {
    try {
      const dataDir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      // Atomic write to prevent partial file writes
      const tempPath = `${this.dbFilePath}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.memoryDb, null, 2), 'utf8');
      fs.renameSync(tempPath, this.dbFilePath);
    } catch (err) {
      // In read-only serverless lambdas, memory persistence is preserved for the instance duration
      console.warn('[Store] Write to disk skipped (serverless read-only or in-memory runtime):', err);
    }
  }

  // --- USER METHODS ---

  public findUserByEmail(email: string): UserRecord | null {
    const normalized = email.toLowerCase().trim();
    for (const id in this.memoryDb.users) {
      if (this.memoryDb.users[id].email.toLowerCase().trim() === normalized) {
        return this.memoryDb.users[id];
      }
    }
    return null;
  }

  public findUserById(userId: string): UserRecord | null {
    return this.memoryDb.users[userId] || null;
  }

  public createUser(email: string, passwordHash: string, salt: string, name: string): UserRecord {
    const userId = 'user_' + crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const newUser: UserRecord = {
      id: userId,
      email: email.toLowerCase().trim(),
      passwordHash,
      salt,
      name: name.trim() || 'User',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name.trim() || email)}`,
      createdAt: Date.now(),
    };
    this.memoryDb.users[userId] = newUser;
    this.saveToDisk();
    return newUser;
  }

  // --- CONVERSATION METHODS (Strict userId isolation) ---

  public getConversationsForUser(userId: string): ConversationRecord[] {
    const list: ConversationRecord[] = [];
    for (const id in this.memoryDb.conversations) {
      const conv = this.memoryDb.conversations[id];
      if (conv.userId === userId) {
        list.push(conv);
      }
    }
    // Return newest updated first
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public getConversationById(convId: string, userId: string): ConversationRecord | null {
    const conv = this.memoryDb.conversations[convId];
    if (!conv) return null;
    // Strict ownership verification: user can ONLY access their own conversation
    if (conv.userId !== userId) {
      return null;
    }
    return conv;
  }

  public createConversation(userId: string, title?: string, initialMessages?: ChatMessageRecord[], customId?: string): ConversationRecord {
    const convId = customId || `chat_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newConv: ConversationRecord = {
      id: convId,
      userId,
      title: title?.trim() || 'New Chat',
      messages: initialMessages || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.memoryDb.conversations[convId] = newConv;
    this.saveToDisk();
    return newConv;
  }

  public updateConversation(
    convId: string,
    userId: string,
    updates: { title?: string; messages?: ChatMessageRecord[] }
  ): ConversationRecord | null {
    const conv = this.memoryDb.conversations[convId];
    if (!conv || conv.userId !== userId) {
      return null; // Not found or forbidden
    }

    if (updates.title !== undefined) {
      conv.title = updates.title.trim();
    }
    if (updates.messages !== undefined) {
      conv.messages = updates.messages;
    }
    conv.updatedAt = Date.now();
    this.saveToDisk();
    return conv;
  }

  public deleteConversation(convId: string, userId: string): boolean {
    const conv = this.memoryDb.conversations[convId];
    if (!conv || conv.userId !== userId) {
      return false;
    }
    delete this.memoryDb.conversations[convId];
    this.saveToDisk();
    return true;
  }

  public clearAllConversationsForUser(userId: string): number {
    let count = 0;
    for (const id in this.memoryDb.conversations) {
      if (this.memoryDb.conversations[id].userId === userId) {
        delete this.memoryDb.conversations[id];
        count++;
      }
    }
    if (count > 0) {
      this.saveToDisk();
    }
    return count;
  }
}

// Global singleton instance for the server runtime
export const store = new Store();
