class TrackingChannel < ApplicationCable::Channel
  def subscribed
    # Public tracking channel. Clients provide the token when connecting.
    stream_from "tracking_#{params[:token]}"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end
end
