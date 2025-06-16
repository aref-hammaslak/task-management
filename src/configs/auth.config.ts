export default () => ({
  auth: {
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'access-secret',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
    JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
});
