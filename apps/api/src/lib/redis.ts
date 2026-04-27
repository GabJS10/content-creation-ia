import Redis from 'ioredis'
import { env } from './env'

const publisher = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis publisher connection failed after 3 retries')
      process.exit(1)
    }
    return Math.min(times * 100, 3000)
  },
})

const subscriber = new Redis(env.REDIS_URL, {
  retryStrategy: (times) => {
    if (times > 3) {
      console.error('Redis subscriber connection failed after 3 retries')
      process.exit(1)
    }
    return Math.min(times * 100, 3000)
  },
})

publisher.on('error', (err) => {
  console.error('Redis publisher error:', err)
})

subscriber.on('error', (err) => {
  console.error('Redis subscriber error:', err)
})

publisher.on('connect', () => {
  console.log('Redis connected')
})

export function publish(channel: string, data: object): void {
  publisher.publish(channel, JSON.stringify(data))
}

export function subscribe(channel: string, callback: (msg: string) => void): void {
  subscriber.subscribe(channel, (err) => {
    if (err) {
      console.error(`Failed to subscribe to ${channel}:`, err)
    }
  })

  subscriber.on('message', (ch, message) => {
    if (ch === channel) {
      callback(message)
    }
  })
}

export { publisher }