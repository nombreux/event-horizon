import { EachMessagePayload } from 'kafkajs';
import logger from '../utils/logger';
import { MessageProcessingError, ErrorType } from '../utils/error';
import { MessageHandler, HandlerContext } from '../interfaces';

export const dlqTopicHandler: MessageHandler = async (payload: EachMessagePayload, context: HandlerContext): Promise<void> => {
  const { message } = payload;
  logger.info({
    value: message.value?.toString(),
  }, 'Processing DLQ message');
  // Add your DLQ processing logic here
} 