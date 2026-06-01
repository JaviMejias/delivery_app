class CreateMaterials < ActiveRecord::Migration[8.1]
  def change
    create_table :materials do |t|
      t.references :material_category, null: false, foreign_key: true
      t.string :name, null: false
      t.text :description
      t.boolean :returnable, null: false, default: true
      t.string :unit, null: false, default: "unit"

      t.timestamps
    end
  end
end
