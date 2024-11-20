import { MessageController } from '../controllers/message.controller';
import { mainTopicHandler } from './main-topic.handler';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { mainTopicWriteHandler } from './write-handlers/write-handlers';
import { KafkaTopics, MainTopicMessage } from '../interfaces';

export function registerHandlers(messageController: MessageController): void {
  // Register main topic handler
  messageController.registerHandler<MainTopicMessage, MainTopicMessage>({
    topic: KafkaTopics.MAIN_TOPIC,
    middlewares: [validationMiddleware],
    handlers: [mainTopicHandler],
    continueOnError: true,
    writeHandler: mainTopicWriteHandler,
  });
}
