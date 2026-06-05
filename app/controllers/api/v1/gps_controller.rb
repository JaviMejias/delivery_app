module Api
  module V1
    class GpsController < ActionController::API
      def update
        token = params[:token] || request.headers["X-GPS-Token"]

        if token.blank?
          render json: { error: "Token no proporcionado" }, status: :bad_request
          return
        end
        truck = ActsAsTenant.with_tenant(nil) { Truck.find_by(gps_device_token: token) }

        if truck.nil?
          render json: { error: "Camion no encontrado con el token provisto" }, status: :not_found
          return
        end
        ActsAsTenant.with_tenant(truck.company) do
          if truck.update(
            latitude: params[:latitude],
            longitude: params[:longitude],
            gps_last_updated_at: Time.current
          )
            if truck.departure_time.present? && Time.current >= truck.departure_time
              active_order = CustomerOrder.where(truck: truck, status: :accepted).first
              if active_order
                active_order.update!(status: :in_transit)
              end
            end

            render json: {
              status: "success",
              message: "Coordenadas actualizadas con exito",
              truck: {
                plate_number: truck.plate_number,
                latitude: truck.latitude.to_f,
                longitude: truck.longitude.to_f,
                gps_active: true
              }
            }, status: :ok
          else
            render json: { error: truck.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
