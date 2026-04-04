from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
import datetime

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    os.makedirs(app.instance_path)
except OSError:
    pass