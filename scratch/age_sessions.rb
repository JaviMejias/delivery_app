User.where.not(remember_created_at: nil).update_all("remember_created_at = remember_created_at - interval '25 hours'")
Customer.where.not(remember_created_at: nil).update_all("remember_created_at = remember_created_at - interval '25 hours'")
puts "Las sesiones se han 'envejecido' 25 horas artificialmente en la base de datos."
