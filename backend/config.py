import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    DB_NAME = os.getenv('DB_NAME', 'event_management.db')
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY')
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    ADMIN_SECRET = os.getenv('ADMIN_SECRET')