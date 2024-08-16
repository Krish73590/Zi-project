from sqlalchemy import create_engine

DATABASE_URL = "postgresql+psycopg2://postgres:password@192.168.3.243:5432/dbname"

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("Connection successful")
    connection.close()
except Exception as e:
    print(f"Error: {e}")
