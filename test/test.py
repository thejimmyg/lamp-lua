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
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-gpu")
        driver = webdriver.Chrome(options=chrome_options)
        driver.set_window_size(1920, 1080)
        # It is on port 80 internally on the docker network for some reason
        driver.get('http://httpd:80/')
    else:
        raise Exception(f"Unknown driver {repr(driver_name)}, expected 'chromedriver' or 'appium'")
    return driver

import sys
from selenium.webdriver.common.by import By

screenshot_counter = [1]
def screenshot(driver):
    driver.save_screenshot(f'/tmp/screenshots/{str(screenshot_counter[0]).zfill(5)}.png')
    screenshot_counter[0] += 1


def passed(driver):
    screenshot(driver)
    print('.', end='')
    sys.stdout.flush()


def main():

    driver = auto_load_driver()
    screenshot(driver)

    actual = driver.find_element(By.CSS_SELECTOR, f"article").text
    assert 'Home' == actual, actual
    passed(driver)

    driver.get('http://httpd:80/db')
    actual = driver.find_element(By.CSS_SELECTOR, f"article").text
    assert '["information_schema","my_database"]' == actual, actual
    passed(driver)

    driver.get('http://httpd:80/404')
    actual = driver.find_element(By.CSS_SELECTOR, f"article").text
    assert 'Not Found' == actual, actual
    passed(driver)

    driver.quit()
    print('\nSUCCESS')
    print('See the screenshots directory.')

if __name__ == '__main__':
    main()
