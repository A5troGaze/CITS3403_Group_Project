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
        self.client = testApp.test_client() #fake HTTP client for route tests
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
        # Look up the seeded users so we can attach scores to them by id
        chris = User.query.filter_by(username='Christofferson').first()
        jan   = User.query.filter_by(username='Janofferson').first()
        juv   = User.query.filter_by(username='Juvofferson').first()
        # Khal is intentionally left with zero scores so we can test the "no scores -> 0.0" branch

        scores = [
            # Chris: two volume_game attempts. Best = 7.5
            Score(user_id=chris.id, task_name='volume_game',    best_time=10.0),
            Score(user_id=chris.id, task_name='volume_game',    best_time=7.5),

            # Jan: one volume_game AND two secret_endings.
            # The total_time property should short-circuit and return min(secret_endings) = 2.5
            Score(user_id=jan.id,   task_name='volume_game',    best_time=20.0),
            Score(user_id=jan.id,   task_name='secret_ending',  best_time=3.0),
            Score(user_id=jan.id,   task_name='secret_ending',  best_time=2.5),

            # Juv: simple single score. Best = 5.0
            Score(user_id=juv.id,   task_name='volume_game',    best_time=5.0),
        ]
        db.session.add_all(scores)
        db.session.commit()

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

    # ===================== SECTION 1: More User model tests =====================

    # ----++++ Check that authenticate() returns True when the password is correct ++++----
    def test_authenticate_returns_true_on_correct_password(self):
        user = User.query.filter_by(username='Christofferson').first()
        # In setUp we set Chris's password to '1234' (then it was bcrypt-hashed by the setter)
        # authenticate() should hash the input the same way and confirm a match
        self.assertTrue(user.authenticate('1234'))

    # ----++++ Check that authenticate() returns False when the password is wrong ++++----
    def test_authenticate_returns_false_on_wrong_password(self):
        user = User.query.filter_by(username='Christofferson').first()
        self.assertFalse(user.authenticate('definitely_not_my_password'))

    # ----++++ Check that two users cannot share the same username ++++----
    def test_username_must_be_unique(self):
        # Christofferson already exists (added in setUp). Adding a second one must fail.
        duplicate = User(name='Imposter', username='Christofferson')
        duplicate.password_hash = 'pw'
        db.session.add(duplicate)
        with self.assertRaises(Exception): #IntegrityError gets raised by the unique=True constraint
            db.session.commit()

    # ----++++ Check that name cannot be null on creation ++++----
    def test_name_cannot_be_null(self):
        # 'name' is nullable=False. Creating a user without one should fail at commit time.
        user = User(username='Nameless')
        user.password_hash = 'pw'
        db.session.add(user)
        with self.assertRaises(Exception):
            db.session.commit()

    # ----++++ Check that profile_image and banner_image fall back to their server defaults ++++----
    def test_default_profile_and_banner_images(self):
        # We don't set profile_image or banner_image. The server_default in the column definition
        # should kick in when the row is inserted by the database.
        user = User(name='Defaults', username='DefaultsUser')
        user.password_hash = 'pw'
        db.session.add(user)
        db.session.commit()

        # Re-query so we see what the DB actually stored (server defaults are filled on insert, not in Python)
        refreshed = User.query.filter_by(username='DefaultsUser').first()
        self.assertEqual(refreshed.profile_image, 'icon_head.jpg')
        self.assertEqual(refreshed.banner_image, 'default_banner.png')

    # ----++++ Check that reassigning password_hash invalidates the old password ++++----
    def test_password_can_be_updated(self):
        user = User.query.filter_by(username='Christofferson').first()
        user.password_hash = 'new_secret'   # setter re-hashes with bcrypt
        db.session.commit()

        self.assertTrue(user.authenticate('new_secret'))
        self.assertFalse(user.authenticate('1234'))  # old password no longer works


