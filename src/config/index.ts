import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  nodeEnv: z.enum(['development', 'test', 'production']).default('development'),
  kafka: z.object({
    brokers: z.array(z.string()).default(['localhost:9092']),
    clientId: z.string().default('data-aggregator-service'),
    groupId: z.string().default('data-aggregator-group'),
  }),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const config = {
  nodeEnv: process.env.NODE_ENV,
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID,
    groupId: process.env.KAFKA_GROUP_ID,
  },
  logLevel: process.env.LOG_LEVEL,
};

export type AppConfig = z.infer<typeof configSchema>;
export default configSchema.parse(config) as AppConfig; 