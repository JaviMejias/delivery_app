class CreateInventories < ActiveRecord::Migration[8.1]
  def change
    create_table :inventories do |t|
      t.references :company, null: false, foreign_key: true
      t.references :warehouse, null: false, foreign_key: true
      t.references :item, polymorphic: true, null: false
      t.integer :quantity

      t.timestamps
    end
  end
end
