import { Logger } from 'pino';
import { ConsumerService } from '../services/consumer.service';
import { ProducerService } from '../services/producer.service';
import { DLQHandler } from '../services/dlq.service';
import { MessageController } from '../controllers/message.controller';
import { DefaultKafkaFactory } from './kafka.factory';
import { IAppFactory } from '../interfaces';

export class AppFactory implements IAppFactory {
  private kafkaFactory: DefaultKafkaFactory;
  private consumerService?: ConsumerService;
  private producerService?: ProducerService;
  private dlqHandler?: DLQHandler;
  private messageController?: MessageController;

  constructor(private readonly logger: Logger) {
    this.kafkaFactory = new DefaultKafkaFactory(logger);
  }

  getConsumerService(): ConsumerService {
    if (!this.consumerService) {
      const consumer = this.kafkaFactory.createConsumer();
      this.consumerService = new ConsumerService(consumer, this.logger);
    }
    return this.consumerService;
  }

  getProducerService(): ProducerService {
    if (!this.producerService) {
      const producer = this.kafkaFactory.createProducer();
      this.producerService = new ProducerService(producer, this.logger);
    }
    return this.producerService;
  }

  getDLQHandler(): DLQHandler {
    if (!this.dlqHandler) {
      const producerService = this.getProducerService();
      this.dlqHandler = new DLQHandler(producerService, this.logger);
    }
    return this.dlqHandler;
  }

  getMessageController(): MessageController {
    if (!this.messageController) {
      const dlqHandler = this.getDLQHandler();
      this.messageController = new MessageController(this.logger, dlqHandler);
    }
    return this.messageController;
  }
} 