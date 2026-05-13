import pytest
import uuid
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager

unique_username = f"testuser_{uuid.uuid4().hex[:8]}"
test_password = "securepassword123"

@pytest.fixture
def driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    yield driver 
    driver.quit()

def test_signup_success(driver):
    driver.get("http://localhost:5000/sign_up")
    driver.find_element(By.NAME, "username").send_keys(unique_username)
    driver.find_element(By.NAME, "name").send_keys("Automated Tester")
    driver.find_element(By.NAME, "password").send_keys(test_password)
    submit_button = driver.find_element(By.XPATH, "//button[@type='submit']")
    submit_button.click()
    WebDriverWait(driver, 10).until(EC.alert_is_present())
    alert = driver.switch_to.alert
    assert alert.text == "Account created successfully!"
    alert.accept()
    WebDriverWait(driver, 10).until(EC.url_changes("http://localhost:5000/sign_up"))

def test_login_success(driver):
    driver.get("http://localhost:5000/sign_in")
    driver.find_element(By.NAME, "username").send_keys(unique_username)
    driver.find_element(By.NAME, "password").send_keys(test_password)
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    WebDriverWait(driver, 10).until(EC.url_changes("http://localhost:5000/sign_in"))
    assert driver.current_url == "http://localhost:5000/"

def test_login_failure(driver):
    driver.get("http://localhost:5000/sign_in")
    driver.find_element(By.NAME, "username").send_keys("totally_fake_user_123")
    driver.find_element(By.NAME, "password").send_keys("wrong_password")
    driver.find_element(By.XPATH, "//button[@type='submit']").click()
    WebDriverWait(driver, 10).until(EC.alert_is_present())
    alert = driver.switch_to.alert
    assert alert.text == "Invalid username or password!"
    alert.accept()