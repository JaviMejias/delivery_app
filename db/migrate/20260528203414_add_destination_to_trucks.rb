class AddDestinationToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_column :trucks, :destination_latitude, :decimal, precision: 10, scale: 6
    add_column :trucks, :destination_longitude, :decimal, precision: 10, scale: 6
    add_column :trucks, :destination_client_name, :string
    add_column :trucks, :destination_address, :string
  end
end
