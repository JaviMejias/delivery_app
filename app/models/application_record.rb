class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  scope :active, -> { where(active: true) }
  scope :ordered_by_name, -> { order(:name) }
  scope :recent, -> { order(created_at: :desc) }
end
