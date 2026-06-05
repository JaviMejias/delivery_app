class Public::Customers::RegistrationsController < Devise::RegistrationsController
  layout "public"
  before_action :find_company_by_slug
  before_action :configure_permitted_parameters, if: :devise_controller?

  def new
    render inertia: "Public/Auth/Register", props: {
      company: @company.slice(:id, :slug, :name)
    }
  end

  def create
    build_resource(sign_up_params)
    resource.company_id = @company.id

    resource.save
    yield resource if block_given?
    if resource.persisted?
      if resource.active_for_authentication?
        set_flash_message! :notice, :signed_up
        sign_up(resource_name, resource)
        # return json if json request, or redirect
        respond_to do |format|
          format.json { render json: { success: true } }
          format.html { redirect_to public_order_new_path(@company.slug) }
        end
      else
        set_flash_message! :notice, :"signed_up_but_#{resource.inactive_message}"
        expire_data_after_sign_in!
        respond_to do |format|
          format.json { render json: { success: true } }
          format.html { redirect_to public_order_new_path(@company.slug) }
        end
      end
    else
      clean_up_passwords resource
      set_minimum_password_length
      respond_to do |format|
        format.json { render json: { errors: resource.errors.full_messages }, status: :unprocessable_entity }
        format.html do
          # Redirect back to inertia with errors is handled by inertia-rails usually, but Devise natively doesn't play well.
          # We'll just return the errors as JSON for an API call, which is easier for React to handle.
          redirect_to new_customer_registration_path(company_slug: @company.slug), alert: resource.errors.full_messages.join(", ")
        end
      end
    end
  end

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [ :first_name, :last_name, :phone, :email, :address, :latitude, :longitude ])
  end

  def find_company_by_slug
    @company = Company.find_by!(slug: params[:company_slug])
  rescue ActiveRecord::RecordNotFound
    render plain: "Empresa no encontrada", status: :not_found
  end
end
