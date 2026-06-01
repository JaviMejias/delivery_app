class AddNearbyArrivedToCustomerOrders < ActiveRecord::Migration[8.1]
  def up
    # The status column is an integer enum. We just need to ensure values 5 and 6 are usable.
    # Rails enum will map: nearby: 5, arrived: 6
    # No schema change needed since integer column already handles any value.
    # We just add a check constraint comment for documentation purposes.
    execute "COMMENT ON COLUMN customer_orders.status IS '0=pending,1=accepted,2=in_transit,3=completed,4=cancelled,5=nearby,6=arrived'"
  end

  def down
    execute "COMMENT ON COLUMN customer_orders.status IS '0=pending,1=accepted,2=in_transit,3=completed,4=cancelled'"
  end
end
