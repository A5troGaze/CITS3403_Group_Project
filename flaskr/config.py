from flask import Flask, render_template, request, make_response, session
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_cors import CORS
from flask_restful import Api, Resource
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import os
from dotenv import load_dotenv
from db import db, bcrypt, User

load_dotenv()
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.json.compact = False
app.secret_key = os.getenv('FLASK_SECRET_KEY')

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

try:
    os.makedirs(app.instance_path)
except OSError:
    pass

db.init_app(app)
migrate = Migrate(app, db)
bcrypt = Bcrypt(app)
api = Api(app)
bcrypt.init_app(app)

@app.context_processor
def inject_user():
    if session.get('user_id'):
        user = User.query.get(session.get('user_id'))
        return dict(current_user=user)
    
    return dict(current_user=None)