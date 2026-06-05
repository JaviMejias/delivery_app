class LocalSale < ApplicationRecord
  acts_as_tenant :company
  belongs_to :company
  belongs_to :warehouse
  has_many :local_sale_items, dependent: :destroy

  enum :status, { completed: 0, voided: 1 }
  enum :sale_type, { warehouse: 0, wholesale: 1 }

  validates :date, presence: true
  validates :total_revenue, numericality: { greater_than_or_equal_to: 0 }

  before_validation :set_date, on: :create

  private

  def set_date
    self.date ||= Date.current
  end

  scope :completed, -> { where(status: :completed) }
  scope :in_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :search_by_query, ->(q) { joins(:warehouse).where("local_sales.id::text ILIKE :q OR ('VTA-' || LPAD(local_sales.id::text, 4, '0')) ILIKE :q OR warehouses.name ILIKE :q", q: "%#{q}%") if q.present? }
  scope :with_details, -> { includes(:warehouse, local_sale_items: { product: [ :material, :brand ] }) }
end
