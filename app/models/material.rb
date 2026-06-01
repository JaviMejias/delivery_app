class Material < ApplicationRecord
  acts_as_tenant :company
  belongs_to :material_category
  has_many :products, dependent: :restrict_with_error
  has_many :inventories, as: :item, dependent: :restrict_with_error
  
  validates :name, presence: true, uniqueness: { scope: [:company_id, :measure, :unit] }

  scope :search_by_name, ->(query) { where('name ILIKE ?', "%#{query}%") if query.present? }

  def full_name
    [name, "#{measure}#{unit}".presence].compact.join(' ')
  end
end
