import { EachMessagePayload, Consumer, Producer, Message } from 'kafkajs';
import { ConsumerService } from '../services/consumer.service';
import { MessageController } from '../controllers/message.controller';
import { DLQHandler } from '../services/dlq.service';
import { ProducerService } from '../services/producer.service';
import { MessageProcessingError } from '../utils/error';
import { TopicName } from './topic.types';

export interface KafkaClientFactory {
  createConsumer(): Consumer;
  createProducer(): Producer;
}

export interface IConsumerService {
  connect(): Promise<void>;
  subscribe(topics: TopicName[]): Promise<void>;
  startConsumer(messageHandler: (payload: EachMessagePayload) => Promise<void>): Promise<void>;
  disconnect(): Promise<void>;
}

export interface IProducerService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(topic: string, messages: Message[]): Promise<void>;
}

export interface IMessageController {
  registerHandler<T = unknown>(config: MessageHandlerConfig<T>): void;
  registerGlobalMiddleware<T = unknown>(middleware: MessageMiddleware<T>): void;
  handleMessage(payload: EachMessagePayload): Promise<void>;
  getRegisteredTopics(): string[];
}

export interface MessageHandlerConfig<T = unknown, P = unknown> {
  topic: string;
  handlers: Array<MessageHandler<T>>;
  middlewares?: Array<MessageMiddleware<T>>;
  continueOnError?: boolean;
  writeHandler?: WriteHandler<P>;
}

export interface MiddlewareContext<T = unknown> {
  topic: string;
  payload: EachMessagePayload;
  metadata: Record<string, unknown>;
  parsedMessage?: T;
  shouldSkipRemaining?: boolean;
  shouldSkipHandler?: boolean;
}

export interface HandlerContext<T = unknown> extends MiddlewareContext<T> {
  skipRemainingHandlers?: boolean;
  processedData?: unknown;
}

export interface WriteContext<P = unknown> {
  processedData?: P;
  writeMetadata?: Record<string, unknown>;
}

export type MessageHandler<T = unknown> = (context: HandlerContext<T>) => Promise<void>;
export type MessageMiddleware<T = unknown> = (context: MiddlewareContext<T>) => Promise<void>;
export type WriteHandler<P = unknown> = (context: WriteContext<P>) => Promise<void>;

export interface IServiceFactory {
  getConsumerService(): ConsumerService;
  getProducerService(): ProducerService;
  getDLQHandler(): DLQHandler;
}

export interface IAppFactory {
  getConsumerService(): ConsumerService;
  getProducerService(): ProducerService;
  getDLQHandler(): DLQHandler;
  getMessageController(): MessageController;
}

export interface IDLQHandler {
  handleFailedMessage(payload: EachMessagePayload, error: MessageProcessingError): Promise<void>;
}

// Define your message type

export * from './medicine.types';

export * from './topic.types';