import type { QueuedMessage } from '../types/socket';

const MAX_QUEUE_SIZE = 100;
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class MessageQueue {
  private queue: QueuedMessage[] = [];

  add(event: string, data: unknown, priority: number = 0): void {
    // Remove expired messages
    this.cleanExpired();

    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn('Message queue full, removing oldest message');
      this.queue.shift();
    }

    const message: QueuedMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event,
      data,
      timestamp: Date.now(),
      priority,
      ttl: DEFAULT_TTL,
    };

    this.queue.push(message);
    // Sort by priority (higher priority first)
    this.queue.sort((a, b) => b.priority - a.priority);
  }

  getAll(): QueuedMessage[] {
    this.cleanExpired();
    return [...this.queue];
  }

  clear(): void {
    this.queue = [];
  }

  size(): number {
    this.cleanExpired();
    return this.queue.length;
  }

  private cleanExpired(): void {
    const now = Date.now();
    this.queue = this.queue.filter(
      (msg) => now - msg.timestamp < msg.ttl
    );
  }

  isEmpty(): boolean {
    this.cleanExpired();
    return this.queue.length === 0;
  }
}

export const messageQueue = new MessageQueue();
