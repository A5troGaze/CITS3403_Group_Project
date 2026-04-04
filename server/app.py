import os
from flask import Flask
from models import db, User 

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///user_database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

try:
    os.makedirs(app.instance_path)
except OSError:
    pass

db.init_app(app)

with app.app_context():
    db.create_all()

@app.route('/api/test')
def test_route():
    return {"message": "Server and DB are connected!"}, 200

if __name__ == '__main__':
    app.run(debug=True)