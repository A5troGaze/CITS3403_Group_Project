"""
NOTE: you need to make migrations every time you make a change to database models
(e.g. modify columns, add new models etc.)

Migrations are for saving any changes you may have made to the database, to ensure the rest of the code can work with the database without any issues. 
If you don't make migrations, you may encounter errors when you try to run the app, because the database schema won't match the models defined in the code.
If any migrations are faulty, delete the migration file in the migrations/versions directory, and then make a new migration with the correct changes.
If you aren't sure which file to delete, you can delete the entire migrations folder and then run the following commands again.

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
    banner_image = db.Column(db.String, nullable=False, server_default='default_banner.png')
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
    
    serialize_rules = ('-password_hash', '-_password_hash', '-scores.user')

    scores = db.relationship('Score', backref='user', cascade="all, delete-orphan")

    @property
    def total_time(self):
        secret_times = [float(score.best_time) for score in self.scores if score.task_name == 'secret_ending']
        
        if secret_times:
            return min(secret_times) 
            
        REQUIRED_TASKS = 1  # change this value depending on how many games we have
        
        best_task_times = {}
        for score in self.scores:
            time = float(score.best_time)
            task = score.task_name
            
            if task not in best_task_times or time < best_task_times[task]:
                best_task_times[task] = time
        if len(best_task_times) < REQUIRED_TASKS:
            return 0.0
            
        total = sum(best_task_times.values())
        return round(total, 2)

class Score(db.Model, SerializerMixin):
    __tablename__ = 'score'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    task_name = db.Column(db.String(50), nullable=False) 
    best_time = db.Column(db.Float, nullable=False)