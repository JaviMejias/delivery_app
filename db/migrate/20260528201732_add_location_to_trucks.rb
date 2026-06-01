class AddLocationToTrucks < ActiveRecord::Migration[7.1]
  def change
    add_column :trucks, :latitude, :decimal, precision: 10, scale: 6
    add_column :trucks, :longitude, :decimal, precision: 10, scale: 6
    add_column :trucks, :gps_last_updated_at, :datetime
    add_column :trucks, :gps_device_token, :string
    
    add_index :trucks, :gps_device_token, unique: true
  end
end
