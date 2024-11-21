// // Rate-limited API handler
// const apiIngestor: IngestionHandler = async ({ onData, logger }) => {
//   const rateLimiter = new RateLimiter(100, 'hour');
//   while (true) {
//     await rateLimiter.waitForQuota();
//     const data = await fetchFromAPI();
//     await onData(transformToMessages(data));
//   }
// };

// // Webhook handler
// const webhookIngestor: IngestionHandler = async ({ onData }) => {
//   const server = createWebhookServer();
//   server.on('data', async (data) => {
//     await onData(transformToMessages(data));
//   });
//   await server.listen();
// };

// // File watcher
// const fileIngestor: IngestionHandler = async ({ onData }) => {
//   const watcher = createFileWatcher('./data');
//   watcher.on('change', async (file) => {
//     const data = await readFile(file);
//     await onData(transformToMessages(data));
//   });
// };
