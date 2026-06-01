import React from 'react'
import { Building2, Pencil, Save, X, Plus, Trash2 } from 'lucide-react'
import { CustomSwitch } from '@/components/CustomSwitch'
import RutInput from '@/components/RutInput'
import PhoneInput from '@/components/PhoneInput'
import Card from '@/components/Card'
import { Company } from './types'

interface CompanyFormProps {
  form: any
  editingCompany: Company | null
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

export default function CompanyForm({ form, editingCompany, onSubmit, onCancel }: CompanyFormProps) {
  return (
    <Card className={editingCompany ? 'ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] transition-all duration-300' : 'transition-all duration-300'}>
      <Card.Body>
        <div className={`flex items-center gap-3 p-4 mb-4 rounded-xl border ${
          editingCompany 
            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
            : 'bg-[var(--sf-surface)] border-[var(--sf-border)] text-[var(--sf-text-main)]'
        }`}>
          {editingCompany ? <Pencil className="w-5 h-5 shrink-0" /> : <Building2 className="w-5 h-5 shrink-0 text-[var(--sf-text-muted)]" />}
          <div className="min-w-0">
            <h2 className="font-semibold text-sm truncate">
              {editingCompany ? 'Editando Empresa' : 'Registrar Nueva Empresa'}
            </h2>
            {editingCompany && (
              <p className="text-xs opacity-80 truncate">{editingCompany.name}</p>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Razón Social o Nombre</label>
            <input
              type="text"
              value={form.data.name}
              onChange={e => form.setData('name', e.target.value)}
              className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
              required
              placeholder="Ej. Gas Norte SpA"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">RUT</label>
              <RutInput
                value={form.data.rut}
                onValueChange={(val) => form.setData('rut', val)}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--sf-border)] space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="block text-xs font-medium text-[var(--sf-text-muted)] uppercase tracking-wider">Teléfonos de Contacto</h3>
              <button
                type="button"
                onClick={() => {
                  form.setData('company_phones_attributes', [
                    ...form.data.company_phones_attributes,
                    { number: '', label: '' }
                  ])
                }}
                className="text-xs flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold"
              >
                <Plus className="w-3 h-3" /> Añadir
              </button>
            </div>
            
            <div className="space-y-3">
              {form.data.company_phones_attributes.map((phone: any, index: number) => {
                if (phone._destroy) return null
                return (
                  <div key={index} className="flex gap-2 items-start bg-[var(--sf-surface)] p-3 rounded-xl border border-[var(--sf-border)] shadow-sm">
                    <div className="flex-1 space-y-2">
                      <PhoneInput
                        value={phone.number}
                        onValueChange={(val) => {
                          const newPhones = [...form.data.company_phones_attributes]
                          newPhones[index].number = val
                          form.setData('company_phones_attributes', newPhones)
                        }}
                      />
                      <input
                        type="text"
                        value={phone.label}
                        onChange={e => {
                          const newPhones = [...form.data.company_phones_attributes]
                          newPhones[index].label = e.target.value
                          form.setData('company_phones_attributes', newPhones)
                        }}
                        placeholder="Etiqueta (Ej: Ventas, Emergencias...)"
                        className="w-full px-3 py-1.5 text-xs bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-lg text-[var(--sf-text-main)] focus:ring-1 focus:ring-indigo-500/50 transition-shadow"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newPhones = [...form.data.company_phones_attributes]
                        if (newPhones[index].id) {
                          newPhones[index]._destroy = true
                        } else {
                          newPhones.splice(index, 1)
                        }
                        form.setData('company_phones_attributes', newPhones)
                      }}
                      className="p-2 text-[var(--sf-text-muted)] hover:text-rose-400 bg-[var(--sf-bg)] hover:bg-[var(--sf-border)] rounded-lg transition-colors mt-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
              {form.data.company_phones_attributes.filter((p: any) => !p._destroy).length === 0 && (
                <div className="text-xs text-center text-[var(--sf-text-muted)] py-4 bg-[var(--sf-surface)] rounded-xl border border-[var(--sf-border)] border-dashed">
                  No hay teléfonos registrados
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Email Contacto</label>
            <input
              type="email"
              value={form.data.email}
              onChange={e => form.setData('email', e.target.value)}
              className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
              placeholder="Ej. contacto@empresa.cl"
            />
            {form.errors.email && <div className="text-red-400 text-xs mt-1">{form.errors.email}</div>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Giro Comercial</label>
            <input
              type="text"
              value={form.data.business_activity}
              onChange={e => form.setData('business_activity', e.target.value)}
              className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
              placeholder="Ej. Venta al por menor de gas licuado"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Dirección</label>
            <input
              type="text"
              value={form.data.address}
              onChange={e => form.setData('address', e.target.value)}
              className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
              placeholder="Ej. Av. Siempreviva 123"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--sf-text-muted)] mb-1 uppercase tracking-wider">Representante Legal</label>
            <input
              type="text"
              value={form.data.legal_representative}
              onChange={e => form.setData('legal_representative', e.target.value)}
              className="w-full px-4 py-2 bg-[var(--sf-bg)] border border-[var(--sf-border)] rounded-xl text-[var(--sf-text-main)] focus:ring-2 focus:ring-indigo-500/50 transition-shadow"
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="pt-4 border-t border-[var(--sf-border)] space-y-4">
            <h3 className="text-sm font-bold text-[var(--sf-text-main)] mb-2">Imagen / Logotipo</h3>
            <div>
              <input 
                type="file"
                accept=".png,.jpg,.jpeg"
                onChange={e => form.setData('logo', e.target.files ? e.target.files[0] : null)}
                className="w-full text-sm text-[var(--sf-text-muted)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
              />
              {editingCompany?.logo_url && !form.data.logo && (
                <div className="mt-2 text-xs text-[var(--sf-text-muted)]">
                  Ya existe un logo asociado a esta empresa. Si subes uno nuevo, se reemplazará.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--sf-border)] space-y-4">
            <CustomSwitch
              checked={form.data.active}
              onChange={(checked) => form.setData('active', checked)}
              label="Empresa Activa"
              description="Habilita o deshabilita el acceso y operaciones en esta empresa."
            />
            <CustomSwitch
              checked={form.data.enable_public_orders}
              onChange={(checked) => form.setData('enable_public_orders', checked)}
              label="Portal de Pedidos Públicos"
              description="Habilita un enlace público para que clientes externos hagan pedidos."
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={form.processing}
              className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-[var(--sf-text-main)] font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              <Save className="w-4 h-4" />
              {editingCompany ? 'Actualizar Empresa' : 'Registrar Empresa'}
            </button>
            {editingCompany && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full mt-2 py-2.5 bg-[var(--sf-surface)] border border-[var(--sf-border)] hover:bg-[var(--sf-border)] text-[var(--sf-text-main)] font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
