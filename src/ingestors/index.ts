import { IIngestionController } from '../interfaces/ingestion.types';
import { KafkaTopics } from '../interfaces';
import { mainTopicIngestor } from './main-topic.ingestor';

export function registerIngestors(ingestionController: IIngestionController): void {
  // Register main topic ingestor
  ingestionController.registerHandler({
    topic: KafkaTopics.MAIN_TOPIC,
    handler: mainTopicIngestor, // 5 seconds
    
  });

  // Register more ingestors here as needed
}
