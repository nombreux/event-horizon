import { IngestionContext, IngestionHandler } from '../interfaces/ingestion.types';
import { Message } from 'kafkajs';

export const mainTopicIngestor: IngestionHandler = async (context: IngestionContext): Promise<void> => {
  const { logger, metadata, onData } = context;

  // Example of a handler that manages its own data fetching logic
  try {
    // This could be any data fetching mechanism:
    // - Rate-limited API calls
    // - Webhook server
    // - File system watcher
    // - Database change streams
    // etc.

    // Example with rate limiting
    while (true) {
      try {
        const data = await fetchDataWithRateLimit();
        
        // Transform data to Kafka messages
        const messages: Message[] = data.map(item => ({
          key: item.id?.toString(),
          value: JSON.stringify(item),
          headers: {
            timestamp: Date.now().toString()
          }
        }));

        // Send to Kafka
        await onData(messages);
        
        // Wait for rate limit reset if needed
        await handleRateLimit();
      } catch (error) {
        logger.error({ error, metadata }, 'Error fetching data');
        // Implement appropriate error handling and retry logic
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    logger.error({ error, metadata }, 'Fatal error in ingestor');
    throw error;
  }
};

// Example helper functions
async function fetchDataWithRateLimit(): Promise<any[]> {
  // Implement actual data fetching with rate limit handling
  return [
    { id: 1, name: 'Sample Data 1', timestamp: Date.now() },
    { id: 2, name: 'Sample Data 2', timestamp: Date.now() }
  ];
}

async function handleRateLimit(): Promise<void> {
  // Implement rate limit handling
  await new Promise(resolve => setTimeout(resolve, 1000));
}
