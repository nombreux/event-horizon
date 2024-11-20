// create a generic type for topic

export type TopicName = string;
export interface Topic<T> {
  name: TopicName;
  schema: T;
}


export enum KafkaTopics {
  MAIN_TOPIC = 'main-topic',
  DLQ_TOPIC = 'dlq-topic',
}