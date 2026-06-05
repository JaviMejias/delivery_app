class Public::Customers::SessionsController < Devise::SessionsController
  layout "public"
  before_action :find_company_by_slug
  before_action :configure_permitted_parameters, if: :devise_controller?

  def new
    render inertia: "Public/Auth/Login", props: {
      company: @company.slice(:id, :slug, :name)
    }
  end

  def create
    self.resource = warden.authenticate!(auth_options)
    if params.dig(:public_order_customer, :remember_me) == "1" || params.dig(:public_order_customer, :remember_me) == true
      resource.remember_me = true
    end
    set_flash_message!(:notice, :signed_in)
    sign_in(resource_name, resource)
    # Redirect back to the order page
    redirect_to public_order_new_path(@company.slug)
  end

  def destroy
    signed_out = (Devise.sign_out_all_scopes ? sign_out : sign_out(resource_name))
    set_flash_message!(:notice, :signed_out) if signed_out
    redirect_to new_public_order_customer_session_path(company_slug: params[:company_slug])
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_in, keys: [ :login ])
  end

  def find_company_by_slug
    @company = Company.find_by!(slug: params[:company_slug])
  rescue ActiveRecord::RecordNotFound
    render plain: "Empresa no encontrada", status: :not_found
  end
end
