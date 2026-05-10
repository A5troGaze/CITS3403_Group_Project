import unittest
from flaskr.zconfig import TestingConfig
from flaskr.z__init__ import create_app

class Testing(TestCase):
    def setUp(self):
        testApp=create_app(TestingConfig)
        self.app_context=testApp.app_context()
        self.app_context.push()
        db.create_all()
        add_test_data_to_db()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()