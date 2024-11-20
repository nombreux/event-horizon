import { AppFactory } from './factories/app.factory';
import logger from './utils/logger';
import { messageParserMiddleware } from './middlewares/message-parser.middleware';
import { registerHandlers } from './handlers';
import { KafkaTopics } from './interfaces';

const topics = Object.values(KafkaTopics).filter((value) => typeof value === 'string') as KafkaTopics[];
async function start() {
  try {
    const appFactory = new AppFactory(logger);
    const consumerService = appFactory.getConsumerService();
    const messageController = appFactory.getMessageController();

    await consumerService.connect();
    await consumerService.subscribe(topics);

    // Register global middleware before handlers
    messageController.registerGlobalMiddleware(messageParserMiddleware);

    // Register topic-specific handlers
    registerHandlers(messageController);

    await consumerService.startConsumer(async (payload) => {
      await messageController.handleMessage(payload);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal. Starting graceful shutdown...');
      await consumerService.disconnect();
      process.exit(0);
    });

    logger.info('Consumer service started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start consumer service');
    process.exit(1);
  }
}

start();
