# Eco‑Trace AI

**Автоматизированный ESG-аудит и расчёт углеродного следа для МСБ в РБ и ЕАЭС**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
![Status: MVP](https://img.shields.io/badge/status-MVP-brightgreen)

## Проблема
- Экспортёры (молоко, калий, техника) теряют контракты с Китаем / РФ из-за отсутствия углеродного отчёта
- Банки РБ (Банк развития, БПС-Сбербанк) дают зелёные кредиты ↓2-3%, но требуют ESG-профиль
- Западные сервисы (Terrascope, Watershed) не работают в РБ. Ручной аудит → $2000+ и 3 месяца

## Решение
**Eco‑Trace AI** — SaaS-платформа, которая:
- 🔌 Интегрируется с **1С:Бухгалтерия / 1С:ERP** через API
- 🤖 AI-движок переводит накладные в выбросы по формуле E = Σ(Ai × EFi)
- 🇧🇾 Генерирует отчёт по **СТБ ISO 14064-2018** (признаётся в ЕАЭС и Китае)
- 📦 Блокчейн-слепок для банков и партнёров

## Технологии (MVP)
| Компонент | Технология | Хостинг в РБ |
|-----------|------------|---------------|
| Frontend | Next.js 14 | beCloud |
| Backend | Node.js + Fastify | ActiveCloud |
| AI | YandexGPT (или GigaChat) | – |
| База | PostgreSQL (Supabase) | – |
| 1C-connector | 1C:Коннектор | – |

## Быстрый старт (демо)
```bash
git clone https://github.com/yolodfyucpjp-svg/sisiz
cd sisiz/mvp
# Смотрите скриншоты в /docs
