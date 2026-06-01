class CreateCompanyPhones < ActiveRecord::Migration[8.1]
  def change
    create_table :company_phones do |t|
      t.references :company, null: false, foreign_key: true
      t.string :number
      t.string :label

      t.timestamps
    end
  end
end
