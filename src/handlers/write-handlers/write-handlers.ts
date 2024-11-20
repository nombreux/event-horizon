import { WriteHandler, WriteContext, MainTopicMessage, Medicine } from '../../interfaces';
import logger from '../../utils/logger';
import { MessageProcessingError, ErrorType } from '../../utils/error';

export const mainTopicWriteHandler: WriteHandler<MainTopicMessage> = async (writeContext: WriteContext<MainTopicMessage>): Promise<void> => {
  const { processedData: medicines, writeMetadata } = writeContext;

  if (!medicines || !Array.isArray(medicines)) {
    throw new MessageProcessingError('Invalid processed data: medicines array is required', ErrorType.NON_RETRYABLE);
  }

  try {
    // Log write operation metadata
    logger.info({
      ...writeMetadata,
      medicineCount: medicines.length,
    }, 'Processing medicines for write operation');

    // TODO: Implement actual write operation
    // This could be writing to a database, file system, or another service
    for (const medicine of medicines) {
      logger.debug({
        medicineId: medicine.id,
        medicineName: medicine.name,
        price: medicine.price,
      }, 'Processing medicine item');

      // Add your write logic here
      // For example:
      // await database.medicines.upsert({
      //   where: { id: medicine.id },
      //   update: medicine,
      //   create: medicine,
      // });
    }

    // Add write completion metadata
    writeContext.writeMetadata = {
      ...writeMetadata,
      completedAt: new Date().toISOString(),
      processedCount: medicines.length,
    };

    logger.info({
      ...writeContext.writeMetadata,
    }, 'Successfully processed medicines write operation');
  } catch (error) {
    logger.error({
      ...writeMetadata,
      error,
    }, 'Failed to process medicines write operation');
    throw error;
  }
};
