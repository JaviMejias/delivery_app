class UsersController < ApplicationController
  before_action :require_admin!
  wrap_parameters include: User.attribute_names + [ :password, :password_confirmation, :warehouse_id ]

  def index
    users = ActsAsTenant.current_tenant.users.order(id: :asc)
    
    if params[:role].present? && params[:role] != 'all'
      users = users.where(role: params[:role])
    end

    pagy, records = pagy(users, limit: 15)

    users_with_warehouse = records.as_json(only: %i[id email first_name last_name role active rut phone license_type license_expiration birthday]).map do |user_json|
      membership = CompanyMembership.find_by(user_id: user_json["id"], company_id: ActsAsTenant.current_tenant.id)
      user_json["warehouse_id"] = membership&.warehouse_id
      user_json
    end

    render inertia: "Users/Index", props: {
      users: users_with_warehouse,
      warehouses: Warehouse.active_warehouses.as_json(only: [ :id, :name ]),
      pagination: extract_pagy(pagy),
      currentRole: params[:role]
    }
  end

  def create
    warehouse_id = params.dig(:user, :warehouse_id)
    user = User.new(user_params)
    user.current_company = ActsAsTenant.current_tenant

    if user.save
      CompanyMembership.create!(user: user, company: ActsAsTenant.current_tenant, role: user.role, warehouse_id: warehouse_id)
      redirect_to users_path, notice: "Usuario creado exitosamente."
    else
      redirect_to users_path, alert: "Error: #{user.errors.full_messages.join(', ')}"
    end
  end

  def update
    user = ActsAsTenant.current_tenant.users.find(params[:id])
    warehouse_id = params.dig(:user, :warehouse_id)

    upd_params = user_params
    if upd_params[:password].blank?
      upd_params.delete(:password)
      upd_params.delete(:password_confirmation)
    end

    if user.update(upd_params)
      membership = CompanyMembership.find_by(user: user, company: ActsAsTenant.current_tenant)
      membership&.update(role: user.role, warehouse_id: warehouse_id)

      redirect_to users_path, notice: "Usuario actualizado."
    else
      redirect_to users_path, alert: "Error: #{user.errors.full_messages.join(', ')}"
    end
  end

  def destroy
    user = ActsAsTenant.current_tenant.users.find(params[:id])

    if user == current_user
      redirect_to users_path, alert: "No puedes eliminar tu propio usuario."
      return
    end

    user.update(active: false)
    redirect_to users_path, notice: "Usuario desactivado."
  end

  private

  def user_params
    permitted = params.require(:user).permit(
      :first_name, :last_name, :email, :password, :password_confirmation, :active,
      :rut, :phone, :license_type, :license_expiration, :birthday
    )

    if params.dig(:user, :role).present?
      permitted[:role] = params.dig(:user, :role)
    end

    if permitted[:password].blank?
      permitted.delete(:password)
      permitted.delete(:password_confirmation)
    else
      permitted[:password_confirmation] = permitted[:password]
    end

    permitted
  end
end
