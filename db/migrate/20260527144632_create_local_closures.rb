class CreateLocalClosures < ActiveRecord::Migration[8.1]
  def change
    create_table :local_closures do |t|
      t.references :company, null: false, foreign_key: true
      t.references :warehouse, null: false, foreign_key: true
      t.date :date
      t.integer :status
      t.decimal :system_cash, default: "0.0"
      t.decimal :system_card, default: "0.0"
      t.decimal :system_transfer, default: "0.0"
      t.decimal :system_total, default: "0.0"
      t.decimal :declared_cash, default: "0.0"
      t.decimal :declared_card, default: "0.0"
      t.decimal :declared_transfer, default: "0.0"
      t.decimal :declared_total, default: "0.0"
      t.text :observations

      t.timestamps
    end
  end
end
