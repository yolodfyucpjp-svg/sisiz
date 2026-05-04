import pandas as pd

data = {
    'item_name': ['Natural Gas', 'Electricity', 'Diesel Fuel', 'Logistics Road',
                  'Waste Disposal', 'Steel Raw Materials', 'Business Flights',
                  'Gasoline', 'Coal', 'Electricity MWH'],
    'amount': [5000, 25000, 1000, 30000, 2000, 5000, 8000, 1500, 800, 10],
    'unit': ['m³', 'kWh', 'liter', 'ton-km', 'kg', 'kg', 'passenger-km',
             'liter', 'kg', 'MWh'],
    'cost': [2000, 1500, 700, 2500, 300, 4000, 1200, 1000, 600, 800]
}
df = pd.DataFrame(data)
df.to_excel('test_data.xlsx', index=False)
print('✅ Файл test_data.xlsx создан в текущей папке (backend)')