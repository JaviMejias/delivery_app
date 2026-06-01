class AddWarehouseToCompanyMemberships < ActiveRecord::Migration[8.1]
  def change
    add_reference :company_memberships, :warehouse, null: true, foreign_key: true
  end
end
