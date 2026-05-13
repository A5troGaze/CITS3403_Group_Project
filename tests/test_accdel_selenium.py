from unittest import TestCase
import multiprocessing
multiprocessing.set_start_method('fork', force=True) # added for macOS compatibility with multiprocessing
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from flaskr.zconfig import TestingConfig
from flaskr.zmodels import db, User
from flaskr import create_app

localHost = "http://127.0.0.1:5000/"

class AccountDeletionSeleniumTest(TestCase):
# =========== SETUP AND TEARDOWN METHODS ===========   

    def setUp(self):
        self.testApp = create_app(TestingConfig) # create test app with testing config
        self.app_context = self.testApp.app_context()
        self.app_context.push()
        db.create_all() # create tables in test db (in memory)
        self.add_user_data_to_db()

        self.server_thread = multiprocessing.Process(target=self.testApp.run) # start flask server in a separate process
        self.server_thread.start()
        time.sleep(1) # wait for server to start before opening browser

        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        self.driver.get(localHost) # navigate to localHost in chrome
        self.wait = WebDriverWait(self.driver, 10) # wait up to 10 seconds for element to appear

    def tearDown(self):
        self.server_thread.terminate() # stop flask server
        self.server_thread.join()
        self.driver.close() # close browser
        db.session.remove() # remove pending db sessions
        db.drop_all() # erase all tables in memory
        self.app_context.pop()

# =========== HELPER FUNCTIONS ===========

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
        # navigate to sign in page and log in with test user
        self.driver.get("http://127.0.0.1:5000/sign_in")
        self.wait.until(EC.presence_of_element_located((By.ID, "username")))
        self.driver.find_element(By.ID, "username").send_keys("Christofferson")
        self.driver.find_element(By.ID, "password").send_keys("1234")
        self.driver.find_element(By.CSS_SELECTOR, "#signInForm button[type='submit']").click()
        time.sleep(2) # wait for login fetch request and redirect to complete

# =========== SELENIUM TEST FUNCTIONS =========== 
    def test_delete_account(self):
        self.login()
        self.driver.get(localHost + "profile")
        delete_btn = self.wait.until(EC.element_to_be_clickable((By.ID, "delete-btn"))) # wait for delete button to be clickable
        self.driver.execute_script("arguments[0].scrollIntoView(true);", delete_btn) # scroll to button before clicking
        time.sleep(0.5) # wait for the scroll to complete
        delete_btn.click() # first click (message changes)
        self.assertEqual(delete_btn.text, "Are you sure? This is permanent.") 
        delete_btn.click() # second click (message changes again)
        self.assertEqual(delete_btn.text, "LAST WARNING! CLICK TO DESTROY ACCOUNT!")
        delete_btn.click() # third click (should submit form and redirect away from profile page)
        time.sleep(1)
        self.assertNotIn("profile", self.driver.current_url) # check that the user is redirected away from the profile page after account deletion
