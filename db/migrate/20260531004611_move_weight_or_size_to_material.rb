class MoveWeightOrSizeToMaterial < ActiveRecord::Migration[8.1]
  def change
    add_column :materials, :measure, :decimal
    remove_column :products, :weight_or_size, :decimal
  end
end
