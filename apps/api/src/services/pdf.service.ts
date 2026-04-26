import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile } from 'fs/promises'
import { access } from 'fs/promises'

const MAX_WORDS_PER_CHUNK = 800
const OVERLAP_WORDS = 80

export async function extractAndChunk(filePath: string): Promise<string[]> {
  try {
    await access(filePath)
  } catch {
    throw new Error(`Cannot read file: ${filePath}`)
  }

  const buffer = await readFile(filePath)
  const data = new Uint8Array(buffer)

  const pdf = await pdfjsLib.getDocument({ data }).promise

  const chunks: string[] = []
  let bufferWords: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = (textContent.items as Array<{str?: string}>)
      .map(item => item.str || '')
      .join(' ')
    const words = pageText.split(/\s+/).filter(w => w.length > 0)

    bufferWords.push(...words)

    while (bufferWords.length >= MAX_WORDS_PER_CHUNK + OVERLAP_WORDS) {
      const chunkWords = bufferWords.slice(0, MAX_WORDS_PER_CHUNK)
      const chunk = chunkWords.join(' ')
      if (chunk.split(/\s+/).filter(w => w.length > 0).length >= 10) {
        chunks.push(chunk)
      }
      bufferWords = bufferWords.slice(MAX_WORDS_PER_CHUNK - OVERLAP_WORDS)
    }

    page.cleanup()
  }

  if (bufferWords.length >= 10) {
    chunks.push(bufferWords.join(' '))
  }

  return chunks
}