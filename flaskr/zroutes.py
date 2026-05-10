# ====== IMPORTS ======
from flask import current_app, request, make_response, session, render_template, redirect, url_for, flash, jsonify
from flask_restful import Resource
from flask_login import current_user
from flaskr.zmodels import *
import os
from werkzeug.utils import secure_filename
from flaskr.zblueprints import main



#main = Blueprint('main', __name__)  -----> moved to zblueprints.py



# ====== SIGN IN / SIGN UP / LOG OUT ======
class CheckSession(Resource):
    def get(self):
        user = User.query.filter(User.id == session.get('user_id')).first()
        if not user:
            return make_response({'error': "Unauthorized: you must be logged in to make that request"}, 401)
        else:
            return make_response(user.to_dict(), 200)

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

class Logout(Resource):
    
    def delete(self):
        session['user_id'] = None
        session['username'] = None
        return {}, 204





# -----+++++++====== ROUTES ======+++++++-----

# ====== PROFILE PAGE FUNCTIONALITY ROUTES ======
@main.route('/api/test')
def test_route():
    return {"message": "Server and DB are connected!"}, 200

@main.route('/upload_photo', methods=['POST'])
def upload_photo():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('main.signin_page'))

    if 'profile_pic' not in request.files:
        return redirect(url_for('main.profile'))
        
    file = request.files['profile_pic']

    if file.filename != '':
        filename = secure_filename(file.filename)
        unique_filename = f"user_{user_id}_{filename}"
        save_path = os.path.join(main.root_path, 'static', 'images', unique_filename)
        file.save(save_path)

        user = db.session.get(User, user_id)
        user.profile_image = unique_filename
        db.session.commit()
    return redirect(url_for('main.profile'))

@main.route('/upload_banner', methods=['POST'])
def upload_banner():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('main.signin_page'))

    if 'banner_pic' not in request.files:
        return redirect(url_for('main.profile'))
        
    file = request.files['banner_pic']

    if file.filename != '':
        filename = secure_filename(file.filename)
        unique_filename = f"user_{user_id}_{filename}"
        save_path = os.path.join(main.root_path, 'static', 'images', unique_filename)
        file.save(save_path)

        user = db.session.get(User, user_id)
        user.banner_image = unique_filename
        db.session.commit()
    return redirect(url_for('main.profile'))

@main.route('/update_username', methods=['POST'])
def update_username():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('main.signin_page'))

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

    return redirect(url_for('main.profile'))

@main.route('/update_name', methods=['POST'])
def update_name():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('main.signin_page'))

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

    return redirect(url_for('main.profile'))

@main.route('/update_password', methods=['POST'])
def update_password():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('main.signin_page'))

    current_password = request.form.get('current_password')
    new_password = request.form.get('new_password')
    confirm_password = request.form.get('confirm_password')

    user = db.session.get(User, user_id)

    if not user.authenticate(current_password):
        flash("Error: Incorrect current password. Do you even know your own password?", "danger")
        return redirect(url_for('main.profile'))

    if new_password != confirm_password:
        flash("Error: New passwords do not match. Don't be silly, do it properly.", "danger")
        return redirect(url_for('main.profile'))

    try:
        user.password_hash = new_password 
        db.session.commit()
        flash("Success: Password updated successfully! I'll always know all your passwords anyways, no matter how often you change it.", "success")
        
    except Exception as e:
        db.session.rollback()
        flash("Error: Could not update password.", "danger")

    return redirect(url_for('main.profile'))

@main.route('/delete_account', methods=['POST'])
def delete_account():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('main.signin_page'))

    user = db.session.get(User, user_id)

    if user:
        try:
            db.session.delete(user)
            db.session.commit()
            session.clear() 
            
            return redirect(url_for('main.boom'))
            
        except Exception as e:
            db.session.rollback()
            flash("Error: You can't escape us that easily. Something went wrong.", "danger")
            print("Deletion Error:", e)
            return redirect(url_for('main.profile'))

    return redirect(url_for('main.signin_page'))

@main.route('/boom')
def boom():
    return render_template('boom.html')



# ===== LEADERBOARD / COMMENT / TIMING FUNCTIONALITY ROUTES ======
@main.route('/save_time', methods=['POST'])
def save_time():
    user_id = session.get('user_id')
    if not user_id:
        return {"success": False, "error": "Unauthorized"}, 401

    data = request.get_json()
    new_time = float(data.get('time'))
    task_name = data.get('task_name')

    user = db.session.get(User, user_id)

    if user and task_name:
        try:
            existing_score = db.session.query(Score).filter_by(user_id=user.id, task_name=task_name).first()

            if existing_score:
                if new_time < existing_score.best_time:
                    existing_score.best_time = new_time
                    db.session.commit()
                    return {"success": True, "message": f"New personal best on {task_name}!"}, 200
                else:
                    return {"success": True, "message": "Time recorded, but not a new record."}, 200
            
            else:
                new_score = Score(user_id=user.id, task_name=task_name, best_time=new_time)
                db.session.add(new_score)
                db.session.commit()
                return {"success": True, "message": f"First score for {task_name} saved!"}, 200
                
        except Exception as e:
            db.session.rollback()
            return {"success": False, "error": str(e)}, 500

    return {"success": False, "error": "Invalid request"}, 400

@main.route('/api/search')
def api_search():
    query = request.args.get('q', '').lower()
    all_users = User.query.all()
    finished_users = [user for user in all_users if user.total_time > 0]
    
    if query:
        finished_users = [user for user in finished_users if query in user.username.lower()]
        
    sorted_users = sorted(finished_users, key=lambda u: u.total_time, reverse=False)
    
    results = []
    for index, user in enumerate(sorted_users):
        results.append({
            "rank": index + 1,
            "username": user.username,
            "total_time": user.total_time,
            "is_current_user": current_user.is_authenticated and user.id == current_user.id
        })
        
    return jsonify(results)

@main.route('/api/add_comment', methods=['POST'])
def api_add_comment():
    user_id = session.get('user_id')
    username = session.get('username')
    
    if not user_id:
        return {"success": False, "error": "Unauthorized. You must be logged in to comment."}, 401

    data = request.get_json()
    comment_text = data.get('comment_text')

    try:
        new_comment = Comment(user_id=user_id, text=comment_text)
        
        db.session.add(new_comment)
        db.session.commit()
        
        return {
            "success": True, 
            "username": username,
            "comment_text": comment_text
        }, 200
        
    except Exception as e:
        db.session.rollback() 
        print("Database Error:", e)
        return {"success": False, "error": "Failed to save comment to the database."}, 500

@main.route('/api/get_comments')
def api_get_comments():
    all_comments = Comment.query.order_by(Comment.timestamp.desc()).all()
    
    comments_data = []
    for c in all_comments:
        comments_data.append({
            "username": c.user.username,
            "text": c.text,
            "timestamp": c.timestamp.strftime('%Y-%m-%d %H:%M'),
            "avatar": url_for('static', filename='images/' + c.user.profile_image)
        })
        
    return jsonify(comments_data)



# ====== PAGE ROUTES ======
@main.route('/')
def home():
    return render_template('landing.html')

@main.route('/sign_in')
def signin_page():
    if session.get('user_id'):
        return redirect(url_for('main.home'))
    return render_template('sign_in.html')

@main.route('/sign_up')
def signup_page():
    if session.get('user_id'):
        return redirect(url_for('main.home'))
    return render_template('sign_up.html')

@main.route('/profile')
def profile():
    if not session.get('user_id'):
        return redirect(url_for('main.signin_page'))
    current_user = db.session.get(User, session.get('user_id'))
    return render_template('profile.html', user=current_user)

@main.route('/leaderboard')
def leaderboard():
    all_users = User.query.all()
    finished_users = [user for user in all_users if user.total_time > 0]
    sorted_users = sorted(finished_users, key=lambda u: u.total_time, reverse=False)
    
    for index, user in enumerate(sorted_users):
        user.real_rank = index + 1 
        
    display_users = sorted_users[:20]
    
    if current_user.is_authenticated and current_user.total_time > 0:
        if current_user not in display_users:
            for user in sorted_users:
                if user.id == current_user.id:
                    display_users.append(user) 
                    break
                    
    return render_template('leaderboard.html', users=display_users)

@main.route('/comments')
def comments():
    if not session.get('user_id'):
        return redirect(url_for('main.signin_page'))
    return render_template('comments.html')

@main.route('/faq')
def faq():
    return render_template('FAQ.html')

@main.route('/404')
def not_found():

    #folder location meme_images are located
    folder = os.path.join(current_app.static_folder, 'images/404_images')
    
    #list of meme_images in folder
    files = os.listdir(folder)

    #filter to only 'compatible' files
    image_files = [
        f for f in files
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
    ]

    #create url_for()'s for each file in the folder
    image_list = [
        url_for('static', filename=f'images/404_images/{file}')
        for file in image_files
    ]

    #render template with dynamic image list, error code, error message, tab title
    return render_template('404.html', image_list=image_list, error='404', error_message='Oops... Page not found!', error_title='404: Page Not Found'), 404

@main.route('/volume_game')
def volume_game():
        return render_template('volume_game.html')
