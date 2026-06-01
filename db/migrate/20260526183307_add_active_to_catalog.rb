class AddActiveToCatalog < ActiveRecord::Migration[8.1]
  def change
    add_column :material_categories, :active, :boolean, default: true, null: false
    add_column :materials, :active, :boolean, default: true, null: false
    add_column :brands, :active, :boolean, default: true, null: false
    add_column :suppliers, :active, :boolean, default: true, null: false
  end
end
