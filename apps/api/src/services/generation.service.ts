import type { VoiceProfile } from '@content-creation-ia/types'

type FormatOptions = {
  blog?: { length: 'short' | 'medium' | 'long'; tone: string }
  instagram?: { slides: 'short' | 'extended'; slideLength: 'short' | 'medium' }
  video_script?: { duration: '60s' | '3min' | '5min'; style: string }
}

interface BuildPromptParams {
  idea: string
  mode: 'quick' | 'draft'
  format: 'blog' | 'instagram' | 'video_script'
  formatOptions: FormatOptions
  voiceProfile?: VoiceProfile
  ragContext?: string
}

export function extractJSON(text: string): string {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return text.slice(start, end + 1)
}

export function buildPrompt(params: BuildPromptParams): string {
  const sections: string[] = []

  sections.push(
    `Eres un experto creador de contenido digital especializado en divulgación. Tu objetivo es transformar ideas en contenido de alta calidad adaptado al formato solicitado.`
  )

  if (params.voiceProfile) {
    sections.push(
      `Escribe exactamente con el siguiente estilo y voz:

Tono y personalidad: ${params.voiceProfile.toneDescription}

Ejemplos de cómo escribe este autor:
${params.voiceProfile.styleExamples}

Referencias intelectuales que influyen en su escritura:
${params.voiceProfile.intellectualReferences}

Es CRÍTICO que respetes este estilo en todo el contenido generado.`
    )
  }

  if (params.ragContext) {
    sections.push(
      `Usa el siguiente contexto como fuente principal de información. Basa el contenido en estos fragmentos y no inventes datos que no estén respaldados por ellos:

${params.ragContext}`
    )
  }

  if (params.mode === 'quick') {
    sections.push(
      `El usuario ha proporcionado una idea o tema breve. Tienes libertad creativa para expandarla, desarrollarla y enriquecerla. Usa el contexto de conocimiento como base informativa principal.`
    )
  } else {
    sections.push(
      `El usuario ha proporcionado un borrador elaborado. DEBES respetar y mantener la esencia, estructura y argumentos del borrador original. Tu rol es refinarlo, mejorarlo y adaptarlo al formato, no reescribirlo.`
    )
  }

  sections.push(`Idea/borrador del usuario:
${params.idea}`)

  sections.push(getFormatInstructions(params.format, params.formatOptions))

  return sections.join('\n\n')
}

function getFormatInstructions(
  format: 'blog' | 'instagram' | 'video_script',
  formatOptions: FormatOptions
): string {
  switch (format) {
    case 'blog':
      return getBlogInstructions(formatOptions.blog)
    case 'instagram':
      return getInstagramInstructions(formatOptions.instagram)
    case 'video_script':
      return getVideoScriptInstructions(formatOptions.video_script)
  }
}

function getBlogInstructions(options?: FormatOptions['blog']): string {
  const lengthMap = {
    short: '~500 palabras',
    medium: '~1000 palabras',
    long: '~1500 palabras',
  }
  const toneMap: Record<string, string> = {
    informativo: 'objetivo, claro, basado en hechos',
    opinión: 'primera persona, punto de vista claro, argumentativo',
    tutorial: 'paso a paso, práctico, orientado a acción',
  }

  const length = options?.length || 'medium'
  const tone = options?.tone || 'informativo'
  const lengthDesc = lengthMap[length] || lengthMap.medium
  const toneDesc = toneMap[tone] || 'objetivo y claro'

  return `Genera un artículo de blog con las siguientes características:
- Longitud aproximada: ${lengthDesc}
- Tono: ${toneDesc}
- Debe tener una estructura clara: título atractivo, introducción que enganche, desarrollo con subtítulos si aplica, y conclusión

RESPONDE ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código markdown, sin explicaciones.
El JSON debe tener exactamente esta estructura:
{
  "title": "título del artículo",
  "body": "contenido completo del artículo en markdown"
}`
}

function getInstagramInstructions(options?: FormatOptions['instagram']): string {
  const slidesMap = {
    short: '3-4 slides',
    extended: '6-8 slides',
  }
  const slideLengthMap = {
    short: '3-4 líneas por slide (~250 chars). Cada slide debe desarrollar una idea completa, no solo un titular.',
    medium: '5-7 líneas por slide (~450 chars). Cada slide debe explicar, argumentar o ilustrar con detalle.',
  }

  const slides = options?.slides || 'short'
  const slideLength = options?.slideLength || 'short'
  const slidesDesc = slidesMap[slides] || slidesMap.short
  const slideLengthDesc = slideLengthMap[slideLength] || slideLengthMap.short

  return `Genera un carrusel de Instagram con las siguientes características:
- Número de slides: ${slidesDesc}
- Longitud por slide: ${slideLengthDesc}
- El primer slide debe ser el gancho principal que capture la atención
- Cada slide debe tener coherencia con el anterior
- Cada slide debe desarrollar UNA idea completa con contexto suficiente para que tenga sentido por sí solo. Evita frases sueltas o titulares sin desarrollo. El lector debe aprender o reflexionar algo concreto en cada slide, no solo recibir un impacto emocional sin sustancia.
- El último slide debe ser un cierre o llamada a la acción
- El caption es el texto que acompaña la publicación

RESPONDE ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código markdown, sin explicaciones.
El JSON debe tener exactamente esta estructura:
{
  "caption": "caption de la publicación",
  "cards": [
    { "text": "texto del slide 1" },
    { "text": "texto del slide 2" }
  ]
}`
}

function getVideoScriptInstructions(options?: FormatOptions['video_script']): string {
  const durationMap: Record<string, string> = {
    '60s': '~150 palabras',
    '3min': '~450 palabras',
    '5min': '~750 palabras',
  }
  const styleMap: Record<string, string> = {
    educativo: 'explica conceptos con claridad, usa analogías',
    storytelling: 'narrativa con inicio, nudo y desenlace',
    opinión: 'punto de vista directo, argumentativo',
  }

  const duration = options?.duration || '3min'
  const style = options?.style || 'educativo'
  const durationDesc = durationMap[duration] || durationMap['3min']
  const styleDesc = styleMap[style] || styleMap.educativo

  return `Genera un guión de video estructurado con las siguientes características:
- Duración aproximada: ${durationDesc}
- Estilo: ${styleDesc}
- Estructura obligatoria:
  · GANCHO (primeros 5-10 segundos): frase que capture atención inmediata
  · DESARROLLO: contenido principal dividido en secciones con etiquetas claras [SECCIÓN: nombre]
  · CIERRE: conclusión y llamada a la acción
- Escrito en primera persona, listo para leer en cámara

RESPONDE ÚNICAMENTE con un JSON válido, sin texto adicional, sin bloques de código markdown, sin explicaciones.
El JSON debe tener exactamente esta estructura:
{
  "script": "guión completo con las etiquetas de sección [GANCHO], [SECCIÓN: nombre], [CIERRE] incluidas en el texto"
}`
}

export type { FormatOptions }