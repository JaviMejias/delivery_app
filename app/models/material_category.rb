class MaterialCategory < ApplicationRecord
  acts_as_tenant :company
  has_many :materials, dependent: :restrict_with_error
  validates :name, presence: true, uniqueness: { scope: :company_id }

  scope :search_by_name, ->(query) { where('name ILIKE ?', "%#{query}%") if query.present? }
end
