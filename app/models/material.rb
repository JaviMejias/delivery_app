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
    formatted_measure = if measure.present?
      measure == measure.to_i ? measure.to_i.to_s : measure.to_s.sub(/\.?0+\z/, "")
    end
    formatted_unit = unit if unit.present? && unit != "UN"

    [ name, formatted_measure, formatted_unit ].compact.join(" ")
  end
end
