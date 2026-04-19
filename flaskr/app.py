import os
from flask import Flask, render_template
from db import db, User 
from flask_migrate import Migrate

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    os.makedirs(app.instance_path)
except OSError:
    pass

db.init_app(app)
migrate = Migrate(app, db)

@app.route('/')
def home():
    return render_template('landing.html')

@app.route('/sign_in')
def signin():
    return render_template('sign_in.html')

@app.route('/profile')
def profile():
    return render_template('profile.html')

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/comments')
def comments():
    return render_template('comments.html')

@app.route('/faq')
def faq():
    return render_template('FAQ.html')

@app.route('/api/test')
def test_route():
    return {"message": "Server and DB are connected!"}, 200

if __name__ == '__main__':
    app.run(debug=True)