
from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Увеличим стандартный таймаут
        page.set_default_timeout(60000)

        try:
            # Переходим на главную страницу, вход происходит автоматически
            page.goto("http://localhost:8080/")

            # Ждем появления приветственного окна и нажимаем "Начать творить!"
            start_button = page.locator('button:has-text("Начать творить!")')
            expect(start_button).to_be_visible()
            start_button.click()

            # Кликаем на элемент навигации "Библиотека"
            library_nav_element = page.locator('text=Библиотека').last
            expect(library_nav_element).to_be_visible()
            library_nav_element.click()

            # Ждем загрузки треков, ищем заголовок "Библиотека"
            # Проверяем, что URL изменился на /library
            expect(page).to_have_url("http://localhost:8080/library")
            library_header = page.locator('h1:has-text("Библиотека")')
            expect(library_header).to_be_visible()

            # Ждем появления хотя бы одной карточки трека, используя классы из TrackCard.tsx
            track_card = page.locator('div.group.overflow-hidden').first
            expect(track_card).to_be_visible()

            # Делаем скриншот
            page.screenshot(path="verification/library_page.png")
            print("Скриншот сделан успешно.")

        except Exception as e:
            print(f"Произошла ошибка: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
