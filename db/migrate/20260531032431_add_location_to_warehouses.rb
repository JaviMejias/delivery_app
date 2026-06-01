class AddLocationToWarehouses < ActiveRecord::Migration[8.1]
  def change
    add_column :warehouses, :address, :string
    add_column :warehouses, :latitude, :decimal, precision: 10, scale: 6
    add_column :warehouses, :longitude, :decimal, precision: 10, scale: 6
  end
end
