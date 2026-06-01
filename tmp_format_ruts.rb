require_relative 'config/environment'

puts "Formateando RUTs..."

[Company, Supplier, Driver].each do |klass|
  puts "Procesando #{klass.name}..."
  klass.find_each do |record|
    next if record.rut.blank?
    record.valid? # trigger before_validation
    record.update_column(:rut, record.rut)
  end
end

puts "¡Listo!"
