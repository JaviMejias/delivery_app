class Public::CustomerAddressesController < ApplicationController
  skip_before_action :authenticate_user!, raise: false
  skip_before_action :require_admin!, raise: false
  before_action :find_company_by_slug
  before_action :require_customer!

  layout "public"

  def index
    @addresses = current_public_order_customer.customer_addresses.order(is_default: :desc, created_at: :desc)
    render inertia: "Public/Order/Addresses", props: {
      company: @company.slice(:id, :slug, :name, :address, :phone),
      current_customer: current_public_order_customer.slice(:id, :first_name, :last_name),
      addresses: @addresses
    }
  end

  def create
    @address = current_public_order_customer.customer_addresses.build(address_params)

    # If this is the first address or marked as default, make others not default
    if @address.is_default || current_public_order_customer.customer_addresses.count == 0
      @address.is_default = true
      current_public_order_customer.customer_addresses.update_all(is_default: false)
    end

    if @address.save
      render json: { success: true, address: @address }
    else
      render json: { success: false, errors: @address.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @address = current_public_order_customer.customer_addresses.find(params[:id])
    @address.destroy
    redirect_to public_order_customer_addresses_path(company_slug: @company.slug), notice: "Dirección eliminada"
  end

  def update
    @address = current_public_order_customer.customer_addresses.find(params[:id])
    if @address.update(address_params)
      render json: { success: true, address: @address }
    else
      render json: { success: false, errors: @address.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def set_default
    @address = current_public_order_customer.customer_addresses.find(params[:id])
    current_public_order_customer.customer_addresses.update_all(is_default: false)
    @address.update(is_default: true)
    redirect_to public_order_customer_addresses_path(company_slug: @company.slug), notice: "Dirección principal actualizada"
  end

  private

  def address_params
    params.require(:customer_address).permit(:alias, :address, :latitude, :longitude, :is_default, :notes)
  end

  def require_customer!
    unless current_public_order_customer
      redirect_to new_public_order_customer_session_path(company_slug: @company.slug)
    end
  end

  def find_company_by_slug
    @company = Company.find_by!(slug: params[:company_slug])
  rescue ActiveRecord::RecordNotFound
    render plain: "Empresa no encontrada", status: :not_found
  end
end
