import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def login_success(driver):
    driver.get("http://localhost:5000/login")
    username_input = driver.find_element(By.NAME, "username")
    password_input = driver.find_element(By.NAME, "password")
    username_input.send_keys("valid_testuser")
    password_input.send_keys("valid_testpassword")
    login_button = driver.find_element(By.XPATH, "//button[@type='submit']")
    login_button.click()
    WebDriverWait(driver, 10).until(EC.url_changes("http://localhost:5000/login"))
    assert driver.current_url == "http://localhost:5000/"