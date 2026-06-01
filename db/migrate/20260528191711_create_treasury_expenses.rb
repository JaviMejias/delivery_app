class CreateTreasuryExpenses < ActiveRecord::Migration[8.1]
  def change
    create_table :treasury_expenses do |t|
      t.references :company, null: false, foreign_key: true
      t.date :date
      t.decimal :amount, precision: 12, scale: 2, default: "0.0"
      t.string :payment_method
      t.string :reference_number
      t.text :notes

      t.timestamps
    end
  end
end
