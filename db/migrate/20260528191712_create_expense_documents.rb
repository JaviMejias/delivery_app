class CreateExpenseDocuments < ActiveRecord::Migration[8.1]
  def change
    create_table :expense_documents do |t|
      t.references :treasury_expense, null: false, foreign_key: true
      t.references :purchase_document, null: false, foreign_key: true
      t.decimal :amount_applied, precision: 12, scale: 2, default: "0.0"

      t.timestamps
    end
  end
end
