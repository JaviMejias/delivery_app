import React, { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { User, Lock, Mail, ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import Swal from 'sweetalert2'
import PhoneInput from '@/components/PhoneInput'

export default function Register({ company }: { company: { id: number, slug: string, name: string } }) {
  const { data, setData, processing, errors } = useForm({
    customer: {
      first_name: '',
      last_name: '',
      phone: '',
      email: '',
      password: '',
      password_confirmation: ''
    }
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = (document.querySelector('meta[name="csrf-token"]') as any)?.content || ''
      const res = await fetch(`/order/${company.slug}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify({ public_order_customer: data.customer })
      })
      const result = await res.json()
      
      if (result.success) {
        window.location.href = `/order/${company.slug}`
      } else if (result.errors) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Registro',
          text: result.errors.join(', '),
          background: '#0f172a',
          color: 'white'
        })
      }
    } catch (e) {
      alert("Error de conexión")
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden text-slate-200">
      <Head title={`Registro - ${company.name}`} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
        <motion.div 
          animate={{ 
            rotate: [0, 90, 180, 270, 360],
            scale: [1, 1.2, 1],
            x: ['-10%', '10%', '-10%']
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 -left-1/4 w-[40rem] h-[40rem] bg-orange-500/10 rounded-full blur-[100px] mix-blend-screen" 
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
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md z-10"
      >
        <Link href={`/order/${company.slug}/auth/login`} className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-medium mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Volver al Inicio de Sesión
        </Link>
        
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
          
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Nueva Cuenta ✨</h2>
          <p className="text-sm text-slate-400 mb-8 font-medium">Guarda tus datos para pedir más rápido en {company.name}</p>

          <form onSubmit={submit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre</label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="text" required
                    value={data.customer.first_name}
                    onChange={e => setData('customer', { ...data.customer, first_name: e.target.value })}
                    className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl pl-11 pr-3 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Apellido</label>
                <input
                  type="text" required
                  value={data.customer.last_name}
                  onChange={e => setData('customer', { ...data.customer, last_name: e.target.value })}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Teléfono (Celular)</label>
              <div className="relative">
                <PhoneInput
                  value={data.customer.phone}
                  onValueChange={(val) => setData('customer', { ...data.customer, phone: val })}
                  className="!w-full !bg-slate-950/50 !backdrop-blur-sm !border-white/5 !rounded-2xl !py-3.5 !text-white !placeholder-slate-600 focus:!outline-none focus:!bg-slate-900 focus:!border-orange-500 focus:!ring-1 focus:!ring-orange-500 !transition-all !shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Correo (Opcional)</label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                <input
                  type="email"
                  value={data.customer.email}
                  onChange={e => setData('customer', { ...data.customer, email: e.target.value })}
                  className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                  placeholder="correo@ejemplo.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="password" required minLength={6}
                    value={data.customer.password}
                    onChange={e => setData('customer', { ...data.customer, password: e.target.value })}
                    className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Repetir Contraseña</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-4 top-3.5 text-slate-500" />
                  <input
                    type="password" required minLength={6}
                    value={data.customer.password_confirmation}
                    onChange={e => setData('customer', { ...data.customer, password_confirmation: e.target.value })}
                    className="w-full bg-slate-950/50 backdrop-blur-sm border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:bg-slate-900 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={processing}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.2)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {processing ? 'REGISTRANDO...' : 'CREAR CUENTA'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
