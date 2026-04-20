# all imports
from flask import request, make_response, session, render_template
from flask_restful import Resource
from flask_migrate import Migrate
from db import db, User
from config import *


# sign in logic
class CheckSession(Resource):
    def get(self):
        user = User.query.filter(User.id == session.get('user_id')).first()
        if not user:
            return make_response({'error': "Unauthorized: you must be logged in to make that request"}, 401)
        else:
            return make_response(user.to_dict(), 200)

api.add_resource(CheckSession, '/check_session', endpoint='check_session')

class Signup(Resource):
    def post(self):
        json = request.get_json()
        try:
            user = User(
                username=json['username'],
                name=json['name'],
            )
            user.password_hash = json['password']
            db.session.add(user)
            db.session.commit()
            session['user_id'] = user.id

            return make_response(user.to_dict(), 201)

        except Exception as e:
            return make_response({'errors': str(e)}, 422)

api.add_resource(Signup, '/signup', endpoint='signup')

class Login(Resource):
    def post(self):
        username = request.get_json()['username']

        user = User.query.filter(User.username == username).first()
        password = request.get_json()['password']

        if not user:
            response_body = {'error': 'User not found'}
            status = 404
        else:
            if user.authenticate(password):
                session['user_id'] = user.id
                response_body = user.to_dict()
                status = 200
            else:
                response_body = {'error': 'Invalid username or password'}
                status = 401
        return make_response(response_body, status)

api.add_resource(Login, '/login', endpoint='login')

class Logout(Resource):
    
    def delete(self):
        session['user_id'] = None
        return {}, 204
    
api.add_resource(Logout, '/logout', endpoint='logout')


# app routing
@app.route('/')
def home():
    return render_template('landing.html')

@app.route('/sign_in')
def signin_page():
    return render_template('sign_in.html')

@app.route('/sign_up')
def signup_page():
    return render_template('sign_up.html')

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