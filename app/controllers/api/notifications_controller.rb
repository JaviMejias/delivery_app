class Api::NotificationsController < ApplicationController
  def index
    @notifications = current_tenant.notifications
                            .where(user: [nil, current_user])
                            .recent
                            .limit(20)
    
    render json: {
      notifications: @notifications,
      unread_count: @notifications.where(read_at: nil).count
    }
  end

  def mark_all_read
    current_tenant.notifications
           .where(user: [nil, current_user])
           .unread
           .update_all(read_at: Time.current)
           
    render json: { success: true }
  end

  def mark_as_read
    notification = current_tenant.notifications.find(params[:id])
    notification.update(read_at: Time.current)
    render json: { success: true }
  end

  def destroy
    notification = current_tenant.notifications.find(params[:id])
    notification.destroy
    render json: { success: true }
  end
end
