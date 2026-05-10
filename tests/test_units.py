from unittest import TestCase
from flaskr.zconfig import TestingConfig
from flaskr.zmodels import db, User, Score, Comment
from flaskr import create_app

class Testing(TestCase):
# =========== SETUP AND TEARDOWN METHODS ===========
    def setUp(self):
        #RUN BEFORE EACH TEST
        testApp=create_app(TestingConfig) #create test app with testing config
        self.app_context=testApp.app_context() #create app context
        self.app_context.push() #push context
        db.create_all() #create tables in test db (in memory)
        self.add_user_data_to_db()

    def tearDown(self):
        #RUN AFTER EACH TEST
        db.session.remove() #remove pending db sessions
        db.drop_all() #erase all tables in memory
        self.app_context.pop() #pop context


# =========== HELPER FUNCTIONS TO ADD DATA TO TEST DB ===========
    def add_user_data_to_db(self):
        user1 = User(
            name='Chris',
            username='Christofferson'
        )
        user1.password_hash = '1234'

        user2 = User(
            name='Jan',
            username='Janofferson'

        )
        user2.password_hash='5678'

        user3 = User(
            name='Juv',
            username='Juvofferson'
        )
        user3.password_hash = '9101'

        user4 = User(
            name='Khal',
            username='Khalofferson'
        )
        user4.password_hash = '2345'


        db.session.add_all([user1, user2, user3, user4])
        db.session.commit()
    
    def add_score_data_to_db(self):
        pass

    def add_comment_data_to_db(self):
        pass

# =========== UNIT TEST FUNCTIONS ===========
    # ----++++ Check that if the password hash tries to be viewed and AttributeError gets raised ++++----
    def test_hashed_password_cannot_be_viewed_by_public_getter(self):
        user = User.query.filter_by(username='Christofferson').first()
        with self.assertRaises(AttributeError):
            _ = user.password_hash

    # ----++++ Check that the password gets hashed after being submitted ++++----
    def test_password_is_hashed(self):
        user = User.query.filter_by(username='Janofferson').first()
        self.assertNotEqual(user._password_hash, '5678')

    # ----++++ Check that the username cannot be blank upon creation/entry ++++----
    def test_username_cannot_be_blank(self):
        user = User(name='blank')
        user.password_hash = 'blank_password'
        db.session.add(user)
        with self.assertRaises(Exception): #commit() should raise exception at un-nullable columns
            db.session.commit()


    
    
