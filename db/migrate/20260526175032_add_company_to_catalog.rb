class AddCompanyToCatalog < ActiveRecord::Migration[8.1]
  def change
    add_reference :material_categories, :company, foreign_key: true
    add_reference :materials, :company, foreign_key: true
    add_reference :brands, :company, foreign_key: true
    add_reference :suppliers, :company, foreign_key: true
    add_reference :products, :company, foreign_key: true
    add_reference :product_prices, :company, foreign_key: true
  end
end
