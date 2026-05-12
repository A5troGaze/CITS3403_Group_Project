import os

# === BASE CONFIG ===
class Config:
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')

# === ENVIRONMENT-SPECIFIC CONFIGS ===
class DeploymentConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///user_database.db'

class TestingConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    TESTING = True
    SECRET_KEY = 'test-secret-key-not-for-production'  # tests need a stable key for session signing