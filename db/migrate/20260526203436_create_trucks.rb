class CreateTrucks < ActiveRecord::Migration[8.1]
  def change
    create_table :trucks do |t|
      t.string :plate_number
      t.string :driver_name
      t.boolean :active
      t.references :warehouse, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true

      t.timestamps
    end
  end
end
