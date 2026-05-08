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

load_dotenv() #to z__init__.py
app = Flask(__name__) #to z__init__.py

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user_database.db' #to zconfig.py
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False #to zconfig.py
app.json.compact = False #to z__init__.py
app.secret_key = os.getenv('FLASK_SECRET_KEY') #to zconfig.py

login_manager = LoginManager() #to z__init__.py
login_manager.init_app(app) #to z__init__.py
login_manager.login_view = 'login' #to z__init__.py

@login_manager.user_loader #to z__init__.py
def load_user(user_id):
    return User.query.get(int(user_id))

try: #to z__init__.py
    os.makedirs(app.instance_path)
except OSError:
    pass

db.init_app(app) #to z__init__.py
migrate = Migrate(app, db) #to z__init__.py
bcrypt = Bcrypt(app) #to z__init__.py
api = Api(app) #to z__init__.py
bcrypt.init_app(app) #to z__init__.py

@app.context_processor #to z__init__.py
def inject_user():
    if session.get('user_id'):
        user = User.query.get(session.get('user_id'))
        return dict(current_user=user)
    
    return dict(current_user=None)
