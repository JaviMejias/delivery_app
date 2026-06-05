class Truck < ApplicationRecord
  acts_as_tenant :company
  belongs_to :company
  belongs_to :warehouse
  belongs_to :driver, class_name: "User", optional: true
  belongs_to :base_warehouse, class_name: "Warehouse", optional: true
  has_many :route_settlements, dependent: :restrict_with_error
  has_many :customer_orders, dependent: :nullify

  enum :mileage_update_frequency, { weekly: 0, daily: 1 }, prefix: true

  validates :plate_number, presence: true, uniqueness: { scope: :company_id }
  validates :driver_id, uniqueness: { scope: :company_id, allow_nil: true, message: "ya está asignado a otro camión" }
  validates :gps_device_token, uniqueness: { allow_nil: true }
  validate :current_km_cannot_decrease

  before_validation :build_associated_warehouse, on: :create
  before_create :generate_gps_device_token
  after_update :sync_warehouse_name
  after_update_commit :broadcast_tracking_location, if: -> { saved_change_to_latitude? || saved_change_to_longitude? }

  scope :assigned_warehouses_ids, -> { where.not(warehouse_id: nil).select(:warehouse_id) }
  scope :active, -> { where(active: true) }
  scope :active_with_driver, -> { includes(:warehouse, :driver).active.where.not(warehouse_id: nil).order(:plate_number) }
  scope :search_by_query, ->(query) { 
    return all if query.blank?
    clean_q = query.to_s.gsub(/[^A-Za-z0-9]/, '').upcase
    left_joins(:driver).where(
      "REPLACE(UPPER(trucks.plate_number), '-', '') LIKE :clean_q OR " \
      "REPLACE(REPLACE(UPPER(users.rut), '.', ''), '-', '') LIKE :clean_q OR " \
      "users.first_name ILIKE :raw_q OR " \
      "users.last_name ILIKE :raw_q",
      clean_q: "%#{clean_q}%", raw_q: "%#{query}%"
    )
  }

  def gps_active?
    gps_last_updated_at.present? && gps_last_updated_at >= 15.minutes.ago
  end

  def broadcast_tracking_location
    customer_orders.where(status: [ :accepted, :in_transit ]).find_each do |order|
      ActionCable.server.broadcast("tracking_#{order.order_token}", {
        action: "truck_moved",
        latitude: latitude.to_f,
        longitude: longitude.to_f
      })
    end
  end

  private

  def current_km_cannot_decrease
    if current_km_changed? && current_km.to_i < current_km_was.to_i
      errors.add(:current_km, "no puede ser menor al registrado anteriormente")
    end
  end

  def build_associated_warehouse
    return if self.warehouse_id.present? || self.plate_number.blank?

    existing = Warehouse.find_by(company_id: self.company_id, name: display_name)
    if existing
      self.warehouse = existing
    else
      self.build_warehouse(
        company_id: self.company_id,
        name: display_name,
        active: true
      )
    end
  end

  def sync_warehouse_name
    return unless warehouse
    if saved_change_to_plate_number? || saved_change_to_driver_id?
      warehouse.update_column(:name, display_name)
    end
  end

  def display_name
    driver_part = driver ? driver.full_name : "Sin Chofer"
    "Camión #{plate_number} (#{driver_part})"
  end

  def generate_gps_device_token
    self.gps_device_token = SecureRandom.hex(16) if self.gps_device_token.blank?
  end
end
