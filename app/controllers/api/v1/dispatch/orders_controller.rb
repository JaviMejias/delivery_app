module Api
  module V1
    module Dispatch
      class OrdersController < ApplicationController
        before_action :authenticate_user!

        def create
          order_data = params.require(:order)
          order = CustomerOrder.new(
            company_id: current_user.current_company_id,
            client_name: order_data[:client_name],
            phone: order_data[:phone],
            address: order_data[:address],
            latitude: order_data[:latitude],
            longitude: order_data[:longitude],
            notes: order_data[:notes],
            details: order_data[:details].present? ? order_data.permit(details: {})[:details] || order_data[:details].to_unsafe_h : {}
          )

          if order.save
            render json: { success: true, order: order }
          else
            render json: { success: false, errors: order.errors.full_messages }, status: :unprocessable_entity
          end
        end
      end
    end
  end
end
