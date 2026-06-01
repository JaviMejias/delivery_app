class AddDepartureTimeToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_column :trucks, :departure_time, :datetime
  end
end
