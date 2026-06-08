# Phyliactyl — установка

Phyliactyl — современная веб-панель управления игровыми серверами на **Next.js**,
работающая поверх вашего **Pterodactyl** (через его Client и Application API).
Это альтернативный фронтенд: своя авторизация по аккаунту Pterodactyl,
живая консоль, файловый менеджер, базы данных, бэкапы, расписания и админка.

---

## 1. Требования

- **Node.js 20+** и **npm**
- Рабочая установка **Pterodactyl** (панель + Wings)
- Доступ к панели по HTTPS (рекомендуется для production)

Проверьте версию Node:

```bash
node -v   # должно быть >= 20
```

---

## 2. Установка

```bash
# 1. Клонируем репозиторий
git clone https://github.com/<ваш-аккаунт>/phyliactyl.git
cd phyliactyl

# 2. Устанавливаем зависимости
npm install

# 3. Создаём файл конфигурации
cp .env.example .env.local
```

---

## 3. Конфигурация (.env.local)

Все настройки задаются переменными окружения. Откройте `.env.local` и заполните:

| Переменная | Назначение | Обязательна |
|---|---|---|
| `APP_NAME` | Название панели (бренд) | нет (по умолч. `Phyliactyl`) |
| `APP_TAGLINE` | Подзаголовок под названием | нет |
| `NEXT_PUBLIC_APP_NAME` | То же имя для клиента (до загрузки бренда) | нет |
| `PTERODACTYL_URL` | URL вашей панели, напр. `https://panel.example.com` | желательно |
| `PTERODACTYL_CLIENT_KEY` | `ptlc_...` — fallback без логина | нет |
| `PTERODACTYL_APP_KEY` | `ptla_...` — для админ-разделов | нет* |

\* Application API ключ можно не задавать в `.env`, а ввести прямо в панели:
**Admin → Application API**. Он нужен только для админ-разделов (ноды,
локации, пользователи, нэсты).

### Где взять ключи Pterodactyl

- **Client ключ** (`ptlc_...`): в Pterodactyl → *Account* → *API Credentials*.
- **Application ключ** (`ptla_...`): в Pterodactyl → *Admin* → *Application API*.
  При создании выдайте права **Read** (или **Read & Write**) на ресурсы:
  *Users, Nodes, Allocations, Locations, Servers, Nests, Eggs*.
  Без прав на ресурс Pterodactyl вернёт `This action is unauthorized`.

---

## 4. Запуск

### Режим разработки

```bash
npm run dev
```

Откройте http://localhost:3000

### Production-сборка

```bash
npm run build
npm run start      # по умолчанию порт 3000
```

Сменить порт:

```bash
PORT=8080 npm run start
```

---

## 5. Вход в панель

1. Откройте панель в браузере.
2. На странице входа укажите **логин/пароль** вашего аккаунта Pterodactyl.
   (URL панели подставится из `PTERODACTYL_URL`, либо введите вручную.)
3. Данные входа хранятся в **httpOnly cookie-сессии** и не доступны из JS.

Каждый пользователь видит свои серверы. Администраторы Pterodactyl
(`root_admin`) дополнительно видят админ-разделы и все серверы.

---

## 6. Живая консоль (WebSocket)

Для работы живой консоли домен Phyliactyl должен быть в списке
**разрешённых origin'ов** на нодах Wings (`config.yml` → `allowed_origins`),
иначе браузер не сможет открыть WebSocket к Wings.

```yaml
# /etc/pterodactyl/config.yml на ноде Wings
allowed_origins:
  - https://phyliactyl.example.com
```

После изменения перезапустите Wings: `systemctl restart wings`.

---

## 7. Production за реверс-прокси (пример Nginx)

```nginx
server {
    listen 443 ssl;
    server_name phyliactyl.example.com;

    # ssl_certificate ... ; ssl_certificate_key ... ;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $remote_addr;
    }
}
```

Запуск как сервис (systemd, пример):

```ini
# /etc/systemd/system/phyliactyl.service
[Unit]
Description=Phyliactyl Panel
After=network.target

[Service]
WorkingDirectory=/opt/phyliactyl
ExecStart=/usr/bin/npm run start
Environment=NODE_ENV=production
Environment=PORT=3000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now phyliactyl
```

---

## 8. Глобальные настройки панели

Брендирование (название/подзаголовок), SMTP и HTTP-параметры можно менять
прямо в интерфейсе: **Админка → Settings** и **Application API**.
Они сохраняются в файле `.nebula-settings.json` рядом с проектом.

> Этот файл может содержать пароль SMTP — он уже в `.gitignore`, **не коммитьте его**.

---

## 9. Безопасность

- Все API-ключи читаются только на сервере и не попадают в браузер
  (кроме переменных с префиксом `NEXT_PUBLIC_`).
- Cookie-сессия `httpOnly`; для production используйте **HTTPS**
  (флаг `secure` включается автоматически при `NODE_ENV=production`).
- Админ-разделы (`/admin/*`) и админ-API проверяют права администратора
  **на стороне Pterodactyl** при каждом запросе — обойти через подделку
  cookie нельзя.
- Не коммитьте `.env*` и `.nebula-settings.json` (уже в `.gitignore`).

---

## 10. Частые проблемы

| Симптом | Причина / решение |
|---|---|
| `This action is unauthorized` в админке | У `ptla_` ключа нет прав на ресурс — выдайте Read в Admin → Application API |
| Ноды/пользователи пустые | Не задан Application API ключ — добавьте на странице **Application API** |
| Консоль не подключается (`Connecting…`) | Домен не в `allowed_origins` Wings |
| Не открывается на LAN-IP | Добавьте свой хост в `allowedDevOrigins` в `next.config.ts` |

---

## Команды

```bash
npm run dev      # разработка
npm run build    # production-сборка
npm run start    # запуск собранного приложения
npm run lint     # проверка ESLint
```
