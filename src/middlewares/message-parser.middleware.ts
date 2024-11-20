import { MessageMiddleware, MiddlewareContext } from '../interfaces';
import { ValidationError } from '../utils/error';
import logger from '../utils/logger';

export const messageParserMiddleware: MessageMiddleware = async <T>(context: MiddlewareContext<T>): Promise<void> => {
  const { payload } = context;
  const { message, topic } = payload;

  if (!message.value) {
    context.shouldSkipHandler = true;
    throw new ValidationError('Message value is required');
  }

  try {
    const messageValue = message.value.toString();
    const parsedValue = JSON.parse(messageValue) as T;

    // Store the parsed message in the dedicated field
    context.parsedMessage = parsedValue;

    logger.debug(
      {
        topic,
        messageValue: parsedValue,
      },
      'Successfully parsed message'
    );
  } catch (error) {
    logger.error(
      {
        topic,
        error,
        rawMessage: message.value?.toString(),
      },
      'Failed to parse message'
    );
    context.shouldSkipHandler = true;
    throw new ValidationError('Invalid message format: Unable to parse JSON message');
  }
};
