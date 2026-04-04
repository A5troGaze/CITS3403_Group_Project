from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    username = db.Column(db.String(80), unique=True, nullable=False, primary_key=True)

    # password = db.Column(db.String(120), nullable=False)
    # temporarily unsure about password storage, will implement when lectures mention plugins

    volume_time = db.Column(db.Float, nullable=True, default=None)
    brightness_time = db.Column(db.Float, nullable=True, default=None)
    maze_time = db.Column(db.Float, nullable=True, default=None)
    tnc_quiz_time = db.Column(db.Float, nullable=True, default=None)

    # popups_time = db.Column(db.Float, nullable=True, default=None)
    # not sure how we're going to implement popups, so leaving it out for now