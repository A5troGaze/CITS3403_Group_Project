# all imports
from flask import request, make_response, session, render_template, redirect, url_for, flash
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



# app page routing
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
    current_user = db.session.get(User, session.get('user_id'))
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

@app.route('/popups')
def popups():
    return render_template('pop_ups.html')

@app.route('/secret')
def secret():
    return render_template('secret_task.html')


# routing for profile page functionality
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

        user = db.session.get(User, user_id)
        user.profile_image = unique_filename
        db.session.commit()
    return redirect(url_for('profile'))

@app.route('/upload_banner', methods=['POST'])
def upload_banner():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('signin_page'))

    if 'banner_pic' not in request.files:
        return redirect(url_for('profile'))
        
    file = request.files['banner_pic']

    if file.filename != '':
        filename = secure_filename(file.filename)
        unique_filename = f"user_{user_id}_{filename}"
        save_path = os.path.join(app.root_path, 'static', 'images', unique_filename)
        file.save(save_path)

        user = db.session.get(User, user_id)
        user.banner_image = unique_filename
        db.session.commit()
    return redirect(url_for('profile'))

@app.route('/update_username', methods=['POST'])
def update_username():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('signin_page'))

    new_username = request.form.get('username')
    
    user = db.session.get(User, user_id)

    if new_username and new_username != user.username:
        try:
            user.username = new_username
            db.session.commit()
            session['username'] = new_username
            flash("Username successfully updated! I hope you enjoying trolling other people.", "success")
            
        except Exception as e:
            db.session.rollback()
            flash("Error: Don't steal other people's usernames! Try another one.", "danger")

    return redirect(url_for('profile'))

@app.route('/update_name', methods=['POST'])
def update_name():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('signin_page'))

    new_name = request.form.get('name')
    
    user = db.session.get(User, user_id)

    if new_name and new_name != user.name:
        try:
            user.name = new_name
            db.session.commit()
            session['name'] = new_name
            flash("Name successfully updated! Have fun with your new name, I guess. I'll just let the government know.", "success")
            
        except Exception as e:
            db.session.rollback()
            flash("Error: Could not update your name in the database, maybe it's just a bad name.", "danger")

    return redirect(url_for('profile'))

@app.route('/update_password', methods=['POST'])
def update_password():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('signin_page'))

    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    user = db.session.get(User, user_id)

    if not user.authenticate(current_password):
        flash("Error: Incorrect current password. Do you even know your own password?", "danger")
        return redirect(url_for('profile'))

    if new_password != confirm_password:
        flash("Error: New passwords do not match. Don't be silly, do it properly.", "danger")
        return redirect(url_for('profile'))

    try:
        user.password_hash = new_password 
        db.session.commit()
        flash("Success: Password updated successfully! I'll always know all your passwords anyways, no matter how often you change it.", "success")
        
    except Exception as e:
        db.session.rollback()
        flash("Error: Could not update password.", "danger")

    return redirect(url_for('profile'))

@app.route('/delete_account', methods=['POST'])
def delete_account():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('signin_page'))

    user = db.session.get(User, user_id)

    if user:
        try:
            db.session.delete(user)
            db.session.commit()
            session.clear() 
            
            return redirect(url_for('boom'))
            
        except Exception as e:
            db.session.rollback()
            flash("Error: You can't escape us that easily. Something went wrong.", "danger")
            print("Deletion Error:", e)
            return redirect(url_for('profile'))

    return redirect(url_for('signin_page'))

@app.route('/boom')
def boom():
    return render_template('boom.html')


# routing for leaderboard/timing functionality
@app.route('/save_time', methods=['POST'])
def save_time():
    user_id = session.get('user_id')
    if not user_id:
        return {"success": False, "error": "Unauthorized"}, 401

    data = request.get_json()
    new_time = float(data.get('time'))

    user = db.session.get(User, user_id)

    if user:
        try:
            if user.best_time is None or new_time < user.best_time:
                user.best_time = new_time
                db.session.commit()
                return {"success": True, "message": "New personal best saved!"}, 200
            else:
                return {"success": True, "message": "Time recorded, but not a new record."}, 200
                
        except Exception as e:
            db.session.rollback()
            return {"success": False, "error": str(e)}, 500

    return {"success": False, "error": "User not found"}, 404


if __name__ == '__main__':
    app.run(debug=True)