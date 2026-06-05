class Brand < ApplicationRecord
  acts_as_tenant :company

  has_one_attached :logo
  has_many :products, dependent: :restrict_with_error

  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") if query.present? }
end
