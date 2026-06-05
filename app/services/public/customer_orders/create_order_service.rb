module Public
  module CustomerOrders
    class CreateOrderService
      def self.call(company, params)
        order = CustomerOrder.new(
          company: company,
          client_name: params[:client_name],
          phone: params[:phone],
          address: params[:address],
          latitude: params[:latitude],
          longitude: params[:longitude],
          notes: params[:notes],
          customer_id: params[:customer_id],
          details: params[:details].permit!.to_h
        )

        if order.save
          { success: true, order: order }
        else
          { success: false, errors: order.errors.full_messages }
        end
      end
    end
  end
end
