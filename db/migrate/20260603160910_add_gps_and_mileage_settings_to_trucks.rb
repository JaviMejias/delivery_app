class AddGpsAndMileageSettingsToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_column :trucks, :has_gps, :boolean, default: false
    add_column :trucks, :mileage_update_frequency, :integer, default: 0
  end
end
