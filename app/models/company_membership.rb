class CompanyMembership < ApplicationRecord
  belongs_to :user
  belongs_to :company
  belongs_to :warehouse, optional: true
end
