import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import type { User } from '@/types'

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
  const cards = [
    {
      title: 'Productos Totales',
      value: stats.total_products,
      icon: '📦',
      color: 'from-primary-500 to-purple-600',
      bgGlow: 'bg-primary-500/10',
    },
    {
      title: 'Stock Bajo',
      value: stats.low_stock,
      icon: '⚠️',
      color: 'from-amber-500 to-orange-600',
      bgGlow: 'bg-amber-500/10',
    },
    {
      title: 'Camiones Activos',
      value: stats.active_trucks,
      icon: '🚛',
      color: 'from-emerald-500 to-teal-600',
      bgGlow: 'bg-emerald-500/10',
    },
    {
      title: 'Ventas Hoy',
      value: stats.today_sales,
      icon: '💰',
      color: 'from-sky-500 to-blue-600',
      bgGlow: 'bg-sky-500/10',
    },
  ]

  return (
    <AuthenticatedLayout>
      <Head title="Dashboard" />

      <div className="space-y-6">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--sf-text-main)]">
            Bienvenido, {user.first_name} 👋
          </h1>
          <p className="text-[var(--sf-text-muted)] mt-1">
            Aquí tienes un resumen de tu negocio
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.title}
              className={`
                relative overflow-hidden rounded-xl border border-[var(--sf-border)]
                bg-[var(--sf-surface)] p-5
                hover:border-primary-500/30 transition-all duration-300
                group cursor-default
              `}
            >
              {/* Background glow effect */}
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
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-lg shadow-lg`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
            <h2 className="text-lg font-semibold text-[var(--sf-text-main)] mb-4">Ventas Recientes</h2>
            <div className="text-center py-12 text-[var(--sf-text-muted)]">
              <p className="text-4xl mb-3">📈</p>
              <p>Las ventas aparecerán aquí</p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--sf-border)] bg-[var(--sf-surface)] p-6">
            <h2 className="text-lg font-semibold text-[var(--sf-text-main)] mb-4">Camiones en Ruta</h2>
            <div className="text-center py-12 text-[var(--sf-text-muted)]">
              <p className="text-4xl mb-3">🗺️</p>
              <p>Los camiones activos aparecerán aquí</p>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
