import { MainTopicMessage, MessageMiddleware, MiddlewareContext } from '../interfaces';
import { ValidationError } from '../utils/error';
import logger from '../utils/logger';

export const validationMiddleware: MessageMiddleware<MainTopicMessage> = async (context: MiddlewareContext<MainTopicMessage>): Promise<void> => {
  const { parsedMessage, topic } = context;

  if (!parsedMessage) {
    context.shouldSkipHandler = true;
    throw new ValidationError('No parsed message available for validation');
  }

  try {
    // Validate the parsed message structure
    validateMessageStructure(parsedMessage);

    // Mark as validated in metadata
    context.metadata.validated = true;

    logger.debug(
      {
        topic,
        messageId: (parsedMessage as any).id,
      },
      'Message validation successful'
    );
  } catch (error) {
    logger.error(
      {
        topic,
        error,
        parsedMessage,
      },
      'Message validation failed'
    );
    context.shouldSkipHandler = true;
    throw new ValidationError(`Invalid message structure: ${(error as Error).message}`);
  }
};

// may be later use zod for validation
function validateMessageStructure(message: unknown): void {
  // Basic structure validation
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }

  const msg = message as Record<string, unknown>;

  // Required fields validation
  if (!msg.id || typeof msg.id !== 'string') {
    throw new Error('Message must have a string id');
  }

  if (!msg.data || typeof msg.data !== 'object') {
    throw new Error('Message must have a data object');
  }

  const data = msg.data as Record<string, unknown>;

  // Data fields validation
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Message data must have a string name');
  }

  if (typeof data.value !== 'number') {
    throw new Error('Message data must have a numeric value');
  }
}
