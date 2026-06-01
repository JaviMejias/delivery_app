class AddEnablePublicOrdersToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :enable_public_orders, :boolean, default: false, null: false
  end
end
