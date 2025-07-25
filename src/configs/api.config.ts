export default () => ({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  api: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    corsOrigin: process.env.CORS_ORIGIN ?? '*',
  },
});
