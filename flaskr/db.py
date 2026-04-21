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



from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.ext.hybrid import hybrid_property
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
import datetime

db = SQLAlchemy()
bcrypt = Bcrypt()

class User(db.Model, SerializerMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    profile_image = db.Column(db.String, nullable=False, server_default='icon_head.jpg')
    name = db.Column(db.String, nullable=False)
    username = db.Column(db.String(80), unique=True, nullable=False)
    _password_hash = db.Column(db.String)

    @hybrid_property
    def password_hash(self):
        raise Exception("Password hashes may not be viewed.")
    
    @password_hash.setter
    def password_hash(self, password):
        password_hash = bcrypt.generate_password_hash(
            password.encode('utf-8')
        )
        self._password_hash = password_hash.decode('utf-8')
    
    def authenticate(self, password):
        return bcrypt.check_password_hash(
            self._password_hash, password.encode('utf-8')
        )
    
    serialize_rules = ('-password_hash',)

    volume_time = db.Column(db.Float, nullable=True, default=None)
    brightness_time = db.Column(db.Float, nullable=True, default=None)
    maze_time = db.Column(db.Float, nullable=True, default=None)
    tnc_quiz_time = db.Column(db.Float, nullable=True, default=None)

    # popups_time = db.Column(db.Float, nullable=True, default=None)
    # not sure how we're going to implement popups, so leaving it out for now