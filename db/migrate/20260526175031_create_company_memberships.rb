class CreateCompanyMemberships < ActiveRecord::Migration[8.1]
  def change
    create_table :company_memberships do |t|
      t.references :user, null: false, foreign_key: true
      t.references :company, null: false, foreign_key: true
      t.string :role, null: false, default: "warehouse_keeper"

      t.timestamps
    end
  end
end
