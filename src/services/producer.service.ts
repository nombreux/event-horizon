import { Producer, Message } from 'kafkajs';
import { Logger } from 'pino';
import { IProducerService } from '../interfaces';

export class ProducerService implements IProducerService {
  constructor(
    private readonly producer: Producer,
    private readonly logger: Logger
  ) {}

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.logger.info('Producer connected to Kafka');
    } catch (error) {
      this.logger.error('Failed to connect producer to Kafka', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      this.logger.info('Producer disconnected from Kafka');
    } catch (error) {
      this.logger.error('Failed to disconnect producer from Kafka', error);
      throw error;
    }
  }

  async sendMessage(topic: string, messages: Message[]): Promise<void> {
    try {
      await this.producer.send({
        topic,
        messages
      });
      this.logger.info({ topic, messageCount: messages.length }, 'Messages sent successfully');
    } catch (error) {
      this.logger.error({ topic, error }, 'Failed to send messages');
      throw error;
    }
  }
} 