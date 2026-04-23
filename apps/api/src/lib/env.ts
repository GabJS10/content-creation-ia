export const env = {
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp://admin:admin@localhost:5672',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
}