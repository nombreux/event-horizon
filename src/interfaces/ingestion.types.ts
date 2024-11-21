import { Message } from 'kafkajs';
import { Logger } from 'pino';

export interface IngestionContext {
  logger: Logger;
  metadata: Record<string, unknown>;
  onData: (messages: Message[]) => Promise<void>;
}

export type IngestionHandler = (context: IngestionContext) => Promise<void>;

export interface IngestionHandlerConfig {
  topic: string;
  handler: IngestionHandler;
  transform?: (data: any[]) => Message[];
}

export interface IIngestionController {
  registerHandler(config: IngestionHandlerConfig): void;
  start(): Promise<void>;
  stop(): Promise<void>;
  getRegisteredTopics(): string[];
}
