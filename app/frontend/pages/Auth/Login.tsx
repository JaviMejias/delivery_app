import { Head, useForm, usePage } from '@inertiajs/react'
import { FormEvent } from 'react'
import { CustomSwitch } from '@/components/CustomSwitch'
import { motion } from 'framer-motion'

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

      <div className="min-h-screen bg-[var(--sf-app-bg)] flex items-center justify-center px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              rotate: [0, 90, 180, 270, 360],
              scale: [1, 1.1, 1],
              x: ['-20%', '0%', '-20%']
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/4 -left-32 w-[30rem] h-[30rem] bg-primary-500/20 rounded-full blur-[120px] mix-blend-screen" 
          />
          <motion.div 
            animate={{ 
              rotate: [360, 270, 180, 90, 0],
              scale: [1, 1.2, 1],
              x: ['20%', '0%', '20%']
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-1/4 -right-32 w-[35rem] h-[35rem] bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen" 
          />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md z-10"
        >
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
            className="text-center mb-8"
          >
            <div className="w-20 h-20 rounded-3xl bg-[var(--sf-surface)] border border-white/10 flex items-center justify-center text-[var(--sf-text-main)] font-black text-3xl mx-auto shadow-2xl shadow-primary-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-purple-600/20 group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10 bg-gradient-to-br from-primary-400 to-purple-400 bg-clip-text text-transparent drop-shadow-sm">{getInitials(app_name)}</span>
            </div>
            <h1 className="mt-6 text-3xl font-black bg-gradient-to-r from-primary-400 via-white to-purple-400 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
              {app_name}
            </h1>
            <p className="mt-2 text-sm text-[var(--sf-text-muted)] font-medium">
              Gestión de inventario inteligente
            </p>
          </motion.div>

          {/* Login Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="bg-[var(--sf-surface)]/80 backdrop-blur-2xl border border-[var(--sf-border)] rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
            
            <h2 className="text-xl font-bold text-[var(--sf-text-main)] mb-6 flex items-center gap-3">
              <span className="w-1.5 h-6 rounded-full bg-primary-500 shadow-[0_0_10px_var(--sf-primary-500)]" />
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={processing}
                className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-primary-500 to-purple-600
                  hover:from-primary-400 hover:to-purple-500
                  text-white font-black tracking-wider rounded-xl
                  transition-all duration-300
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-[var(--sf-bg)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]"
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
                  'INGRESAR AL SISTEMA'
                )}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
