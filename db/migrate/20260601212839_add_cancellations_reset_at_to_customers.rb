class AddCancellationsResetAtToCustomers < ActiveRecord::Migration[8.1]
  def change
    add_column :customers, :cancellations_reset_at, :datetime
  end
end
