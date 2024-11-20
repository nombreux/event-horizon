import { EachMessagePayload } from 'kafkajs';
import logger from '../utils/logger';
import { MessageProcessingError, ErrorType, ValidationError } from '../utils/error';
import { MessageHandler, HandlerContext, MainTopicMessage } from '../interfaces';

export const mainTopicHandler: MessageHandler<MainTopicMessage> = async (context: HandlerContext<MainTopicMessage>): Promise<void> => {
  const {
    topic,
    parsedMessage,
    payload: { partition, message },
  } = context;

  try {
    logger.info(
      {
        topic,
        parsedMessage,
        partition,
        offset: message.offset,
        value: message.value,
      },
      'Processing main topic message'
    );
    // Add your main topic processing logic here
  } catch (error) {
    if (error instanceof MessageProcessingError) {
      throw error;
    }

    throw new MessageProcessingError('Failed to process message', ErrorType.RETRYABLE, error instanceof Error ? error : undefined, {
      topic,
      partition,
      offset: message.offset,
    });
  }
};
