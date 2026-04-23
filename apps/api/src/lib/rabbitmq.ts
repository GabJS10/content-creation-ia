import amqp, { type Channel, type ChannelModel } from 'amqplib'
import { env } from './env'

let connection: ChannelModel | null = null
let channel: Channel | null = null

export async function connect(): Promise<void> {
  try {
    connection = await amqp.connect(env.RABBITMQ_URL)
    channel = await connection.createChannel()

    await channel.assertQueue('knowledge_processing', { durable: true })

    connection.on('error', (err: Error) => {
      console.error('RabbitMQ connection error:', err)
      process.exit(1)
    })

    connection.on('close', () => {
      console.error('RabbitMQ connection closed')
      process.exit(1)
    })

    console.log('RabbitMQ connected')
  } catch (err) {
    console.error('Failed to connect to RabbitMQ:', err)
    process.exit(1)
  }
}

export function getChannel(): Channel {
  if (!channel) {
    throw new Error('RabbitMQ channel not initialized. Call connect() first.')
  }
  return channel
}

export async function closeConnection(): Promise<void> {
  if (channel) {
    await channel.close()
  }
  if (connection) {
    await connection.close()
  }
}