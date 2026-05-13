import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { env } from '../lib/env'

const ALGORITHM = 'aes-256-gcm'
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex')

export function encrypt(text: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv(ALGORITHM, KEY, iv)
  const encrypted = Buffer.concat([
    cipher.update(text, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
    ':'
  )
}

export function decrypt(encryptedText: string): string {
  const [ivB64, authTagB64, encryptedB64] = encryptedText.split(':')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  const encrypted = Buffer.from(encryptedB64, 'base64')
  const decipher = createDecipheriv(ALGORITHM, KEY, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])
  return decrypted.toString('utf8')
}