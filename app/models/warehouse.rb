class Warehouse < ApplicationRecord
  acts_as_tenant :company
  has_many :inventories, dependent: :destroy
  has_many :stock_movements
  has_one :truck
  has_many :local_sales, dependent: :restrict_with_error
  has_many :local_closures, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: :company_id }
  validates :latitude, numericality: true, allow_nil: true
  validates :longitude, numericality: true, allow_nil: true

  enum :card_surcharge_type, { fixed: 0, percentage: 1 }, prefix: true

  scope :active_warehouses, -> { where(active: true) }
  scope :stationary, -> { 
    where.not(id: Truck.select(:warehouse_id))
         .where("name NOT ILIKE ?", "Camión%")
         .where("name NOT ILIKE ?", "Móvil%") 
  }
  scope :search_by_name, ->(query) { where('name ILIKE ?', "%#{query}%") if query.present? }
end
