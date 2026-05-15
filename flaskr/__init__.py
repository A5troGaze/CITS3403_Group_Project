from flask import Flask, session, render_template, url_for, current_app
from flask_restful import Api
from flask_login import LoginManager
from flask_migrate import Migrate
from dotenv import load_dotenv
import os
from flaskr.zmodels import db
from flask_wtf.csrf import CSRFProtect

migrate = Migrate()
load_dotenv()
login_manager = LoginManager()
csrf = CSRFProtect()


def create_app(config):
    # Create Flask app and set the instance path to a folder named 'instance' inside the 'flaskr' folder
    app = Flask(__name__) #
    app.config.from_object(config) # load Config class
    app.json.compact = False

    # Check instance folder exists -> if not create it
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    from flaskr.zmodels import bcrypt, User # register models here to avoid circular imports
    db.init_app(app) # bind db to this app
    migrate.init_app(app, db) # bind migrate to db
    bcrypt.init_app(app) # bind bcrypt to this app

    login_manager.init_app(app) # bind login_manager to this app
    login_manager.login_view = 'main.login' # -----> changed from 'login' to 'main.login' to reflect blueprint registration
    csrf.init_app(app)

    from flaskr.zroutes import CheckSession, Signup, Login, Logout
    api = Api(app) # bind API to this app
    api.add_resource(CheckSession, '/check_session', endpoint='check_session')
    api.add_resource(Signup, '/signup', endpoint='signup')
    api.add_resource(Login, '/login', endpoint='login')
    api.add_resource(Logout, '/logout', endpoint='logout')

    from flaskr.zblueprints import main # import blueprint
    app.register_blueprint(main) # register routes

    @login_manager.user_loader # register user_loader
    def load_user(user_id):
        return User.query.get(int(user_id)) # if user_id valid -> return user_id

    @app.context_processor # not unnecessary -> trust
    def inject_user():
        if session.get('user_id'):
            user = User.query.get(session.get('user_id'))
            return dict(current_user=user)
        return dict(current_user=None)
    
    # ====== ERROR HANDLERS ======
    # page not found error handler -> redirects to '404' page
    @app.errorhandler(404)
    def page_not_found(e):

        folder = os.path.join(current_app.static_folder, 'images/404_images')
        
        files = os.listdir(folder)

        image_files = [
            f for f in files
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
        ]

        image_list = [
            url_for('static', filename=f'images/404_images/{file}')
            for file in image_files
        ]

        # return with image list, correct error code, message & title
        return render_template('404.html', image_list=image_list, error='404', error_message='Oops... Page not found!', error_title='404: Page Not Found'), 404

    # bad request error handler -> redirects to '404' page
    @app.errorhandler(400)
    def bad_request(e):
        
        folder = os.path.join(current_app.static_folder, 'images/404_images')
        
        files = os.listdir(folder)

        image_files = [
            f for f in files
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
        ]

        image_list = [
            url_for('static', filename=f'images/404_images/{file}')
            for file in image_files
        ]

        return render_template('404.html', image_list=image_list, error='400', error_message='Bad request!', error_title='400: Bad Request'), 400

    # forbidden error handler -> redirects to '404' page
    @app.errorhandler(403)
    def forbidden(e):

        folder = os.path.join(current_app.static_folder, 'images/404_images')
        
        files = os.listdir(folder)

        image_files = [
            f for f in files
            if f.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.webp'))
        ]

        image_list = [
            url_for('static', filename=f'images/404_images/{file}')
            for file in image_files
        ]

        return render_template('404.html', image_list=image_list, error='403', error_message='Forbidden!', error_title='403: Forbidden'), 403

    # print(app.url_map)
    return app