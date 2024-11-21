import { AppFactory } from './factories/app.factory';
import logger from './utils/logger';
import { messageParserMiddleware } from './middlewares/message-parser.middleware';
import { registerHandlers } from './handlers';
import { registerIngestors } from './ingestors';
import { KafkaTopics } from './interfaces';

const topics = Object.values(KafkaTopics).filter((value) => typeof value === 'string') as KafkaTopics[];
async function start() {
  try {
    const appFactory = new AppFactory(logger);
    const consumerService = appFactory.getConsumerService();
    const producerService = appFactory.getProducerService();
    const messageController = appFactory.getMessageController();
    const ingestionController = appFactory.getIngestionController();

    // Single place managing connections
    await consumerService.connect();
    await producerService.connect();

    
    await consumerService.subscribe(topics);

    // Register global middleware before handlers
    messageController.registerGlobalMiddleware(messageParserMiddleware);

    // Register topic-specific handlers
    registerHandlers(messageController);

    // Register ingestors
    registerIngestors(ingestionController);

    // Start both consumer and ingestion services
    await Promise.all([
      consumerService.startConsumer(async (payload) => {
        await messageController.handleMessage(payload);
      }),
      ingestionController.start(),
    ]);

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal. Starting graceful shutdown...');
      await Promise.all([consumerService.disconnect(), ingestionController.stop()]);
      process.exit(0);
    });

    logger.info('Services started successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to start services');
    process.exit(1);
  }
}

start();
