from django.db import connection

print("Database:", connection.settings_dict['NAME'])
print("Host:", connection.settings_dict['HOST'])

cursor = connection.cursor()
cursor.execute('SELECT current_database()')
print("Current DB:", cursor.fetchone()[0])

cursor.execute('SELECT version()')
print("Version:", cursor.fetchone()[0][:80] + "...")

print("✅ Neon connection successful!")
