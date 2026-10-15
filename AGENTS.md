# AGENTS.md — инструкции для кодинг-агента

Проект: лабораторная «АХ: Агент-художник». Многоагентная система рисует **непереводимые слова** (тоска, komorebi,
hiraeth, mono no aware, sobremesa), а «слепой» VLM-критик, не зная слова, угадывает смысл картины.

## Структура

- `Agent_Artist.ipynb` — весь код системы (требование задания: код в ноутбуке, с пояснениями в markdown-ячейках).
- `docs/` — статический сайт для GitHub Pages (публикация из ветки `main`, папка `/docs`).
  - `index.html`, `style.css`, `app.js` — вёрстка и рендер, без сборки и без фреймворков.
  - `data/gallery.json` и `data/gallery.js` — результаты, **генерирует ноутбук**, руками не править.
  - `images/<slug>/v<N>.jpg` — версии картин, тоже генерирует ноутбук.
- `REPORT.md` — отчёт по шаблону курса.

## Правила

- Ключи Yandex Cloud только в `.env` (`folder_id`, `api_key`), файл в `.gitignore`. Никогда не коммитить ключи.
- Все LLM/VLM вызовы — через OpenAI SDK на `https://ai.api.cloud.yandex.net/v1`:
  текст — Responses API (`client.responses.create`), картинки — Images API (`client.images.generate`, `art://…/aliceai-image-art-3.0`, промпт ≤ 500 символов).
- Формат `gallery.json` — контракт между ноутбуком и сайтом. Меняешь поля в ноутбуке — обнови `docs/app.js`.
- Сайт должен открываться и по `file://` (поэтому данные подключаются как `gallery.js`, а не через `fetch`).
- Язык интерфейса, комментариев и промптов агентов — русский.

## Как проверить

```bash
pip install -r requirements.txt
jupyter nbconvert --to notebook --execute --inplace Agent_Artist.ipynb
python3 -m http.server -d docs 8000
```
