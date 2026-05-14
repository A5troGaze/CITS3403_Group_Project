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

class GameSeleniumTests(TestCase):
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

    # check to see if the popup closes when the start button is clicked in volume_check
    def test_volume_start_button_close_popup(self):
        self.login()
        self.driver.get(localHost + "volume_check")
        start_btn = self.wait.until(EC.element_to_be_clickable((By.ID, "start-button"))) # wait for start button to be clickable
        start_btn.click() # click the start button
        self.wait.until(EC.invisibility_of_element_located((By.ID, "volume-popup"))) # check that popup is no longer visible

    # check to see if the completion message appears when the loader bar is clicked 3 times
    def test_loader_bar_completes_on_three_clicks(self):
        self.login()
        self.driver.get(localHost + "loading")
        loader_bar = self.wait.until(EC.element_to_be_clickable((By.ID, "loaderBar"))) # wait for loader bar to be clickable
        loader_bar.click() # click 
        loader_bar.click() # click
        loader_bar.click() # click
        time.sleep(1)
        self.assertIn("Done! Congrats you passed the level!", loader_bar.text) # check that the completion message appears

    def test_sign_in_again_app_redirects(self):
        #sign in first
        self.login()
        #go to signin again game page
        self.driver.get(localHost + "signin")
        self.driver.find_element(By.ID, "signInHeader").click()
        self.wait.until(EC.url_changes(localHost + "signin")) # ---> wait.until has timeout of 10s returns FAIL if nothing happenss
        #check that the redirected url no longer contains 'signin' # ---> redirected
        self.assertNotIn("signin", self.driver.current_url)

