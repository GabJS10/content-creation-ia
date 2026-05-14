import { useState, useEffect, useRef } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Upload,
  Mic,
  Lightbulb,
  Sparkles,
  Brain,
  PenLine,
  LayoutTemplate,
  Zap,
  FileEdit,
  KeyRound,
  ArrowRight,
} from 'lucide-react'

const HERO_TEXT = `El sistema de precios es el mecanismo más eficiente para coordinar millones de decisiones individuales sin planificación central.`

function useTypingEffect(text: string, delay: number = 30) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setDisplayedText('')
    setShowContent(false)
    setIsTyping(true)

    let currentIndex = 0
    intervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current)
        setIsTyping(false)
        setTimeout(() => setShowContent(true), 300)
      }
    }, delay)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text, delay])

  return { displayedText, isTyping, showContent }
}

function useIntersectionObserver() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = (entry.target as HTMLElement).dataset.delay || '0'
            setTimeout(() => {
              entry.target.classList.add('is-visible')
            }, parseInt(delay))
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])
}

export function Landing() {
  useIntersectionObserver()
  const { displayedText, showContent } = useTypingEffect(HERO_TEXT, 30)

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const steps = [
    {
      icon: Upload,
      num: '01',
      title: 'Sube tu conocimiento',
      desc: 'PDFs, libros, artículos. El sistema los procesa y crea una base de conocimiento semántica.',
    },
    {
      icon: Mic,
      num: '02',
      title: 'Define tu voz',
      desc: 'Describe tu tono, pega ejemplos de tu escritura y añade tus referencias intelectuales.',
    },
    {
      icon: Lightbulb,
      num: '03',
      title: 'Escribe tu idea',
      desc: 'Una frase, un tema o un borrador completo. El sistema recupera el contexto relevante.',
    },
    {
      icon: Sparkles,
      num: '04',
      title: 'Genera y edita',
      desc: 'Blog, carrusel de Instagram o guión de video. Edita directamente y guarda tu contenido.',
    },
  ]

  const features = [
    {
      icon: Brain,
      title: 'RAG semántico',
      desc: 'Búsqueda por similitud sobre tus documentos. El modelo siempre habla desde tu conocimiento.',
    },
    {
      icon: PenLine,
      title: 'Perfil de voz',
      desc: 'Entrena al modelo con tu tono y estilo. El contenido suena a ti, no a una IA genérica.',
    },
    {
      icon: LayoutTemplate,
      title: 'Multi-formato',
      desc: 'Blog, carrusel de Instagram y guión de video desde una misma idea.',
    },
    {
      icon: Zap,
      title: 'Streaming en tiempo real',
      desc: 'Ve el contenido generarse palabra a palabra. Sin esperas, sin pantallas de carga.',
    },
    {
      icon: FileEdit,
      title: 'Editor integrado',
      desc: 'Rich text para blog, vista de slides para Instagram. Guardado automático.',
    },
    {
      icon: KeyRound,
      title: 'Tu API key, tu control',
      desc: 'Usa tu propia key de OpenAI. Tú controlas los costos y tu privacidad.',
    },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-[#e8e8e8]">
      <style>{`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .animate-on-scroll.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .cursor-blink::after {
          content: '▋';
          animation: blink 1s infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        .pulse-dot {
          animation: pulse-dot 2s ease-in-out infinite;
        }
      `}</style>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#080808] border-b border-[#161616]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-sm font-medium">Content Generator IA</span>
          <div className="flex items-center gap-8">
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="text-sm text-[#4a4a4a] hover:text-[#e8e8e8] transition-colors"
            >
              Cómo funciona
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="text-sm text-[#4a4a4a] hover:text-[#e8e8e8] transition-colors"
            >
              Features
            </button>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-[#888] hover:text-[#e8e8e8] transition-colors"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm bg-[#e8e8e8] text-[#080808] rounded-lg hover:bg-white transition-colors"
            >
              Empezar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-12 pt-32 pb-20 text-center">
        <div
          className="absolute top-0 left-0 w-[700px] h-[700px] bg-radial-glow-purple -translate-x-1/3 -translate-y-1/2 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(127,119,221,0.15) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-radial-glow-teal translate-x-1/4 translate-y-1/4 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(93,202,165,0.11) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute top-1/2 right-[10%] w-[400px] h-[400px] bg-radial-glow-purple-secondary -translate-y-1/2 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(127,119,221,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="animate-on-scroll inline-flex items-center gap-2 px-4 py-2 bg-[#111] border border-[#161616] rounded-full"
            data-delay="0"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#5DCAA5] pulse-dot" />
            <span className="text-xs text-[#555]">Potenciado por Claude + OpenAI</span>
          </div>

          <h1
            className="animate-on-scroll mt-8 font-normal leading-tight"
            style={{ fontSize: 'clamp(40px, 6vw, 58px)', letterSpacing: '-2.5px' }}
            data-delay="100"
          >
            Tu conocimiento,
            <br />
            convertido en <span className="text-[#7F77DD]">contenido</span>
          </h1>

          <p
            className="animate-on-scroll mt-6 text-base text-[#555] max-w-md mx-auto"
            data-delay="200"
          >
            Sube tus documentos, define tu voz y genera artículos, carruseles y guiones en segundos.
          </p>

          <div
            className="animate-on-scroll mt-10 flex items-center justify-center gap-4"
            data-delay="300"
          >
            <Link
              to="/register"
              className="px-7 py-3 bg-[#e8e8e8] text-[#080808] rounded-lg hover:bg-white transition-colors font-medium"
            >
              Empezar gratis
            </Link>
            <button
              onClick={() => scrollToSection('como-funciona')}
              className="px-7 py-3 border border-[#222] text-[#888] rounded-lg hover:border-[#333] hover:text-[#e8e8e8] transition-colors"
            >
              Ver cómo funciona
            </button>
          </div>

          {/* Demo */}
          <div
            className="animate-on-scroll mt-16 max-w-[700px] mx-auto rounded-xl border border-[#161616] bg-[#0c0c0c] overflow-hidden"
            data-delay="400"
          >
            <div className="flex items-center gap-2 px-4 py-3 bg-[#0a0a0a] border-b border-[#161616]">
              <span className="w-3 h-3 rounded-full bg-[#E24B4A]" />
              <span className="w-3 h-3 rounded-full bg-[#EF9F27]" />
              <span className="w-3 h-3 rounded-full bg-[#639922]" />
              <span className="ml-4 text-xs text-[#4a4a4a] font-mono">
                contentgenerator.ai/generate
              </span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#161616]">
              <div className="p-6 text-left">
                <p className="text-[10px] text-[#4a4a4a] mb-2 font-mono uppercase tracking-wider">
                  Tu idea
                </p>
                <p className="text-xs text-[#666] leading-relaxed">
                  {displayedText}
                  <span className="cursor-blink text-[#5DCAA5]" />
                </p>
              </div>
              <div className="p-6 text-left">
                <p className="text-[10px] text-[#4a4a4a] mb-2 font-mono uppercase tracking-wider">
                  Generando blog
                </p>
                <div
                  className={`transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}
                >
                  <p className="text-sm font-medium text-[#aaa] mb-2">
                    El verdadero costo de no tener precios
                  </p>
                  <p className="text-xs text-[#666] leading-relaxed">
                    Cuando eliminamos la señal de precios, perdemos el mecanismo más eficiente para
                    coordinar...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="animate-on-scroll text-3xl font-normal text-[#e8e8e8]" data-delay="0">
              Cómo funciona
            </h2>
            <p className="animate-on-scroll mt-3 text-[#444]" data-delay="100">
              De tu conocimiento al contenido publicable en 4 pasos
            </p>
          </div>

          <div className="grid grid-cols-4 gap-px bg-[#161616] rounded-xl overflow-hidden border border-[#161616]">
            {steps.map((step, i) => (
              <div
                key={i}
                className="animate-on-scroll bg-[#0a0a0a] p-8 transition-colors duration-200"
                data-delay={String(i * 100)}
              >
                <p className="text-[10px] text-[#3a3a3a] font-mono mb-4">{step.num}</p>
                <step.icon className="w-6 h-6 text-[#534AB7] mb-4" />
                <h3 className="text-[13px] font-medium text-[#d8d8d8] font-medium">{step.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-12 py-24 border-t border-[#161616]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="animate-on-scroll text-3xl font-normal text-[#e8e8e8]" data-delay="0">
              Todo lo que necesitas
            </h2>
            <p className="animate-on-scroll mt-3 text-[#444]" data-delay="100">
              Construido para creadores que quieren publicar con consistencia y profundidad
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={i}
                className="animate-on-scroll p-6 border border-[#141414] rounded-xl bg-[#0a0a0a] hover:border-[#1e1e1e] transition-colors duration-200"
                data-delay={String(i * 100)}
              >
                <feat.icon className="w-6 h-6 text-[#1D9E75] mb-4" />
                <h3 className="text-[13px] font-medium text-[#d8d8d8] font-medium">{feat.title}</h3>
                <p className="text-xs text-[#666] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-12 py-24 border-t border-[#161616] text-center overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 w-[600px] h-[400px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(127,119,221,0.11) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2
            className="animate-on-scroll font-normal leading-tight text-[#e8e8e8]"
            style={{ fontSize: 'clamp(32px, 5vw, 44px)', letterSpacing: '-1.5px' }}
            data-delay="0"
          >
            Empieza a crear contenido
            <br />
            <span className="text-[#534AB7]">con profundidad</span>
          </h2>
          <p className="animate-on-scroll mt-4 text-[#444]" data-delay="100">
            Sin configuración compleja. Sin costos ocultos.
          </p>
          <div className="animate-on-scroll mt-8" data-delay="200">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#e8e8e8] text-[#080808] rounded-lg hover:bg-white transition-colors font-medium"
            >
              Crear mi cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-12 py-6 border-t border-[#141414] flex items-center justify-between">
        <span className="text-xs text-[#222]">Content Generator IA</span>
        <span className="text-xs text-[#222]">Gabriel Ballesteros</span>
      </footer>
    </div>
  )
}
