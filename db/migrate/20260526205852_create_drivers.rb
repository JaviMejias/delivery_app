class CreateDrivers < ActiveRecord::Migration[8.1]
  def change
    create_table :drivers do |t|
      t.string :name
      t.string :rut
      t.string :phone
      t.string :license_type
      t.date :license_expiration
      t.integer :status
      t.references :company, null: false, foreign_key: true

      t.timestamps
    end
  end
end
