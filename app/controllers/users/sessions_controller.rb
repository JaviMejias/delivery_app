
class Users::SessionsController < Devise::SessionsController
  skip_before_action :authenticate_user!, only: %i[new create]

  def new
    render inertia: "Auth/Login"
  end

  def create
    self.resource = warden.authenticate!(auth_options)
    if params.dig(:user, :remember_me) == "1" || params.dig(:user, :remember_me) == true
      resource.remember_me = true
    end
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource)
    redirect_to after_sign_in_path_for(resource)
  end

  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    set_flash_message!(:notice, :signed_out) if signed_out
    redirect_to new_user_session_path
  end

  protected

  def after_sign_in_path_for(resource)
    if resource.driver?
      driver_radar_path
    elsif resource.cashier?
      local_sales_path
    elsif resource.warehouse_keeper?
      inventory_stock_path
    else
      dashboard_path
    end
  end
end
