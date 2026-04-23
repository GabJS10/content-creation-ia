import Redis from 'ioredis'
import { env } from './env'

const redis = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis connection failed after 3 retries')
      process.exit(1)
    }
    return Math.min(times * 100, 3000)
  },
})

redis.on('error', (err) => {
  console.error('Redis error:', err)
})

redis.on('connect', () => {
  console.log('Redis connected')
})

export function publish(channel: string, data: object): void {
  redis.publish(channel, JSON.stringify(data))
}

export function subscribe(channel: string, callback: (msg: string) => void): void {
  redis.subscribe(channel, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channel}:`, err)
    }
  })

  redis.on('message', (ch, message) => {
    if (ch === channel) {
      callback(message)
    }
  })
}

export { redis }