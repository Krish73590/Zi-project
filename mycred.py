import os
from dotenv import load_dotenv
load_dotenv()
import urllib.parse

dbname=os.getenv('DB_NAME')
user=os.getenv('DB_USER')
password=os.getenv('DB_PASSWORD')
password = urllib.parse.quote_plus(password)
host=os.getenv('DB_HOST')
port=os.getenv('DB_PORT')
