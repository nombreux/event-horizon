import { Kafka, Consumer, Producer } from 'kafkajs';
import { Logger } from 'pino';
import config from '../config';
import { KafkaClientFactory } from '../interfaces';

export class DefaultKafkaFactory implements KafkaClientFactory {
  private kafka: Kafka;
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers
    });
  }

  createConsumer(): Consumer {
    this.logger.info('Creating Kafka consumer');
    return this.kafka.consumer({
      groupId: config.kafka.groupId,
      allowAutoTopicCreation: true,
      retry: {
        retries: 10,
      },
    });
  }

  createProducer(): Producer {
    this.logger.info('Creating Kafka producer');
    return this.kafka.producer();
  }
} 