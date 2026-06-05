class CustomerOrder < ApplicationRecord
  belongs_to :company
  belongs_to :truck, optional: true

  enum :status, { pending: 0, accepted: 1, in_transit: 2, completed: 3, cancelled: 4, nearby: 5, arrived: 6 }, default: :pending

  validates :client_name, :phone, :address, :latitude, :longitude, presence: true
  validates :order_token, presence: true, uniqueness: true
  validate :details_not_empty

  before_validation :generate_order_token, on: :create

  after_create_commit :broadcast_new_order
  after_update_commit :broadcast_tracking_status_change, if: -> { saved_change_to_status? }

  scope :active, -> { where.not(status: [ :completed, :cancelled ]) }
  scope :pending_for_company, ->(company_id) { where(company_id: company_id, status: :pending) }
  scope :active_for_truck, ->(truck) { where(truck: truck, status: [ :accepted, :in_transit, :nearby, :arrived ]) }

  scope :search_by_query, ->(query) {
    if query.present?
      where("client_name ILIKE :q OR address ILIKE :q OR order_token ILIKE :q", q: "%#{query}%")
    end
  }

  scope :filter_by_status, ->(status_val) {
    where(status: status_val) if status_val.present? && status_val != "all"
  }

  scope :filter_by_date, ->(start_date, end_date) {
    where(created_at: start_date.beginning_of_day..end_date.end_of_day) if start_date.present? && end_date.present?
  }

  def details_not_empty
    if details.blank? || (details["items"].blank? && details["quick_order"].blank?)
      errors.add(:details, "El pedido no puede estar vacío")
    end
  end

  def total_cylinders
    return 0 unless details["items"].present?
    details["items"].sum { |item| item["quantity"].to_i }
  end

  def summary_text
    if details["quick_order"].present?
      details["quick_order"]
    elsif details["items"].present?
      details["items"].map { |i| "#{i['quantity']}x #{i['name']}" }.join(", ")
    else
      "Pedido sin detalles"
    end
  end

  private

  def generate_order_token
    self.order_token = SecureRandom.urlsafe_base64(16)
  end

  def broadcast_new_order
    ActionCable.server.broadcast("orders_#{company_id}", {
      action: "new_order",
      order: {
        id: id,
        client_name: client_name,
        address: address
      }
    })
  end

  def broadcast_tracking_status_change
    truck_data = nil
    if truck.present?
      truck_data = {
        latitude: truck.latitude.to_f,
        longitude: truck.longitude.to_f,
        plate_number: truck.plate_number,
        driver_name: truck.driver&.full_name || "Sin Chofer",
        route_points: truck.route_points ? JSON.parse(truck.route_points) : nil,
        departure_time: truck.departure_time&.iso8601
      }
    end

    ActionCable.server.broadcast("tracking_#{order_token}", {
      action: "status_changed",
      status: status,
      truck: truck_data,
      notes: notes
    })
  end
end
