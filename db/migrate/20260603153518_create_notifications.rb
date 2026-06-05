class CreateNotifications < ActiveRecord::Migration[8.1]
  def change
    create_table :notifications do |t|
      t.string :title
      t.text :message
      t.string :notification_type
      t.datetime :read_at
      t.string :action_url
      t.references :company, null: false, foreign_key: true
      t.references :user, null: true, foreign_key: true

      t.timestamps
    end
  end
end
