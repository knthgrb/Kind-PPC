/**
 * Client-side conversation cache service with IndexedDB persistence and encryption
 * Implements Tinder-like caching strategy:
 * - Hybrid approach: In-memory for speed + IndexedDB for persistence
 * - Progressive loading (only fetch what's needed)
 * - Cache-first approach for instant UI updates
 * - Background refresh for real-time updates
 * - Survives page refreshes and browser restarts
 * - AES-GCM encryption for IndexedDB storage (defense in depth)
 */

import { logger } from "@/utils/logger";

/**
 * Encryption utility using Web Crypto API (native browser API)
 * Encrypts data before storing in IndexedDB for additional security
 */
class EncryptionService {
  private keyCache: Map<string, CryptoKey> = new Map();

  /**
   * Derive encryption key from user ID using PBKDF2
   * Uses a salt based on the app name to ensure uniqueness
   */
  private async deriveKey(userId: string): Promise<CryptoKey> {
    // Check cache first
    if (this.keyCache.has(userId)) {
      return this.keyCache.get(userId)!;
    }

    // Import password as key material
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(userId),
      "PBKDF2",
      false,
      ["deriveBits", "deriveKey"]
    );

    // Use app-specific salt (prevents rainbow table attacks)
    const salt = new TextEncoder().encode("kind-platform-cache-salt-v1");

    // Derive key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    // Cache the key
    this.keyCache.set(userId, key);
    return key;
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(userId: string, data: any): Promise<string> {
    if (typeof window === "undefined") {
      throw new Error("Encryption only available in browser");
    }

    try {
      const key = await this.deriveKey(userId);
      const dataString = JSON.stringify(data);
      const dataBytes = new TextEncoder().encode(dataString);

      // Generate random IV (Initialization Vector) for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt
      const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: iv },
        key,
        dataBytes
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      logger.error("Encryption failed:", error);
      throw error;
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(userId: string, encryptedData: string): Promise<any> {
    if (typeof window === "undefined") {
      throw new Error("Decryption only available in browser");
    }

    try {
      const key = await this.deriveKey(userId);

      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), (c) =>
        c.charCodeAt(0)
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        encrypted
      );

      // Convert back to JSON
      const dataString = new TextDecoder().decode(decrypted);
      return JSON.parse(dataString);
    } catch (error) {
      logger.error("Decryption failed:", error);
      throw error;
    }
  }

  /**
   * Clear key cache (call on logout)
   */
  clearCache(): void {
    this.keyCache.clear();
  }
}

interface CachedConversation {
  id: string;
  conversation: any;
  messages: any[];
  match?: any;
  lastFetched: number;
  isTemporary?: boolean;
}

interface CachedProfile {
  userId: string;
  profile: any;
  lastFetched: number;
}

interface EncryptedCacheEntry {
  id: string;
  encryptedData: string;
  lastFetched: number;
}

class ConversationCacheService {
  private conversationCache: Map<string, CachedConversation> = new Map();
  private profileCache: Map<string, CachedProfile> = new Map();
  private readonly CONVERSATION_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PROFILE_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly MAX_CACHE_SIZE = 50; // Maximum cached conversations

  // Encryption
  private encryptionService = new EncryptionService();
  private currentUserId: string | null = null;

  // IndexedDB
  private dbName = "kind-conversation-cache";
  private dbVersion = 2; // Incremented for encryption support
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void> | null = null;
  private isInitialized = false;

  /**
   * Set current user ID for encryption
   * Call this when user logs in or when user ID is available
   */
  setUserId(userId: string | null): void {
    this.currentUserId = userId;
    if (!userId) {
      // Clear encryption cache on logout
      this.encryptionService.clearCache();
    }
  }

  /**
   * Get current user ID (for encryption)
   * Falls back to checking localStorage or sessionStorage
   */
  private getUserId(): string | null {
    if (this.currentUserId) {
      return this.currentUserId;
    }

    // Try to get from auth store (if available)
    if (typeof window !== "undefined") {
      try {
        const authData = localStorage.getItem("auth-storage");
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed?.state?.user?.id) {
            return parsed.state.user.id;
          }
        }
      } catch (error) {
        // Ignore errors
      }
    }

    return null;
  }

  /**
   * Initialize IndexedDB database
   */
  private async initIndexedDB(): Promise<void> {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }

    if (this.dbReady) {
      return this.dbReady;
    }

    this.dbReady = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        logger.error("Failed to open IndexedDB:", request.error);
        this.dbReady = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        logger.debug("IndexedDB initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Delete old stores if they exist (for migration)
        if (db.objectStoreNames.contains("conversations")) {
          db.deleteObjectStore("conversations");
        }
        if (db.objectStoreNames.contains("profiles")) {
          db.deleteObjectStore("profiles");
        }

        // Create new stores with encryption support
        if (!db.objectStoreNames.contains("conversations")) {
          const conversationStore = db.createObjectStore("conversations", {
            keyPath: "id",
          });
          conversationStore.createIndex("lastFetched", "lastFetched", {
            unique: false,
          });
        }

        if (!db.objectStoreNames.contains("profiles")) {
          const profileStore = db.createObjectStore("profiles", {
            keyPath: "userId",
          });
          profileStore.createIndex("lastFetched", "lastFetched", {
            unique: false,
          });
        }

        logger.debug("IndexedDB schema upgraded to v2 (encryption support)");
      };
    });

    return this.dbReady;
  }

  /**
   * Load all conversations from IndexedDB into memory on startup
   * Decrypts data if encryption is enabled
   */
  async loadFromIndexedDB(): Promise<void> {
    if (typeof window === "undefined") return;

    const userId = this.getUserId();
    if (!userId) {
      logger.debug("No user ID available, skipping IndexedDB load");
      return;
    }

    try {
      await this.initIndexedDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["conversations"], "readonly");
        const store = transaction.objectStore("conversations");
        const request = store.getAll();

        request.onsuccess = async () => {
          const entries = request.result as EncryptedCacheEntry[];
          const now = Date.now();
          let loadedCount = 0;
          let errorCount = 0;

          // Decrypt and load conversations
          for (const entry of entries) {
            try {
              // Only load non-expired conversations (2x TTL for persistence)
              if (now - entry.lastFetched < this.CONVERSATION_TTL * 2) {
                // Decrypt the data
                const decrypted = await this.encryptionService.decrypt(
                  userId,
                  entry.encryptedData
                );
                this.conversationCache.set(entry.id, decrypted);
                loadedCount++;
              }
            } catch (error) {
              // If decryption fails, skip this entry (might be from old format or different user)
              errorCount++;
              logger.warn("Failed to decrypt cached conversation:", {
                id: entry.id,
                error,
              });
            }
          }

          logger.debug("Loaded conversations from IndexedDB:", {
            total: entries.length,
            loaded: loadedCount,
            errors: errorCount,
          });
          resolve();
        };

        request.onerror = () => {
          logger.error("Failed to load from IndexedDB:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.warn("Error loading from IndexedDB:", error);
    }
  }

  /**
   * Save conversation to IndexedDB with encryption (async, non-blocking)
   */
  private async saveToIndexedDB(
    conversationId: string,
    data: CachedConversation
  ): Promise<void> {
    if (typeof window === "undefined") return;
    if (data.isTemporary) return; // Don't persist temporary conversations

    const userId = this.getUserId();
    if (!userId) {
      logger.debug("No user ID available, skipping IndexedDB save");
      return;
    }

    try {
      await this.initIndexedDB();
      if (!this.db) return;

      // Encrypt the data before storing
      const encryptedData = await this.encryptionService.encrypt(userId, data);

      const entry: EncryptedCacheEntry = {
        id: conversationId,
        encryptedData,
        lastFetched: data.lastFetched,
      };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(
          ["conversations"],
          "readwrite"
        );
        const store = transaction.objectStore("conversations");
        const request = store.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          logger.warn("Failed to save to IndexedDB:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.warn("Error saving to IndexedDB:", error);
    }
  }

  /**
   * Get cached conversation (checks memory first, then IndexedDB)
   * Returns sync for memory cache, async for IndexedDB fallback
   */
  getConversation(conversationId: string): CachedConversation | null {
    // Check memory first (instant, synchronous)
    const cached = this.conversationCache.get(conversationId);
    if (cached) {
      const now = Date.now();
      if (now - cached.lastFetched < this.CONVERSATION_TTL) {
        return cached;
      }
      // Return stale data for instant UI
      logger.debug("Returning stale conversation cache:", { conversationId });
      return cached;
    }

    return null;
  }

  /**
   * Get conversation from IndexedDB (async fallback)
   * Decrypts data if encryption is enabled
   */
  async getConversationFromIndexedDB(
    conversationId: string
  ): Promise<CachedConversation | null> {
    if (typeof window === "undefined") return null;

    const userId = this.getUserId();
    if (!userId) {
      logger.debug("No user ID available, skipping IndexedDB read");
      return null;
    }

    try {
      await this.initIndexedDB();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(["conversations"], "readonly");
        const store = transaction.objectStore("conversations");
        const request = store.get(conversationId);

        request.onsuccess = async () => {
          const entry = request.result as EncryptedCacheEntry | undefined;
          if (!entry) {
            resolve(null);
            return;
          }

          try {
            // Decrypt the data
            const decrypted = await this.encryptionService.decrypt(
              userId,
              entry.encryptedData
            );

            // Load into memory for faster access
            this.conversationCache.set(conversationId, decrypted);
            resolve(decrypted);
          } catch (error) {
            // If decryption fails, skip this entry (might be from different user or corrupted)
            logger.warn("Failed to decrypt cached conversation:", {
              conversationId,
              error,
            });
            resolve(null);
          }
        };
        request.onerror = () => {
          logger.warn("Error reading from IndexedDB:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.warn("Error reading from IndexedDB:", error);
      return null;
    }
  }

  /**
   * Set conversation in cache (memory + IndexedDB)
   */
  setConversation(
    conversationId: string,
    data: {
      conversation?: any;
      messages?: any[];
      match?: any;
      isTemporary?: boolean;
    }
  ): void {
    // Enforce max cache size (LRU eviction)
    if (this.conversationCache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    const existing = this.conversationCache.get(conversationId);
    const now = Date.now();

    const cachedData: CachedConversation = {
      id: conversationId,
      conversation: data.conversation ?? existing?.conversation,
      messages: data.messages ?? existing?.messages ?? [],
      match: data.match ?? existing?.match,
      lastFetched: existing?.lastFetched ?? now,
      isTemporary: data.isTemporary ?? existing?.isTemporary,
    };

    // Update memory cache (instant, synchronous)
    this.conversationCache.set(conversationId, cachedData);

    // Save to IndexedDB (async, non-blocking)
    if (!cachedData.isTemporary) {
      // Don't persist temporary conversations
      this.saveToIndexedDB(conversationId, cachedData).catch((error) => {
        logger.warn("Failed to persist conversation to IndexedDB:", error);
      });
    }

    logger.debug("Cached conversation:", { conversationId });
  }

  /**
   * Update messages for a conversation (append or replace)
   * Updates both memory and IndexedDB
   */
  updateMessages(
    conversationId: string,
    messages: any[],
    append: boolean = false
  ): void {
    const cached = this.conversationCache.get(conversationId);
    if (!cached) {
      this.setConversation(conversationId, { messages });
      return;
    }

    if (append) {
      // Merge messages, avoiding duplicates
      const existingIds = new Set(cached.messages.map((m) => m.id));
      const newMessages = messages.filter((m) => !existingIds.has(m.id));
      cached.messages = [...cached.messages, ...newMessages].sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else {
      cached.messages = messages;
    }

    cached.lastFetched = Date.now();

    // Persist to IndexedDB (async, non-blocking)
    if (!cached.isTemporary) {
      this.saveToIndexedDB(conversationId, cached).catch((error) => {
        logger.warn("Failed to persist updated messages to IndexedDB:", error);
      });
    }

    logger.debug("Updated cached messages:", {
      conversationId,
      messageCount: cached.messages.length,
    });
  }

  /**
   * Get cached profile
   */
  getProfile(userId: string): any | null {
    const cached = this.profileCache.get(userId);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.lastFetched > this.PROFILE_TTL) {
      return cached.profile; // Return stale data
    }

    return cached.profile;
  }

  /**
   * Set profile in cache
   */
  setProfile(userId: string, profile: any): void {
    this.profileCache.set(userId, {
      userId,
      profile,
      lastFetched: Date.now(),
    });
  }

  /**
   * Invalidate conversation cache (memory + IndexedDB)
   */
  async invalidateConversation(conversationId: string): Promise<void> {
    // Remove from memory
    this.conversationCache.delete(conversationId);

    // Remove from IndexedDB
    if (typeof window !== "undefined") {
      try {
        await this.initIndexedDB();
        if (this.db) {
          const transaction = this.db.transaction(
            ["conversations"],
            "readwrite"
          );
          const store = transaction.objectStore("conversations");
          store.delete(conversationId);
        }
      } catch (error) {
        logger.warn("Failed to delete from IndexedDB:", error);
      }
    }

    logger.debug("Invalidated conversation cache:", { conversationId });
  }

  /**
   * Invalidate all caches for a user
   */
  invalidateUser(userId: string): void {
    // Remove conversations involving this user
    for (const [id, cached] of this.conversationCache.entries()) {
      const conv = cached.conversation;
      if (
        conv?.kindbossing_user_id === userId ||
        conv?.kindtao_user_id === userId
      ) {
        this.conversationCache.delete(id);
      }
    }

    // Remove profile
    this.profileCache.delete(userId);
  }

  /**
   * Clear all caches (memory + IndexedDB + encryption keys)
   */
  async clear(): Promise<void> {
    // Clear memory
    this.conversationCache.clear();
    this.profileCache.clear();

    // Clear encryption key cache
    this.encryptionService.clearCache();
    this.currentUserId = null;

    // Clear IndexedDB
    if (typeof window !== "undefined") {
      try {
        await this.initIndexedDB();
        if (this.db) {
          const transaction = this.db.transaction(
            ["conversations", "profiles"],
            "readwrite"
          );
          transaction.objectStore("conversations").clear();
          transaction.objectStore("profiles").clear();
        }
      } catch (error) {
        logger.warn("Failed to clear IndexedDB:", error);
      }
    }

    logger.debug("Cleared all conversation caches and encryption keys");
  }

  /**
   * Clear expired entries from IndexedDB
   */
  async cleanupIndexedDB(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      await this.initIndexedDB();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction(
          ["conversations"],
          "readwrite"
        );
        const store = transaction.objectStore("conversations");
        const index = store.index("lastFetched");
        const now = Date.now();
        const maxAge = this.CONVERSATION_TTL * 7; // Keep for 7x TTL in IndexedDB

        const request = index.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const entry = cursor.value as EncryptedCacheEntry;
            if (now - entry.lastFetched > maxAge) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            logger.debug("IndexedDB cleanup completed");
            resolve();
          }
        };
        request.onerror = () => {
          logger.warn("IndexedDB cleanup failed:", request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      logger.warn("Error during IndexedDB cleanup:", error);
    }
  }

  /**
   * Evict oldest cache entry (LRU)
   */
  private evictOldest(): void {
    let oldestId: string | null = null;
    let oldestTime = Date.now();

    for (const [id, cached] of this.conversationCache.entries()) {
      if (cached.lastFetched < oldestTime) {
        oldestTime = cached.lastFetched;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.conversationCache.delete(oldestId);
      logger.debug("Evicted oldest cache entry:", { conversationId: oldestId });
    }
  }

  /**
   * Get cache stats (for debugging)
   */
  getStats() {
    return {
      conversations: this.conversationCache.size,
      profiles: this.profileCache.size,
    };
  }
}

// Export singleton instance
export const conversationCache = new ConversationCacheService();

// Initialize IndexedDB and load cached data on module load (if in browser)
if (typeof window !== "undefined") {
  // Load from IndexedDB on startup
  conversationCache.loadFromIndexedDB().catch((error) => {
    logger.error("Failed to load cache from IndexedDB:", error);
  });

  // Cleanup expired entries every hour
  setInterval(
    () => {
      conversationCache.cleanupIndexedDB().catch((error) => {
        logger.warn("Failed to cleanup IndexedDB:", error);
      });
    },
    60 * 60 * 1000
  ); // 1 hour
}
