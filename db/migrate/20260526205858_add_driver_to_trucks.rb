class AddDriverToTrucks < ActiveRecord::Migration[8.1]
  def change
    add_reference :trucks, :driver, null: true, foreign_key: true
  end
end
