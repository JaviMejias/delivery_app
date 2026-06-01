import { useState, useRef } from 'react'
import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout'
import PageHeader from '@/components/PageHeader'
import { Building2 } from 'lucide-react'
import CompanyForm from '@/components/Companies/CompanyForm'
import CompanyTable from '@/components/Companies/CompanyTable'
import { Company } from '@/components/Companies/types'

interface Props {
  companies: Company[]
  pagination: any
}

export default function CompaniesIndex({ companies, pagination }: Props) {
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const formRef = useRef<HTMLDivElement>(null)

  const form = useForm({
    name: '',
    rut: '',
    address: '',
    email: '',
    phone: '',
    business_activity: '',
    website: '',
    legal_representative: '',
    logo: null as File | null,
    active: true,
    enable_public_orders: false,
    company_phones_attributes: [] as { id?: number, number: string, label: string, _destroy?: boolean }[]
  })

  const editCompany = (company: Company) => {
    setEditingCompany(company)
    form.setData({
      name: company.name,
      rut: company.rut || '',
      address: company.address || '',
      email: company.email || '',
      phone: company.phone || '',
      business_activity: company.business_activity || '',
      website: company.website || '',
      legal_representative: company.legal_representative || '',
      logo: null,
      active: company.active,
      enable_public_orders: company.enable_public_orders,
      company_phones_attributes: company.company_phones?.map((p: any) => ({ id: p.id, number: p.number, label: p.label || '' })) || []
    })

    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const cancelEdit = () => {
    setEditingCompany(null)
    form.reset()
    form.clearErrors()
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCompany) {
      if (form.data.logo) {
        form.transform((data) => ({ ...data, _method: 'put' }))
        form.post(`/companies/${editingCompany.id}`, { 
          forceFormData: true,
          onSuccess: () => cancelEdit() 
        })
      } else {
        form.patch(`/companies/${editingCompany.id}`, { onSuccess: () => cancelEdit() })
      }
    } else {
      form.post('/companies', { forceFormData: true, onSuccess: () => cancelEdit() })
    }
  }

  return (
    <AuthenticatedLayout>
      <Head title="Empresas" />

      <div className="space-y-6">
        <PageHeader 
          icon={<Building2 className="w-8 h-8 opacity-80" />}
          title="Empresas y Sucursales"
          description="Administra las diferentes empresas, razones sociales o sucursales de tu holding."
          color="indigo"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1" ref={formRef}>
            <CompanyForm
              form={form}
              editingCompany={editingCompany}
              onSubmit={submit}
              onCancel={cancelEdit}
            />
          </div>

          <div className="lg:col-span-2">
            <CompanyTable
              companies={companies}
              pagination={pagination}
              editingCompany={editingCompany}
              onEdit={editCompany}
            />
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}
