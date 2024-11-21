import { Logger } from 'pino';
import { IProducerService } from '../interfaces';
import { IIngestionController, IngestionHandlerConfig, IngestionContext } from '../interfaces/ingestion.types';
import { Message } from 'kafkajs';

export class IngestionController implements IIngestionController {
  private handlers: Map<string, IngestionHandlerConfig> = new Map();
  private isRunning: boolean = false;

  constructor(
    private readonly logger: Logger,
    private readonly producerService: IProducerService
  ) {}

  registerHandler(config: IngestionHandlerConfig): void {
    if (this.handlers.has(config.topic)) {
      throw new Error(`Handler already registered for topic ${config.topic}`);
    }
    this.handlers.set(config.topic, config);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Ingestion controller is already running');
      return;
    }

    this.isRunning = true;

    // Start all handlers
    for (const [topic, config] of this.handlers.entries()) {
      this.startHandler(topic, config);
    }

    this.logger.info('Ingestion controller started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.logger.info('Ingestion controller stopped');
  }

  getRegisteredTopics(): string[] {
    return Array.from(this.handlers.keys());
  }

  private startHandler(topic: string, config: IngestionHandlerConfig): void {
    const context: IngestionContext = {
      logger: this.logger,
      metadata: {
        topic,
        timestamp: new Date().toISOString(),
      },
      onData: async (messages: Message[]) => {
        if (messages && messages.length > 0) {
          try {
            await this.producerService.sendMessage(topic, messages);
            this.logger.debug({ topic, count: messages.length }, 'Successfully sent messages to Kafka');
          } catch (error) {
            this.logger.error({ topic, error }, 'Failed to send messages to Kafka');
            throw error;
          }
        }
      },
    };

    // Start the handler
    config.handler(context).catch((error) => {
      this.logger.error({ topic, error }, 'Handler execution failed');
    });
  }
}
