import { User, Phone, MapPin, Info, Package, Zap, Mic, AlertCircle, CheckCircle } from 'lucide-react'
import PhoneInput from '@/components/PhoneInput'
import ProductSelector from '@/components/ProductSelector'
import { BrandData, OrderMode, CartItem, ProductData, SubmitState } from './types'

interface OrderFormProps {
  isMapExpanded: boolean
  clientName: string
  setClientName: (v: string) => void
  phone: string
  setPhone: (v: string) => void
  addressText: string
  handleAddressChange: (e: any) => void
  addressSuggestions: any[]
  showSuggestions: boolean
  setShowSuggestions: (v: boolean) => void
  handleSelectSuggestion: (s: any) => void
  searchAddress: () => void
  isGeocoding: boolean
  notes: string
  setNotes: (v: string) => void
  mode: OrderMode
  setMode: (v: OrderMode) => void
  quickOrder: string
  setQuickOrder: (v: string) => void
  isListening: boolean
  toggleDictation: () => void
  cart: CartItem[]
  updateCart: (p: ProductData, b: string, d: number) => void
  submitState: SubmitState
  errorMsg: string | null
  handleSubmit: () => void
  isFormValid: () => boolean
  brands: BrandData[]
  currentStep: number
  setStep: (step: number) => void
  current_customer?: any
}

export default function OrderForm({
  isMapExpanded, clientName, setClientName, phone, setPhone, addressText, handleAddressChange,
  addressSuggestions, showSuggestions, setShowSuggestions, handleSelectSuggestion, searchAddress,
  isGeocoding, notes, setNotes, mode, setMode, quickOrder, setQuickOrder, isListening, toggleDictation,
  cart, updateCart, submitState, errorMsg, handleSubmit, isFormValid, brands, currentStep, setStep, current_customer
}: OrderFormProps) {
  // Check that the phone has at least 8 digits to ensure it's not just the country code
  const isPhoneValid = phone.replace(/\D/g, '').length >= 8
  const isStep2Valid = !!(clientName.trim() && isPhoneValid && addressText.trim())
  const isStep3Valid = (mode === 'quick' && !!quickOrder.trim()) || (mode === 'cart' && cart.some(i => i.quantity > 0))

  return (
    <div className="max-w-lg lg:max-w-none mx-auto px-6 lg:px-10 pt-10 lg:pt-12 space-y-8 pb-10">
      {currentStep === 2 && (
      <section className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 shadow-xl flex items-center justify-center mb-4 relative">
             <div className="absolute inset-0 rounded-full bg-orange-500/10 animate-pulse"></div>
             <User className="w-7 h-7 text-orange-500 relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Tus Datos</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest text-[10px]">Paso 2 de 4</p>
        </div>
        
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 shadow-inner space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              placeholder="Nombre y Apellido"
              className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder-slate-500 font-medium text-sm focus:ring-2 focus:ring-orange-500 transition-all shadow-inner"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 z-10" />
            <PhoneInput
              value={phone}
              onValueChange={setPhone}
              className="!w-full !pl-12 !pr-4 !py-4 !bg-slate-950 !border-white/5 !rounded-2xl !text-white !placeholder-slate-500 !font-medium !text-sm focus:!ring-2 focus:!ring-orange-500 !shadow-inner"
            />
          </div>
          <div className="relative z-20">
            <MapPin className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
            <textarea
              value={addressText}
              onChange={handleAddressChange}
              onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Dirección exacta (Ej: Av. Principal 123)"
              rows={2}
              className="w-full pl-12 pr-14 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder-slate-500 font-medium text-sm focus:ring-2 focus:ring-orange-500 transition-all shadow-inner resize-none relative z-10"
            />
            
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute top-[100%] left-0 right-0 mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                {addressSuggestions.map((s, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => handleSelectSuggestion(s)}
                    className="p-3 border-b border-white/5 hover:bg-slate-700 cursor-pointer transition-colors flex items-start gap-3"
                  >
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-white leading-tight">{s.display_name}</p>
                  </div>
                ))}
                <div className="p-2 bg-slate-900/50 text-center flex justify-center">
                   <button onClick={() => setShowSuggestions(false)} className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-widest">Cerrar sugerencias</button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={searchAddress}
              className="absolute right-3 top-3 w-8 h-8 rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center active:scale-95 transition-transform z-20 shadow-lg"
            >
              {isGeocoding ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              )}
            </button>
          </div>

          <div className="flex items-start gap-3 bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 shadow-inner">
            <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-orange-300 leading-snug font-medium">
              Esta dirección escrita es <strong className="text-orange-400">solo referencial</strong>. Por precisión, el repartidor siempre será guiado mediante GPS hacia el punto exacto que marcaste en el mapa.
            </p>
          </div>

          <div className="relative">
            <Info className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Nota (Ej: Timbre malo, dejar en portería)"
              rows={2}
              className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder-slate-500 font-medium text-sm focus:ring-2 focus:ring-orange-500 transition-all shadow-inner resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95 transition-all"
          >
            Atrás
          </button>
          <button
            onClick={() => setStep(3)}
            disabled={!isStep2Valid}
            className={`flex-1 py-4 rounded-2xl font-black text-center transition-all ${
              isStep2Valid
                ? 'bg-orange-500 text-white shadow-[0_5px_20px_rgba(249,115,22,0.3)] active:scale-95 hover:bg-orange-600'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
            }`}
          >
            Siguiente Paso
          </button>
        </div>
      </section>
      )}

      {currentStep === 3 && (
      <section className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex flex-col items-center justify-center text-center mb-6 relative">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 shadow-xl flex items-center justify-center mb-4 relative">
             <div className="absolute inset-0 rounded-full bg-primary-500/10 animate-pulse"></div>
             <Package className="w-7 h-7 text-primary-400 relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">¿Qué necesitas?</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest text-[10px]">Paso 3 de 4</p>
          
          {mode !== 'choose' && (
            <button onClick={() => setMode('choose')} className="absolute right-0 top-0 text-[10px] font-bold text-orange-500 hover:text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20 active:scale-95 transition-transform uppercase tracking-widest">
              Cambiar
            </button>
          )}
        </div>

        <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 shadow-inner">
          {mode === 'choose' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setMode('cart')}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-transparent hover:border-orange-500/50 transition-all active:scale-95 text-center group shadow-md"
              >
                <div className="w-14 h-14 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform border border-white/5">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Productos</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Elegir envases</p>
                </div>
              </button>

              <button
                onClick={() => setMode('quick')}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-transparent hover:border-primary-500/50 transition-all active:scale-95 text-center group shadow-md"
              >
                <div className="w-14 h-14 rounded-full bg-slate-800 shadow-inner flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform border border-white/5">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-black text-white text-sm">Rápido</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Escribir pedido</p>
                </div>
              </button>
            </div>
          )}

          {mode === 'quick' && (
            <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300">
              <textarea
                value={quickOrder}
                onChange={e => setQuickOrder(e.target.value)}
                placeholder="Ej: Hola, necesito un galón de 15 kilos..."
                rows={3}
                className="w-full px-5 py-4 pb-14 bg-slate-950 border border-white/5 rounded-2xl text-white placeholder-slate-500 font-medium text-sm focus:ring-2 focus:ring-primary-500 shadow-inner resize-none"
                autoFocus
              />
              
              {isListening && (
                <div className="absolute left-5 bottom-4 flex items-center gap-2">
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest animate-pulse">
                    Escuchando...
                  </span>
                  <div className="flex items-end gap-0.5 h-3 ml-1">
                    <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_0ms] h-full"></div>
                    <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_200ms] h-2/3"></div>
                    <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_400ms] h-full"></div>
                    <div className="w-1 bg-red-500 rounded-full animate-[bounce_1s_infinite_600ms] h-1/2"></div>
                  </div>
                </div>
              )}

              <button
                onClick={toggleDictation}
                className={`absolute right-3 bottom-3 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-90 ${
                  isListening 
                    ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' 
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>
          )}

          {mode === 'cart' && (
            <ProductSelector brands={brands as any} cart={cart} updateCart={updateCart as any} />
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95 transition-all"
          >
            Atrás
          </button>
          <button
            onClick={() => setStep(4)}
            disabled={!isStep3Valid}
            className={`flex-1 py-4 rounded-2xl font-black text-center transition-all ${
              isStep3Valid
                ? 'bg-orange-500 text-white shadow-[0_5px_20px_rgba(249,115,22,0.3)] active:scale-95 hover:bg-orange-600'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
            }`}
          >
            Siguiente Paso
          </button>
        </div>
      </section>
      )}

      {currentStep === 4 && (
      <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex flex-col items-center justify-center text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 shadow-xl flex items-center justify-center mb-4 relative">
             <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse"></div>
             <CheckCircle className="w-7 h-7 text-emerald-400 relative z-10" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Resumen Final</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium uppercase tracking-widest text-[10px]">Paso 4 de 4</p>
        </div>

        <div className="relative bg-gradient-to-b from-slate-900 to-slate-950 rounded-[2rem] p-6 sm:p-8 shadow-2xl border border-white/5 overflow-hidden">
          {/* Receipt jagged edge effect */}
          <div className="absolute top-0 left-0 right-0 flex justify-around opacity-20">
            {Array.from({length: 20}).map((_, i) => (
              <div key={i} className="w-2 h-2 bg-slate-950 rounded-b-full" />
            ))}
          </div>

          <div className="space-y-6 relative z-10">
            <div className="pb-6 border-b border-dashed border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-orange-500" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tus Datos</p>
              </div>
              <p className="text-base text-white font-black">{clientName}</p>
              <p className="text-sm text-slate-300 mb-2">{phone}</p>
              <div className="flex items-start gap-2 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300 leading-snug">{addressText}</p>
              </div>
            </div>

            <div className={`${notes ? 'pb-6 border-b border-dashed border-white/10' : ''}`}>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-4 h-4 text-primary-400" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tu Pedido</p>
              </div>
              {mode === 'quick' ? (
                <div className="bg-primary-500/10 p-4 rounded-xl border border-primary-500/20">
                  <p className="text-sm text-primary-100 font-medium italic leading-relaxed">"{quickOrder}"</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {cart.filter(i => i.quantity > 0).map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm font-medium bg-slate-800/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-orange-500 font-black border border-white/5">
                          {item.quantity}
                        </div>
                        <span className="text-slate-200">{item.name} <span className="text-slate-500 text-xs ml-1">({item.brand_name})</span></span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {notes && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-slate-500" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Nota al repartidor</p>
                </div>
                <p className="text-sm text-slate-300 italic bg-slate-950/50 p-3 rounded-xl border border-white/5">"{notes}"</p>
              </div>
            )}
          </div>
        </div>

        {submitState === 'error' && errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="text-sm font-semibold text-red-400">{errorMsg}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => {
              if (window.location.search.includes('reorder=')) {
                const slug = window.location.pathname.split('/')[2]
                window.location.href = `/order/${slug}/history`
              } else {
                setStep(3)
              }
            }}
            className="px-6 py-4 rounded-2xl bg-slate-800 text-white font-bold hover:bg-slate-700 active:scale-95 transition-all"
          >
            {window.location.search.includes('reorder=') ? 'Cancelar' : 'Atrás'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitState === 'submitting'}
            className={`flex-1 py-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isFormValid()
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.3)]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {submitState === 'submitting' ? (
              <span className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Confirmar Pedido'
            )}
          </button>
        </div>
      </section>
      )}
    </div>
  )
}
