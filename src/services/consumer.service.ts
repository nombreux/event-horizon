import { Consumer, EachMessagePayload } from 'kafkajs';
import { Logger } from 'pino';
import { IConsumerService, TopicName } from '../interfaces';
import { KafkaConnectionError } from '../utils/error';

export class ConsumerService implements IConsumerService {
  private readonly maxReconnectAttempts = 3;
  private readonly reconnectDelay = 5000; // 5 seconds

  constructor(
    private readonly consumer: Consumer,
    private readonly logger: Logger,
  ) { }

  private async attemptConnection(operation: () => Promise<void>, operationName: string): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.maxReconnectAttempts) {
      try {
        await operation();
        return;
      } catch (error) {
        attempts++;
        this.logger.error(
          { error, attempt: attempts, maxAttempts: this.maxReconnectAttempts },
          `Failed to ${operationName}`
        );

        if (attempts === this.maxReconnectAttempts) {
          throw new KafkaConnectionError(
            `Failed to ${operationName} after ${this.maxReconnectAttempts} attempts`,
            error instanceof Error ? error : undefined
          );
        }

        await new Promise(resolve => setTimeout(resolve, this.reconnectDelay));
      }
    }
  }

  async connect(): Promise<void> {
    await this.attemptConnection(
      async () => await this.consumer?.connect(),
      'connect to Kafka'
    );
  }

  async subscribe(topics: TopicName[]): Promise<void> {
    if(!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Topics must be an array of strings');
    }
    await this.attemptConnection(
      async () => {
        await this.consumer?.subscribe({ 
          topics: topics 
        });
        this.logger.info('Subscribed to topics');
      },
      'subscribe to topics'
    );
  }

  async startConsumer(messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void> {
    try {
      await this.consumer?.run({
        eachMessage: async (payload) => {
          try {
            await messageHandler(payload);
          } catch (error) {
            this.logger.error({
              error,
              topic: payload.topic,
              partition: payload.partition,
              offset: payload.message.offset,
            }, 'Message processing failed');
            throw error;
          }
        }
      });
    } catch (error) {
      throw new KafkaConnectionError(
        'Failed to start consumer',
        error instanceof Error ? error : undefined
      );
    }
  }

  async disconnect(): Promise<void> {
    await this.attemptConnection(
      async () => {
        await this.consumer?.disconnect();
        this.logger.info('Disconnected from Kafka');
      },
      'disconnect from Kafka'
    );
  }
}