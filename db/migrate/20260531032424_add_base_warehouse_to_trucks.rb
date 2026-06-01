class AddBaseWarehouseToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_reference :trucks, :base_warehouse, null: true, foreign_key: { to_table: :warehouses }
  end
end
