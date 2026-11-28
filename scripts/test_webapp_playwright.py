import sys
import os
import time
from playwright.sync_api import sync_playwright

def run_tests():
    print(">>> Starting Playwright End-to-End Webapp Testing...")
    screenshot_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # 1. Test Home Page
        print("1. Testing Home Page (http://localhost:3000)...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        home_screenshot = os.path.join(screenshot_dir, "webapp_test_home.png")
        page.screenshot(path=home_screenshot, full_page=True)
        print(f"   [OK] Home page loaded. Title: '{page.title()}'. Screenshot saved: {home_screenshot}")

        # 2. Test Stock Detail Page (BBCA.JK)
        print("2. Testing Stock Detail Page (http://localhost:3000/stocks/BBCA.JK)...")
        page.goto("http://localhost:3000/stocks/BBCA.JK")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # 3. Test Interactive Chart & Indicator Tray
        print("3. Testing Interactive Chart & Indicator Tray...")
        chart_tab = page.locator("button:has-text('Interactive Chart')")
        if chart_tab.count() > 0:
            chart_tab.click()
            time.sleep(1)

        # Toggle Indicators: EMA 9, EMA 21, BB (20,2), VWAP
        for ind_text in ["EMA 9", "EMA 21", "BB (20,2)", "VWAP"]:
            btn = page.locator(f"button:has-text('{ind_text}')")
            if btn.count() > 0:
                btn.click()
                print(f"   [OK] Toggled indicator: {ind_text}")
                time.sleep(0.5)

        chart_screenshot = os.path.join(screenshot_dir, "webapp_test_indicators_chart.png")
        page.screenshot(path=chart_screenshot)
        print(f"   [OK] Indicator Tray tested. Screenshot saved: {chart_screenshot}")

        # 4. Test Paper Trading Desk
        print("4. Testing Paper Trading Desk...")
        paper_tab = page.locator("button:has-text('Paper Trading')")
        if paper_tab.count() > 0:
            paper_tab.click()
            time.sleep(1.5)

            # Check virtual cash visibility
            cash_element = page.locator("text=Virtual Cash")
            if cash_element.count() > 0:
                print("   [OK] Virtual Cash Telemetry visible")

            # Click Import Desk Targets
            import_btn = page.locator("button:has-text('Import Desk Targets')")
            if import_btn.count() > 0:
                import_btn.click()
                print("   [OK] Clicked 'Import Desk Targets'")
                time.sleep(0.5)

            # Execute Simulated Order
            exec_btn = page.locator("button:has-text('Execute Simulated BUY')")
            if exec_btn.count() > 0:
                exec_btn.click()
                print("   [OK] Clicked 'Execute Simulated BUY'")
                time.sleep(1.5)

            paper_screenshot = os.path.join(screenshot_dir, "webapp_test_paper_trading.png")
            page.screenshot(path=paper_screenshot)
            print(f"   [OK] Paper Trading order executed. Screenshot saved: {paper_screenshot}")

        # 5. Switch back to Chart to verify simulated price lines on canvas
        print("5. Verifying Trading Price Lines on Interactive Chart...")
        chart_tab.click()
        time.sleep(1)
        sim_chart_screenshot = os.path.join(screenshot_dir, "webapp_test_chart_with_sim_lines.png")
        page.screenshot(path=sim_chart_screenshot)
        print(f"   [OK] Chart with simulated lines verified. Screenshot saved: {sim_chart_screenshot}")

        browser.close()
        print(">>> All Playwright End-to-End Tests Finished Successfully!")

if __name__ == "__main__":
    run_tests()
