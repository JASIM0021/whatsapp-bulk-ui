import { MessageTask, SendProgress } from '@/types/message';
import { formatPhoneForWhatsApp } from '../validation';
import { sendMessage } from './client';
import { RateLimiter } from '../rateLimit';

export class MessageQueue {
  private queue: MessageTask[] = [];
  private isProcessing = false;
  private rateLimiter: RateLimiter;
  private progressCallback?: (progress: SendProgress) => void;

  constructor() {
    this.rateLimiter = new RateLimiter({
      minDelay: parseInt(process.env.RATE_LIMIT_MIN_DELAY || '3000'),
      maxDelay: parseInt(process.env.RATE_LIMIT_MAX_DELAY || '5000'),
      hourlyMax: parseInt(process.env.RATE_LIMIT_HOURLY_MAX || '50'),
      dailyMax: parseInt(process.env.RATE_LIMIT_DAILY_MAX || '250'),
    });
  }

  addTasks(tasks: MessageTask[]): void {
    this.queue.push(...tasks);
  }

  onProgress(callback: (progress: SendProgress) => void): void {
    this.progressCallback = callback;
  }

  async start(): Promise<SendProgress> {
    if (this.isProcessing) {
      throw new Error('Queue is already processing');
    }

    this.isProcessing = true;

    const progress: SendProgress = {
      total: this.queue.length,
      sent: 0,
      failed: 0,
      errors: [],
    };

    try {
      for (const task of this.queue) {
        if (!this.isProcessing) {
          break;
        }

        try {
          // Update task status
          task.status = 'sending';
          progress.current = task.contact.name || task.contact.phone;

          // Notify progress
          if (this.progressCallback) {
            this.progressCallback({ ...progress });
          }

          // Wait for rate limiting
          await this.rateLimiter.waitIfNeeded();

          // Format phone number for WhatsApp
          const whatsappNumber = formatPhoneForWhatsApp(task.contact.phone);

          // Compose message text
          let messageText = task.message.text;
          if (task.message.link) {
            messageText += `\n\n${task.message.link}`;
          }

          // Send message
          await sendMessage(whatsappNumber, messageText, task.message.imageUrl);

          // Record successful send
          this.rateLimiter.recordMessage();
          task.status = 'sent';
          task.timestamp = Date.now();
          progress.sent++;

        } catch (error: any) {
          console.error(`Failed to send message to ${task.contact.phone}:`, error);

          task.attempts++;
          task.error = error.message;

          // Retry logic (max 3 attempts)
          if (task.attempts < 3) {
            task.status = 'pending';
            this.queue.push(task); // Re-queue for retry
          } else {
            task.status = 'failed';
            progress.failed++;
            progress.errors.push({
              contactId: task.contact.id,
              phone: task.contact.phone,
              error: error.message,
            });
          }
        }

        // Notify progress after each message
        if (this.progressCallback) {
          this.progressCallback({ ...progress });
        }
      }
    } catch (error: any) {
      console.error('Queue processing error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
      this.queue = [];
    }

    return progress;
  }

  stop(): void {
    this.isProcessing = false;
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      rateLimitStatus: this.rateLimiter.getStatus(),
    };
  }
}
