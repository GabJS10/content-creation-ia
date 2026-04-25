import { PDFParse } from 'pdf-parse'
import { readFile } from 'fs/promises'
import { access } from 'fs/promises'

const MAX_WORDS_PER_CHUNK = 800
const OVERLAP_WORDS = 80

export async function extractText(filePath: string): Promise<string> {
  try {
    await access(filePath)
  } catch {
    throw new Error(`Cannot read file: ${filePath}`)
  }

  const buffer = await readFile(filePath)
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()

  if (!result.text || result.text.trim().length === 0) {
    throw new Error(`PDF contains no extractable text: ${filePath}`)
  }

  return result.text
}

export function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(w => w.length > 0)

  if (words.length === 0) {
    return []
  }

  const chunks: string[] = []
  let start = 0

  while (start < words.length) {
    const end = Math.min(start + MAX_WORDS_PER_CHUNK, words.length)
    const chunk = words.slice(start, end).join(' ')
    chunks.push(chunk)
    start = end - OVERLAP_WORDS
    if (start >= words.length - 1) break
    if (start < 0) start = 0
  }

  return chunks.filter(c => {
    const wordCount = c.split(/\s+/).filter(w => w.length > 0).length
    return wordCount >= 10
  })
}