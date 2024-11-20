import { EachMessagePayload } from 'kafkajs';
import { Logger } from 'pino';
import { IMessageController, MessageHandlerConfig, MessageHandler, MessageMiddleware, MiddlewareContext, HandlerContext, WriteHandler, WriteContext, TopicName } from '../interfaces';
import { ErrorType, MessageProcessingError, ValidationError, HandlerRegistrationError } from '../utils/error';
import { IDLQHandler } from '../interfaces';



export class MessageController implements IMessageController {
  private handlers: Map<TopicName, MessageHandler[]>;
  private middleware: Map<TopicName, MessageMiddleware[]>;
  private globalMiddleware: MessageMiddleware[];
  private handlerConfigs: Map<TopicName, MessageHandlerConfig>;
  private logger: Logger;
  private dlqHandler: IDLQHandler;

  constructor(logger: Logger, dlqHandler: IDLQHandler) {
    this.handlers = new Map<TopicName, MessageHandler[]>();
    this.middleware = new Map<TopicName, MessageMiddleware[]>();
    this.globalMiddleware = [];
    this.logger = logger;
    this.dlqHandler = dlqHandler;
    this.handlerConfigs = new Map<TopicName, MessageHandlerConfig>();
  }

  registerGlobalMiddleware<T,P>(middleware: MessageMiddleware<T>): void {
    this.globalMiddleware.push(middleware as MessageMiddleware);
    this.logger.info({ middlewareName: middleware.name }, 'Registered global middleware');
  }

  registerHandler<T,P>(config: MessageHandlerConfig<T,P>): void {
    const topic = config.topic;

    // Check if handlers or middlewares are already registered for this topic
    if (this.handlers.has(topic)) {
      throw new HandlerRegistrationError(
        `Handlers already registered for topic: ${topic}. A topic can only have one handler configuration.`
      );
    }

    if (this.middleware.has(topic)) {
      throw new HandlerRegistrationError(
        `Middlewares already registered for topic: ${topic}. A topic can only have one handler configuration.`
      );
    }

    // Register handlers
    this.handlers.set(topic, config.handlers as MessageHandler[]);
    this.logger.info({ topic, handlerCount: config.handlers.length }, 'Registered handlers for topic');

    // Register middlewares if present
    if (config.middlewares?.length) {
      this.middleware.set(topic, config.middlewares as MessageMiddleware[]);
      this.logger.info({ topic, middlewareCount: config.middlewares.length }, 'Registered middlewares for topic');
    }

    // Store the config
    this.handlerConfigs.set(topic, config as MessageHandlerConfig);
  }

  async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic } = payload;
    const handlers = this.handlers.get(topic);
    const topicMiddlewares = this.middleware.get(topic) || [];
    const config = this.handlerConfigs.get(topic);

    if (!handlers?.length) {
      this.logger.warn({ topic }, 'No handlers registered for topic');
      return;
    }

    try {
      // Create middleware context
      const middlewareContext: MiddlewareContext = {
        topic,
        payload,
        metadata: {},
        shouldSkipHandler: false,
        shouldSkipRemaining: false
      };

      // Execute global middlewares first
      for (const middleware of this.globalMiddleware) {
        try {
          await middleware(middlewareContext);
          if (middlewareContext.shouldSkipRemaining) {
            break;
          }
        } catch (error) {
          this.logger.error({ error, middleware: middleware.name }, 'Global middleware execution failed');
          if (!config?.continueOnError) {
            throw error;
          }
        }
      }

      // Execute topic-specific middlewares if not skipped
      if (!middlewareContext.shouldSkipHandler) {
        for (const middleware of topicMiddlewares) {
          try {
            await middleware(middlewareContext);
            if (middlewareContext.shouldSkipRemaining) {
              break;
            }
          } catch (error) {
            this.logger.error({ error, middleware: middleware.name }, 'Topic middleware execution failed');
            if (!config?.continueOnError) {
              throw error;
            }
          }
        }
      }

      // Create handler context
      const handlerContext: HandlerContext = {
        ...middlewareContext,
        skipRemainingHandlers: false,
        processedData: undefined
      };

      // Execute handlers if not skipped
      if (!middlewareContext.shouldSkipHandler) {
        for (const handler of handlers) {
          try {
            await handler(handlerContext);
            if (handlerContext.skipRemainingHandlers) {
              break;
            }
          } catch (error) {
            this.logger.error({ error, handler: handler.name }, 'Handler execution failed');
            if (!config?.continueOnError) {
              throw error;
            }
          }
        }
      }

      // Apply write handler if configured and not skipped
      if (config?.writeHandler && !middlewareContext.shouldSkipHandler) {
        const writeContext: WriteContext = {
          processedData: handlerContext.processedData,
          writeMetadata: handlerContext.metadata
        };
        
        try {
          await config.writeHandler(writeContext);
        } catch (error) {
          this.logger.error({ error }, 'Write handler execution failed');
          throw error;
        }
      }
    } catch (error) {
      // Handle any uncaught errors
      if (error instanceof ValidationError) {
        await this.dlqHandler.handleFailedMessage(payload, new MessageProcessingError('Validation failed', ErrorType.NON_RETRYABLE, error));
      } else if (error instanceof Error) {
        throw new MessageProcessingError('Message processing failed', ErrorType.RETRYABLE, error);
      } else {
        throw error;
      }
    }
  }

  getRegisteredTopics(): string[] {
    return Array.from(this.handlers.keys());
  }
}
