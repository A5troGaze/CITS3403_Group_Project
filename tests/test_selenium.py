from unittest import TestCase
import multiprocessing
multiprocessing.set_start_method('fork', force=True)
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from flaskr.zconfig import TestingConfig
from flaskr.zmodels import db, User
from flaskr import create_app

localHost = "http://127.0.0.1:5000/"

class SeleniumTests(TestCase):

    def setUp(self):
        self.testApp = create_app(TestingConfig)
        self.app_context = self.testApp.app_context()
        self.app_context.push()
        db.create_all()

        self.add_user_data_to_db()
        self.server_thread = multiprocessing.Process(target=self.testApp.run)
        self.server_thread.start()
        time.sleep(1)

        self.driver = webdriver.Chrome()
        self.driver.get(localHost)
        self.wait = WebDriverWait(self.driver, 10)

    def tearDown(self):
        self.server_thread.terminate()
        self.server_thread.join()
        self.driver.close()
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

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

    def login(self):
        self.driver.get("http://127.0.0.1:5000/sign_in")
        self.wait.until(EC.presence_of_element_located((By.ID, "username")))
        self.driver.find_element(By.ID, "username").send_keys("Christofferson")
        self.driver.find_element(By.ID, "password").send_keys("1234")
        self.driver.find_element(By.CSS_SELECTOR, "#signInForm button[type='submit']").click()
        time.sleep(2)        

    def test_volume_start_button_close_popup(self):
        self.login()
        self.driver.get(localHost + "volume_check")
        start_btn = self.wait.until(EC.element_to_be_clickable((By.ID, "start-button")))
        start_btn.click()
        self.wait.until(EC.invisibility_of_element_located((By.ID, "volume-popup")))

    def test_loader_bar_completes_on_three_clicks(self):
        self.login()
        self.driver.get(localHost + "loading")
        loader_bar = self.wait.until(EC.element_to_be_clickable((By.ID, "loaderBar")))
        loader_bar.click()
        loader_bar.click()
        loader_bar.click()
        time.sleep(1)
        self.assertIn("Done! Congrats you passed the level!", loader_bar.text)    

