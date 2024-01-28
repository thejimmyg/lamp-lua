def auto_load_driver():
    import os

    driver_name = os.environ.get('DRIVER', 'chromedriver')
    if driver_name == 'appium':
        import time
        from appium import webdriver
        from appium.options.ios import XCUITestOptions
        from appium.webdriver.common.appiumby import AppiumBy
        
        APPIUM_PORT = 4723
        APPIUM_HOST = os.environ['APPIUM_HOST']
        
        
        def create_ios_driver(custom_opts = None):
            options = XCUITestOptions()
            options.udid = '355821BB-2205-4B34-80F2-71EE0009228D'
            
            options.no_reset = True
            options.bundle_id = 'host.exp.Exponent'
        
            # options.browser_name = 'Safari'
            # options.safari_initial_url = 'https://jimmyg.org'
            if custom_opts is not None:
                options.load_capabilities(custom_opts)
            print(options)
            return options
        driver = webdriver.Remote(f'http://{APPIUM_HOST}:{APPIUM_PORT}', options=create_ios_driver())
        for x in range(20):
            time.sleep(1)
            print(type(driver.contexts))
            print(driver.contexts)
            if len(driver.contexts) > 1:
                break
        # React Native:
        # app_div = driver.find_element(By.ACCESSIBILITY_ID, 'hello')
        # Instead switch to webview:
        # https://appium.readthedocs.io/en/latest/en/writing-running-appium/web/hybrid/
        webview = driver.contexts[-1]
        driver.switch_to.context(webview)
        # Switch back to native view
        # driver.switch_to.context(driver.contexts[0])
    elif driver_name == 'chromedriver':
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
    
        chrome_options = Options()
        if os.environ.get('HEADLESS', 'true').lower() == 'true':
            chrome_options.add_argument("--headless")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-gpu")
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_window_size(1920, 1080)
        # It is on port 80 internally on the docker network for some reason
        url = get_target_url()
        driver.get(url)
    else:
        raise Exception(f"Unknown driver {repr(driver_name)}, expected 'chromedriver' or 'appium'")
    return driver

import datetime
import sys
from selenium.webdriver.common.by import By

screenshot_counter = [1, datetime.datetime.now().isoformat()[:19]]
def screenshot(driver):
    counter, now = screenshot_counter
    driver.save_screenshot(f'/tmp/screenshots/{now}-{str(counter).zfill(5)}.png')
    screenshot_counter[0] += 1


def get_target_url():
    import os
    return os.environ.get('URL', 'http://httpd:80')


def passed(driver):
    screenshot(driver)
    print('.', end='')
    sys.stdout.flush()


def navigate(driver, link_selector):
    driver.find_element(By.CSS_SELECTOR, link_selector).click()



from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC



class text_to_be_exact_stripping_whitespace(object):
    def __init__(self, locator, text_):
        self.locator = locator
        self.text = text_

    def __call__(self, driver):
        element_text = driver.find_element(*self.locator).text
        # print(element_text.strip(), self.text)
        return element_text.strip() == self.text


def wait_for_element_to_have_text(driver, selector, expected_text):
    locator = (By.CSS_SELECTOR, selector)
    wait = WebDriverWait(driver, 10)
    try:
        wait.until(text_to_be_exact_stripping_whitespace(locator, expected_text))
    except:
        print(driver.page_source)
        raise
    return driver.find_element(By.CSS_SELECTOR, selector).text


def wait_for_element_to_include_text(driver, selector, expected_text):
    locator = (By.CSS_SELECTOR, selector)
    wait = WebDriverWait(driver, 10)
    try:
        wait.until(EC.text_to_be_present_in_element(locator, expected_text))
    except:
        print(driver.page_source)
        raise
    return driver.find_element(By.CSS_SELECTOR, selector).text


def main():
    driver = auto_load_driver()
    screenshot(driver)


    url = get_target_url()
    print('Testing against:', url)

    # Navigate via links
    navigate(driver, "#nav-db-link")
    expected = '{"hello": "world"}'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    navigate(driver, "#nav-example-404-link")
    expected = 'Not Found'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    navigate(driver, "#nav-home-link")
    expected = 'Home'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    # Navigate via page loads
    driver.get(url + '/db')
    expected = '{"hello": "world"}'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    driver.get(url + '/404')
    expected = 'Not Found'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    driver.get(url)
    expected = 'Home'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    # Check server side includes work
    driver.get(url + '/example')
    expected = 'Example'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    assert '<head>' in driver.page_source
    assert '<body ' in driver.page_source
    assert '</body>' in driver.page_source
    passed(driver)


    # Need to test login, logout and private.
    navigate(driver, "#nav-private-link")
    expected = 'Unauthorized'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    navigate(driver, "#nav-login-link")
    expected = 'Login'
    actual = wait_for_element_to_include_text(driver, "article", expected)
    assert expected in actual, actual
    login(driver, 'james', 'wrong-password')
    actual = wait_for_element_to_include_text(driver, "article", expected)
    assert expected in actual, actual
    login(driver, 'james', '123123')
    expected = 'Private'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    navigate(driver, "#nav-private-link")
    expected = 'Private'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    navigate(driver, "#nav-logout-link")
    expected = 'Logged out successfully.'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)

    navigate(driver, "#nav-private-link")
    expected = 'Unauthorized'
    actual = wait_for_element_to_have_text(driver, "article", expected)
    assert expected == actual, actual
    passed(driver)


    driver.quit()
    print('\nSUCCESS')
    print('See the screenshots directory.')


def login(driver, username, password):
    # Find the <article> tag
    article = driver.find_element(By.TAG_NAME, 'article')

    # Find the username and password input fields within the <article> tag
    username_field = article.find_element(By.NAME, 'httpd_username')
    password_field = article.find_element(By.NAME, 'httpd_password')

    # Enter the username and password
    username_field.send_keys(username)
    password_field.send_keys(password)

    # Find and click the login button
    login_button = article.find_element(By.NAME, 'login')
    login_button.click()


if __name__ == '__main__':
    main()
