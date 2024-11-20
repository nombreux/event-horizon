import { EachMessagePayload } from 'kafkajs';
import { Logger } from 'pino';
import { MessageProcessingError } from '../utils/error';
import { IDLQHandler, IProducerService } from '../interfaces';

export class DLQHandler implements IDLQHandler {
  constructor(
    private readonly producerService: IProducerService,
    private readonly logger: Logger
  ) {}

  async handleFailedMessage(payload: EachMessagePayload, error: MessageProcessingError): Promise<void> {
    await this.sendToDeadLetterTopic(payload, error);
  }

  private async sendToDeadLetterTopic(payload: EachMessagePayload, error: MessageProcessingError): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      await this.producerService.sendMessage(`${topic}.dlq`, [
        {
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            originalTopic: topic,
            originalPartition: partition.toString(),
            error: error.message,
            errorType: error.type,
            originalError: error.originalError?.message,
            timestamp: Date.now().toString(),
          },
        },
      ]);

      this.logger.info(
        {
          topic,
          error: error.message,
        },
        'Message sent to DLQ'
      );
    } catch (sendError) {
      this.logger.error(
        {
          error: sendError,
          originalError: error,
        },
        'Failed to send message to DLQ'
      );
      throw sendError;
    }
  }
}
