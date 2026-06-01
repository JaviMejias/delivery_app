class AddDetailsToCompanies < ActiveRecord::Migration[8.1]
  def change
    add_column :companies, :address, :string
    add_column :companies, :email, :string
    add_column :companies, :phone, :string
    add_column :companies, :business_activity, :string
    add_column :companies, :website, :string
    add_column :companies, :legal_representative, :string
  end
end
