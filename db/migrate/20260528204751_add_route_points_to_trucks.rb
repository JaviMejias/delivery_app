class AddRoutePointsToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_column :trucks, :route_points, :text
    add_column :trucks, :route_current_index, :integer, default: 0
  end
end
