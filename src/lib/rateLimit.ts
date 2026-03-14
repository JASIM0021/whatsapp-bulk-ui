export interface RateLimitConfig {
  minDelay: number;
  maxDelay: number;
  hourlyMax: number;
  dailyMax: number;
}

export class RateLimiter {
  private sentInLastHour: number[] = [];
  private sentInLastDay: number[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async waitIfNeeded(): Promise<void> {
    // Clean old timestamps
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    this.sentInLastHour = this.sentInLastHour.filter(t => t > oneHourAgo);
    this.sentInLastDay = this.sentInLastDay.filter(t => t > oneDayAgo);

    // Check limits
    if (this.sentInLastHour.length >= this.config.hourlyMax) {
      throw new Error(`Hourly limit of ${this.config.hourlyMax} messages reached`);
    }

    if (this.sentInLastDay.length >= this.config.dailyMax) {
      throw new Error(`Daily limit of ${this.config.dailyMax} messages reached`);
    }

    // Random delay between messages
    const delay = this.getRandomDelay();
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  recordMessage(): void {
    const now = Date.now();
    this.sentInLastHour.push(now);
    this.sentInLastDay.push(now);
  }

  private getRandomDelay(): number {
    const { minDelay, maxDelay } = this.config;
    return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
  }

  getStatus() {
    return {
      sentInLastHour: this.sentInLastHour.length,
      sentInLastDay: this.sentInLastDay.length,
      hourlyLimit: this.config.hourlyMax,
      dailyLimit: this.config.dailyMax,
    };
  }
}
