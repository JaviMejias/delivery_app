class CompaniesController < ApplicationController
  before_action :require_admin!

  def index
    companies = Company.includes(:company_phones).order(id: :asc)
    pagy, records = pagy(companies, limit: 15)

    companies_json = records.map do |c|
      c.as_json(include: :company_phones).merge({
        logo_url: c.logo.attached? ? rails_blob_path(c.logo, only_path: true) : nil
      })
    end

    render inertia: "Companies/Index", props: {
      companies: companies_json,
      pagination: extract_pagy(pagy)
    }
  end

  def create
    company = Company.new(company_params)
    if company.save
      CompanyMembership.create!(user: current_user, company: company, role: "admin")
      redirect_to companies_path, notice: "Empresa creada exitosamente."
    else
      redirect_to companies_path, alert: "Error al crear la empresa: #{company.errors.full_messages.join(', ')}"
    end
  end

  def update
    company = Company.find(params[:id])
    if company.update(company_params)
      redirect_to companies_path, notice: "Empresa actualizada."
    else
      redirect_to companies_path, alert: "Error al actualizar la empresa."
    end
  end

  def switch
    company = Company.find(params[:id])
    if current_user.update(current_company_id: company.id)
      redirect_to dashboard_path, notice: "Cambiado a #{company.name}"
    else
      redirect_back fallback_location: dashboard_path, alert: "No se pudo cambiar de empresa."
    end
  end

  private

  def company_params
    p = params[:company].present? ? params.require(:company) : params
    p.permit(
      :name, :rut, :address, :email, :phone, 
      :business_activity, :website, :legal_representative, :active, :logo,
      :enable_public_orders,
      company_phones_attributes: [:id, :number, :label, :_destroy]
    )
  end
end
