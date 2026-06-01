class CreateLocalSales < ActiveRecord::Migration[8.1]
  def change
    create_table :local_sales do |t|
      t.references :company, null: false, foreign_key: true
      t.references :warehouse, null: false, foreign_key: true
      t.date :date
      t.integer :status
      t.integer :sale_type
      t.decimal :total_revenue, default: 0.0
      t.decimal :cash_revenue, default: 0.0
      t.decimal :card_revenue, default: 0.0
      t.decimal :transfer_revenue, default: 0.0

      t.timestamps
    end
  end
end
