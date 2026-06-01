class Product < ApplicationRecord
  acts_as_tenant :company
  belongs_to :material
  belongs_to :brand

  has_one_attached :image

  has_many :product_prices, dependent: :destroy

  validates :name, presence: true
  validates :sku, uniqueness: { scope: :company_id }, allow_blank: true

  scope :search_by_name_or_sku, ->(query) { where('name ILIKE :q OR sku ILIKE :q', q: "%#{query}%") if query.present? }
  scope :with_details, -> { includes(:material, :brand, :product_prices) }
end
