"""
NOTE: you need to make migrations every time you make a change to database models
(e.g. modify columns, add new models etc.)

HOW TO MAKE MIGRATIONS USING FLASK MIGRATE:

Make sure you are in the virtual environment
HOW TO GET INTO VIRTUAL ENVIRONMENT (VENV): check the README file
.venv should be in flaskr directory 


IN TERMINAL:
export FLASK_APP=app.py
flask db migrate -m "[message describing the migration a.k.a. the change you made to the database models]"
flask db upgrade


HOW TO VERIFY MIGRATION WORKED:

IN TERMINAL:
flask db current
"""




from flask_sqlalchemy import SQLAlchemy
import datetime

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)

    # password = db.Column(db.String(120), nullable=False)
    # temporarily unsure about password storage, will implement when lectures mention plugins

    volume_time = db.Column(db.Float, nullable=True, default=None)
    brightness_time = db.Column(db.Float, nullable=True, default=None)
    maze_time = db.Column(db.Float, nullable=True, default=None)
    tnc_quiz_time = db.Column(db.Float, nullable=True, default=None)

    # popups_time = db.Column(db.Float, nullable=True, default=None)
    # not sure how we're going to implement popups, so leaving it out for now