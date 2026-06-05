import { Head, useForm, usePage } from '@inertiajs/react'
import { FormEvent } from 'react'
import { CustomSwitch } from '@/components/CustomSwitch'

export default function Login() {
  const { app_name } = usePage().props as any
  const { data, setData, post, processing, errors, transform } = useForm({
    email: '',
    password: '',
    remember: false,
  })

  transform((data) => ({
    user: {
      email: data.email,
      password: data.password,
      remember_me: data.remember ? '1' : '0'
    }
  }))

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    post('/login')
  }

  const getInitials = (name: string) => {
    if (!name) return 'SF'
    const words = name.trim().split(/\s+/)
    if (words.length === 1) return name.substring(0, 2).toUpperCase()
    return (words[0][0] + words[1][0]).toUpperCase()
  }

  return (
    <>
      <Head title="Iniciar Sesión" />

      <div className="min-h-screen bg-[var(--sf-bg)] flex items-center justify-center px-4">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-[var(--sf-text-main)] font-bold text-2xl mx-auto shadow-lg shadow-primary-500/25">
              {getInitials(app_name)}
            </div>
            <h1 className="mt-4 text-3xl font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
              {app_name}
            </h1>
            <p className="mt-2 text-[var(--sf-text-muted)]">
              Gestión de inventario inteligente
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-[var(--sf-surface)] border border-[var(--sf-border)] rounded-2xl p-8 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-semibold text-[var(--sf-text-main)] mb-6">
              Iniciar Sesión
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[var(--sf-text-muted)] mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={(e) => setData('email', e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl
                    text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                    transition-all duration-200"
                  placeholder="tu@email.com"
                  autoComplete="email"
                  required
                />
                {errors.email && (
                  <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[var(--sf-text-muted)] mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={data.password}
                  onChange={(e) => setData('password', e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl
                    text-[var(--sf-text-main)] placeholder-[var(--sf-text-muted)]
                    focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500
                    transition-all duration-200"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center gap-3 pt-2">
                <CustomSwitch
                  checked={data.remember}
                  onChange={(v) => setData('remember', v)}
                />
                <span className="text-sm text-[var(--sf-text-muted)] font-medium">Recordarme</span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-purple-600
                  hover:from-primary-600 hover:to-purple-700
                  text-[var(--sf-text-main)] font-medium rounded-xl
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-[var(--sf-dark-card)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40"
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
