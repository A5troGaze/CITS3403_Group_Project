'''from flask import Flask, render_template, request, make_response, session
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_restful import Api, Resource
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
#from dotenv import load_dotenv
#from db import db, bcrypt, User'''

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