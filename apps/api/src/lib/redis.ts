import Redis from 'ioredis'
import { env } from './env'

// `family: 0` habilita el lookup DNS dual-stack (IPv4/IPv6). Railway usa red
// privada solo IPv6 (`*.railway.internal`), por lo que es necesario en prod.
const redisOptions = (label: string) => ({
  family: 0,
  retryStrategy: (times: number) => {
    if (times > 20) {
      console.error(`Redis ${label} connection failed after 20 retries`)
      process.exit(1)
    }
    return Math.min(times * 200, 5000)
  },
})

const publisher = new Redis(env.REDIS_URL, redisOptions('publisher'))

const subscriber = new Redis(env.REDIS_URL, redisOptions('subscriber'))

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