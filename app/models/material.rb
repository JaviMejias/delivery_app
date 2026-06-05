class Material < ApplicationRecord
  acts_as_tenant :company
  belongs_to :material_category
  has_many :products, dependent: :restrict_with_error
  has_many :inventories, as: :item, dependent: :restrict_with_error

  validates :name, presence: true, uniqueness: { scope: [ :company_id, :measure, :unit ] }

  scope :search_by_name, ->(query) do
    return all if query.blank?
    where(
      "name ILIKE :q OR " \
      "CAST(measure AS TEXT) ILIKE :q OR " \
      "CONCAT(name, ' ', REPLACE(CAST(measure AS TEXT), '.0', ''), ' ', unit) ILIKE :q",
      q: "%#{query}%"
    )
  end

  scope :ordered_by_name, -> { order(:name, :measure) }

  def full_name
    [ name, "#{measure}#{unit}".presence ].compact.join(" ")
  end
end
