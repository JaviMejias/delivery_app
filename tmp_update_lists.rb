truck = PriceList.find_by(code: 'truck')
truck.update!(available_for_trucks: true) if truck

local = PriceList.find_by(code: 'local')
local.update!(available_for_local: true) if local

wholesale = PriceList.find_by(code: 'wholesale')
wholesale.update!(available_for_trucks: true, available_for_local: true) if wholesale

puts "Price lists updated successfully!"
