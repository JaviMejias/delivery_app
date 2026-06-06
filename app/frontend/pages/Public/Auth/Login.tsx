import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { User, Lock, ArrowLeft } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'
import { motion } from 'framer-motion'

export default function Login({ company }: { company: { id: number, slug: string, name: string } }) {
  const { data, setData, post, processing, errors } = useForm({
    public_order_customer: {
      login: '',
      password: '',
      remember_me: '1'
    }
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post(`/order/${company.slug}/auth/login`)
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center px-4 relative overflow-hidden text-slate-200">
      <Head title={`Iniciar Sesión - ${company.name}`} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 1],
            x: ['-10%', '10%', '-10%']
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 -left-1/4 w-[40rem] h-[40rem] bg-primary-500/10 rounded-full blur-[100px] mix-blend-screen" 
        />
        <motion.div 
          animate={{ 
            rotate: [360, 270, 180, 90, 0],
            scale: [1, 1.3, 1],
            x: ['10%', '-10%', '10%']
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 -right-1/4 w-[45rem] h-[45rem] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm z-10"
      >
        <Link href={`/order/${company.slug}`} className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium mb-6 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Volver a {company.name}
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
          
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">¡Hola de nuevo! 👋</h2>
          <p className="text-sm text-slate-400 mb-8 font-medium">Inicia sesión con tu teléfono o correo</p>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono o Correo</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={data.public_order_customer.login}
                  onChange={e => setData('public_order_customer', { ...data.public_order_customer, login: e.target.value })}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                  placeholder="ej. 56912345678 o correo@ejemplo.com"
                />
              </div>
              {errors['public_order_customer.login'] && <span className="text-rose-400 text-xs font-semibold">{errors['public_order_customer.login']}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={data.public_order_customer.password}
                  onChange={e => setData('public_order_customer', { ...data.public_order_customer, password: e.target.value })}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                  placeholder="Tu contraseña"
                />
              </div>
              {errors['public_order_customer.password'] && <span className="text-rose-400 text-xs font-semibold">{errors['public_order_customer.password']}</span>}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <CustomSwitch
                checked={data.public_order_customer.remember_me === '1'}
                onChange={(v) => setData('public_order_customer', { ...data.public_order_customer, remember_me: v ? '1' : '0' })}
              />
              <span className="text-sm text-slate-400 font-medium">Mantener mi sesión iniciada</span>
            </div>
            
            {(errors as any).email && <span className="text-rose-400 text-xs font-semibold block bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{(errors as any).email}</span>}
            {(errors as any).phone && <span className="text-rose-400 text-xs font-semibold block bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">{(errors as any).phone}</span>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {processing ? 'INICIANDO...' : 'INICIAR SESIÓN'}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            ¿No tienes cuenta? <Link href={`/order/${company.slug}/auth/register`} className="text-orange-400 hover:text-orange-300 font-bold transition-colors">Regístrate aquí</Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
