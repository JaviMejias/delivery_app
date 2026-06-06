import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import type { User } from '@/types'
import { useState, useEffect } from 'react'
import { Sparkles, Package, AlertTriangle, Truck, DollarSign, TrendingUp, Map } from 'lucide-react'

interface Props {
  user: User
  stats: {
    total_products: number
    low_stock: number
    active_trucks: number
    today_sales: number
  }
}

export default function Dashboard({ user, stats }: Props) {
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [isSummarizing, setIsSummarizing] = useState(false)

  useEffect(() => {
    const generateSummary = async () => {
      setIsSummarizing(true)
      const inputData = `Datos actuales: ${stats.total_products} productos totales en catálogo. ${stats.low_stock} productos con stock bajo. ${stats.active_trucks} camiones despachando en ruta. Ventas de hoy: $${stats.today_sales}.`
      
      try {
        // @ts-ignore
        if (window.ai && window.ai.summarizer) {
          // @ts-ignore
          const summarizer = await window.ai.summarizer.create()
          const summary = await summarizer.summarize(inputData, { context: "Eres un analista logístico. Haz un resumen breve en una oración destacando lo más crítico." })
          setAiSummary(summary)
        } else {
          // Fallback if Summarizer API is not available
          setTimeout(() => {
            setAiSummary(`El inventario tiene ${stats.low_stock} alertas de stock bajo que requieren atención. El flujo de ventas está en $${(stats.today_sales || 0).toLocaleString('es-CL')} con ${stats.active_trucks} camiones activos en ruta.`)
            setIsSummarizing(false)
          }, 800)
          return
        }
      } catch (e) {
        setAiSummary(`Atención: Tienes ${stats.low_stock} alertas de stock bajo y ${stats.active_trucks} camiones operando actualmente.`)
      }
      setIsSummarizing(false)
    }
    
    generateSummary()
  }, [stats])

  const cards = [
    {
      title: 'Productos Totales',
      value: stats.total_products,
      icon: <Package className="w-6 h-6 text-white" />,
      color: 'from-primary-500 to-purple-600',
      bgGlow: 'bg-primary-500/10',
    },
    {
      title: 'Stock Bajo',
      value: stats.low_stock,
      icon: <AlertTriangle className="w-6 h-6 text-white" />,
      color: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
    },
    {
      title: 'Camiones Activos',
      value: stats.active_trucks,
      icon: <Truck className="w-6 h-6 text-white" />,
      color: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10',
    },
    {
      title: 'Ventas Hoy',
      value: `$${(stats.today_sales || 0).toLocaleString('es-CL')}`,
      icon: <DollarSign className="w-6 h-6 text-white" />,
      color: 'from-sky-500 to-blue-600',
      bgGlow: 'bg-sky-500/10',
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="space-y-6 animate-on-scroll">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--sf-text-main)]">
            Bienvenido, {user.first_name} 👋
          </h1>
          <p className="text-[var(--sf-text-muted)] mt-1">
            Aquí tienes un resumen en vivo de tu negocio
          </p>
        </div>

        {/* AI Insights Component */}
        <div className="rounded-[1.5rem] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 relative overflow-hidden group shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-emerald-500/5 opacity-50 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-semibold text-[var(--sf-text-main)] mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-500" />
              AI Insights
            </h2>
            {isSummarizing ? (
              <div className="flex items-center gap-3 text-[var(--sf-text-muted)] animate-pulse font-medium">
                <div className="w-4 h-4 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
                Analizando métricas operativas...
              </div>
            ) : (
              <p className="text-[var(--sf-text-main)] leading-relaxed font-medium">
                {aiSummary}
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid using Container Queries */}
        <div className="@container">
          <div className="grid grid-cols-1 @md:grid-cols-2 @4xl:grid-cols-4 gap-4">
            {cards.map((card) => (
              <div
                key={card.title}
                className={`
                  relative overflow-hidden rounded-[1.25rem] border border-[var(--sf-border)]
                  bg-[var(--sf-surface)] p-5 shadow-sm
                  hover:border-primary-500/30 transition-all duration-300
                  group cursor-default hover:shadow-md hover:-translate-y-1
                `}
              >
                <div className={`absolute -top-8 -right-8 w-24 h-24 rounded-full ${card.bgGlow} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--sf-text-muted)] font-medium">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold text-[var(--sf-text-main)] mt-2">
                      {card.value}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg shadow-lg`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder sections with @container */}
        <div className="@container">
          <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
            <div className="rounded-[1.5rem] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-[var(--sf-text-main)] mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[var(--sf-text-muted)]" />
                Ventas Recientes
              </h2>
              <div className="text-center py-12 text-[var(--sf-text-muted)]">
                <p>El gráfico detallado de ventas aparecerá aquí</p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-[var(--sf-text-main)] mb-4 flex items-center gap-2">
                <Map className="w-5 h-5 text-[var(--sf-text-muted)]" />
                Camiones en Ruta
              </h2>
              <div className="text-center py-12 text-[var(--sf-text-muted)]">
                <p>El mapa en vivo de camiones activos aparecerá aquí</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
