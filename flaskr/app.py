# all imports
from flask import request, make_response, session, render_template, redirect, url_for
from flask_restful import Resource
from flask_migrate import Migrate
from db import db, User
from config import *
import os
from werkzeug.utils import secure_filename


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
            session['username'] = user.username

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
                session['username'] = user.username
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
        session['username'] = None
        return {}, 204
    
api.add_resource(Logout, '/logout', endpoint='logout')



# app routing
@app.route('/')
def home():
    return render_template('landing.html')

@app.route('/sign_in')
def signin_page():
    if session.get('user_id'):
        return redirect(url_for('home'))
    return render_template('sign_in.html')

@app.route('/sign_up')
def signup_page():
    if session.get('user_id'):
        return redirect(url_for('home'))
    return render_template('sign_up.html')

@app.route('/profile')
def profile():
    if not session.get('user_id'):
        return redirect(url_for('signin_page'))
    current_user = User.query.get(session.get('user_id'))
    return render_template('profile.html', user=current_user)

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

@app.route('/upload_photo', methods=['POST'])
def upload_photo():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('signin_page'))

    if 'profile_pic' not in request.files:
        return redirect(url_for('profile'))
        
    file = request.files['profile_pic']

    if file.filename != '':
        filename = secure_filename(file.filename)
        unique_filename = f"user_{user_id}_{filename}"
        save_path = os.path.join(app.root_path, 'static', 'images', unique_filename)
        file.save(save_path)

        user = User.query.get(user_id)
        user.profile_image = unique_filename
        db.session.commit()
    return redirect(url_for('profile'))

if __name__ == '__main__':
    app.run(debug=True)