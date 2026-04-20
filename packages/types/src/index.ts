export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  name: string
  email: string
  createdAt: Date
}

export interface VoiceProfile {
  id: string
  userId: string
  name: string
  toneDescription: string
  styleExamples: string
  intellectualReferences: string
  createdAt: Date
}

export interface KnowledgeSource {
  id: string
  userId: string
  title: string
  filePath: string
  status: 'pending' | 'processing' | 'ready' | 'error'
  createdAt: Date
}

export interface KnowledgeChunk {
  id: string
  sourceId: string
  content: string
  chunkIndex: number
}

export type IdeaMode = 'draft' | 'quick'
export type ContentFormat = 'blog' | 'instagram' | 'video_script'

export interface Idea {
  id: string
  userId: string
  voiceProfileId?: string
  title: string
  content: string
  mode: IdeaMode
  selectedFormats: ContentFormat[]
  createdAt: Date
  updatedAt: Date
}

export type GeneratedContentStatus = 'generating' | 'ready' | 'edited'

export interface BlogContent {
  title: string
  body: string
}

export interface InstagramContent {
  caption: string
  cards: { text: string }[]
}

export interface VideoScriptContent {
  script: string
}

export interface GeneratedContent {
  id: string
  ideaId: string
  format: ContentFormat
  content: BlogContent | InstagramContent | VideoScriptContent
  status: GeneratedContentStatus
  updatedAt: Date
}
