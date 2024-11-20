import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppFactory } from '../src/factories/app.factory';
import { ConsumerService } from '../src/services/consumer.service';
import { ProducerService } from '../src/services/producer.service';
import { MessageController } from '../src/controllers/message.controller';
import logger from '../src/utils/logger';
import { EachMessagePayload } from 'kafkajs';

// Mock the entire modules
vi.mock('../src/factories/app.factory');
vi.mock('../src/handlers');
vi.mock('../src/utils/logger');

describe('bootstrap', () => {
  // Mock services
  const mockConsumerService = {
    connect: vi.fn(),
    subscribe: vi.fn(),
    startConsumer: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as ConsumerService;

  const mockProducerService = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  } as unknown as ProducerService;

  const mockMessageController = {
    handleMessage: vi.fn(),
  } as unknown as MessageController;

  // Mock AppFactory
  const mockAppFactory = {
    getConsumerService: vi.fn().mockReturnValue(mockConsumerService),
    getProducerService: vi.fn().mockReturnValue(mockProducerService),
    getMessageController: vi.fn().mockReturnValue(mockMessageController),
  };

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Setup AppFactory mock
    vi.mocked(AppFactory).mockImplementation(() => mockAppFactory as unknown as AppFactory);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should initialize and connect services successfully', async () => {
    // Import the module that contains the bootstrap function
    const { bootstrap } = await import('../src/index');

    await bootstrap();

    // Verify AppFactory initialization
    expect(AppFactory).toHaveBeenCalledWith(logger);

    // Verify service retrieval
    expect(mockAppFactory.getConsumerService).toHaveBeenCalled();
    expect(mockAppFactory.getProducerService).toHaveBeenCalled();
    expect(mockAppFactory.getMessageController).toHaveBeenCalled();

    // Verify service connections
    expect(mockProducerService.connect).toHaveBeenCalled();
    expect(mockConsumerService.connect).toHaveBeenCalled();
    expect(mockConsumerService.subscribe).toHaveBeenCalled();
    expect(mockConsumerService.startConsumer).toHaveBeenCalled();
  });

  it('should handle startup errors gracefully', async () => {
    const mockError = new Error('Startup failed');
    (mockConsumerService.connect as any).mockRejectedValueOnce(mockError);

    // Mock process.exit
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

    const { bootstrap } = await import('../src/index');
    await bootstrap();

    expect(logger.error).toHaveBeenCalledWith('Application failed to start', mockError);
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should handle SIGTERM signal correctly', async () => {
    const { bootstrap } = await import('../src/index');
    await bootstrap();

    // Simulate SIGTERM
    process.emit('SIGTERM');

    // Verify shutdown sequence
    expect(logger.info).toHaveBeenCalledWith('SIGTERM received. Shutting down...');
    expect(mockConsumerService.disconnect).toHaveBeenCalled();
    expect(mockProducerService.disconnect).toHaveBeenCalled();
  });

  it('should register message handlers', async () => {
    // Import the registerHandlers function
    const { registerHandlers } = await import('../src/handlers');
    const { bootstrap } = await import('../src/index');

    await bootstrap();

    expect(registerHandlers).toHaveBeenCalledWith(mockMessageController);
  });

  it('should pass message handler to consumer service', async () => {
    const { bootstrap } = await import('../src/index');
    await bootstrap();

    // Get the handler function passed to startConsumer
    const handler = vi.mocked(mockConsumerService.startConsumer).mock.calls[0][0];

    // Create a test payload
    const testPayload = { topic: 'test-topic', partition: 0, message: {} };

    // Call the handler
    await handler(testPayload as unknown as EachMessagePayload);

    // Verify message controller was called with payload
    expect(mockMessageController.handleMessage).toHaveBeenCalledWith(testPayload);
  });
});
