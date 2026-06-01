class RemoveDriverNameFromTrucks < ActiveRecord::Migration[8.1]
  def change
    remove_column :trucks, :driver_name, :string
  end
end
