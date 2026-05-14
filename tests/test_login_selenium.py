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

class AuthSeleniumTests(TestCase):

# =========== SETUP AND TEARDOWN METHODS ===========  

    def setUp(self):
        self.testApp = create_app(TestingConfig)
        self.app_context = self.testApp.app_context()
        self.app_context.push()
        db.create_all()

        test_user = User(name="Test User", username="valid_testuser")
        test_user.password_hash = "valid_testpassword" 
        db.session.add(test_user)
        db.session.commit()
        self.server_thread = multiprocessing.Process(target=self.testApp.run)
        self.server_thread.start()
        time.sleep(1) 
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1920,1080")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)

    def tearDown(self):
        self.server_thread.terminate()
        self.server_thread.join()
        self.driver.quit()
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

# =========== SIGNUP / LOGIN SELENIUM TESTS ===========  

    def test_signup_success(self):
        self.driver.get(localHost + "sign_up")
        
        self.driver.find_element(By.NAME, "username").send_keys("brand_new_user")
        self.driver.find_element(By.NAME, "name").send_keys("New User")
        self.driver.find_element(By.NAME, "password").send_keys("securepassword123")
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
        self.wait.until(EC.alert_is_present())
        alert = self.driver.switch_to.alert
        self.assertEqual(alert.text, "Account created successfully!")
        alert.accept()

    def test_login_success(self):
        self.driver.get(localHost + "sign_in")
        self.driver.find_element(By.NAME, "username").send_keys("valid_testuser")
        self.driver.find_element(By.NAME, "password").send_keys("valid_testpassword")
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
        self.wait.until(EC.url_changes(localHost + "sign_in"))
        self.assertEqual(self.driver.current_url, localHost)

    def test_login_failure(self):
        self.driver.get(localHost + "sign_in")
        self.driver.find_element(By.NAME, "username").send_keys("wrong_user")
        self.driver.find_element(By.NAME, "password").send_keys("wrong_password")
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()
        self.wait.until(EC.alert_is_present())
        alert = self.driver.switch_to.alert
        self.assertEqual(alert.text, "Invalid username or password!")
        alert.accept()

    def test_failed_signup_username_already_exists(self):
        #first user
        self.driver.get(localHost + "sign_up")
        self.driver.find_element(By.NAME, "username").send_keys("generic_username01")
        self.driver.find_element(By.NAME, "name").send_keys("Generic User")
        self.driver.find_element(By.NAME, "password").send_keys("generic_password01")
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()

        #second user trying to sign up with identical username 'generic_username01
        self.driver.get(localHost + "sign_up")
        self.driver.find_element(By.NAME, "username").send_keys("generic_username01")
        self.driver.find_element(By.NAME, "name").send_keys("Generic User 2")
        self.driver.find_element(By.NAME, "password").send_keys("generic_password02")
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()

        self.wait.until(EC.alert_is_present())
        alert = self.driver.switch_to.alert
        self.assertIn("Username already taken.", alert.text)
        alert.accept()

    def test_failed_signup_blank_password_cannot_be_blank(self):
        self.driver.get(localHost + "sign_up")
        self.driver.find_element(By.NAME, "username").send_keys("brand_new_user")
        self.driver.find_element(By.NAME, "name").send_keys("New User")
        #self.driver.find_element(By.NAME, "password").send_keys("") # ----> No password
        self.driver.find_element(By.XPATH, "//button[@type='submit']").click()

        #ensure that even after click the 'browser' is still on the signup page (doesnt get redirected)
        self.assertIn("sign_up", self.driver.current_url)