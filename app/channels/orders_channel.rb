class OrdersChannel < ApplicationCable::Channel
  def subscribed
    reject unless current_user
    
    # Stream from the company's specific channel
    company_id = current_user.current_company_id
    stream_from "orders_#{company_id}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
