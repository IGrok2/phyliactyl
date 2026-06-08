# Phyliactyl

Современная панель управления игровыми серверами на Next.js 16 + shadcn/ui
(чёрно-белая тема, закругления, анимации, адаптив). Это альтернативный
веб-фронтенд для **Pterodactyl** — работает поверх его Client и Application API.

> Установка и настройка: см. **[Install.md](./Install.md)**. Все параметры
> задаются через `.env` (см. `.env.example`).

## Запуск

```bash
npm run dev      # разработка
npm run build    # production-сборка
npm run start    # запуск собранного приложения
```

Откройте http://localhost:3000

## Подключение к Pterodactyl

Скопируйте `.env.example` в `.env.local` и заполните:

```bash
PTERODACTYL_URL=https://panel.example.com
PTERODACTYL_CLIENT_KEY=ptlc_...   # Account → API Credentials
PTERODACTYL_APP_KEY=ptla_...      # Admin → Application API (для админки)
```

Как это устроено:

- Запросы к Pterodactyl идут через **серверный BFF-слой** (`app/api/*` route
  handlers). API-ключи читаются только на сервере (`lib/pterodactyl/config.ts`)
  и **никогда не попадают в браузер**.
- Браузер обращается к собственным эндпоинтам `/api/...`, которые проксируют
  запросы к Pterodactyl и приводят ответы к внутренним типам (`lib/pterodactyl/map.ts`).
- **Демо-режим:** если переменные окружения не заданы, BFF возвращает
  `{ configured: false }`, и интерфейс автоматически показывает примерные
  данные из `lib/data.ts` (с пометкой «Демо-режим»).

### Реализованные операции

- Client API: список серверов, ресурсы, питание (start/stop/restart/kill),
  отправка команд, файлы, базы данных (создание/удаление), расписания,
  бэкапы (создание/удаление), сеть/аллокации, параметры запуска, субпользователи,
  переименование сервера.
- Application API (админка): пользователи, ноды, локации.
- **Живая консоль** через WebSocket Wings (`hooks/use-server-socket.ts`):
  стрим логов, статистики и управление питанием в реальном времени.

> Для работы живой консоли домен панели должен быть в списке разрешённых
> origin'ов на нодах Wings, иначе браузер не сможет открыть WebSocket.

## Смена языка

- Язык по умолчанию — **английский**, переключается на **русский**.
- Переключатель находится в **настройках аккаунта** и на **странице входа**.
- Выбор сохраняется в `localStorage`. Система: `lib/i18n/translations.ts`
  (словари), `components/i18n-provider.tsx` (провайдер + хук `useT`),
  `components/language-switcher.tsx`.

## Авторизация (многопользовательская)

Вход выполняется по данным **Pterodactyl**: пользователь указывает **URL панели**
и свой **Client API ключ** (`ptlc_...`, создаётся в Pterodactyl: Account → API
Credentials). Опционально — **Application API ключ** (`ptla_...`) для доступа к
разделам админки.

- Данные входа сохраняются в **httpOnly cookie-сессии** (`lib/auth/session.ts`)
  и недоступны из JavaScript в браузере.
- `proxy.ts` (в Next.js 16 middleware переименован в `proxy`) перенаправляет
  неавторизованных пользователей на `/login`, а авторизованных со страницы
  входа — на главную.
- Каждый пользователь видит **свои** серверы (BFF использует ключ из его сессии;
  `lib/pterodactyl/api.ts` → `resolve()` берёт ключ из сессии, иначе из env).
- Выход: `POST /api/auth/logout` (кнопка в меню профиля).

`.env` нужен только если хотите задать **URL панели по умолчанию** (подставится
в форму входа) или общий ключ-fallback:

```bash
PTERODACTYL_URL=https://panel.example.com   # необязательно, для префилла формы
PTERODACTYL_CLIENT_KEY=ptlc_...             # необязательно (fallback)
PTERODACTYL_APP_KEY=ptla_...                # необязательно (fallback для админки)
```

## ⚠️ Безопасность

- Ключи хранятся в httpOnly cookie и не покидают сервер в виде, доступном JS.
  Тем не менее cookie не зашифрована — для production используйте HTTPS
  (флаг `secure` уже включается в проде) и при необходимости добавьте шифрование
  значения сессии.
- Для живой консоли домен панели должен быть в списке разрешённых origin'ов на
  нодах Wings, иначе браузер не сможет открыть WebSocket.

## Структура

- `app/(panel)/` — основной интерфейс (серверы, вкладки сервера, админка, аккаунт)
- `app/login/` — страница авторизации
- `app/api/` — BFF route handlers (прокси к Pterodactyl)
- `lib/pterodactyl/` — серверный клиент API, типы, мапперы, конфиг
- `lib/api.ts` — клиентский fetch к BFF + хук `useApiData` (с демо-fallback)
- `lib/i18n/`, `components/i18n-provider.tsx` — локализация
- `lib/data.ts` — типы и демо-данные
- `components/panel/` — компоненты панели
- `components/ui/` — shadcn/ui компоненты
