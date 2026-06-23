# ga-ru-discord-redirect-server

Простейший Node.js HTTP-сервер, который редиректит любой запрос на заданную Discord-ссылку.  
Собран в Docker-контейнер, деплоится через Dockge.

## Как это работает

Сервер на любой запрос отдаёт HTTP `302 Found` с заголовком `Location`.  
Целевая ссылка и порт задаются через переменные окружения:

| Переменная      | Назначение                       | Значение по умолчанию                       |
|-----------------|----------------------------------|---------------------------------------------|
| `REDIRECT_URL`  | Куда редиректить                 | `https://discord.com/invite/s6ZgA6S9xn`     |
| `PORT`          | Порт, на котором слушает сервер  | `3000`                                      |

Также есть эндпоинт `/health`, возвращающий `200 OK` — удобно для проверки живости контейнера.

## Деплой на VPS через Dockge

### 1. Подготовка

Убедись, что на VPS установлены **Docker** и **Docker Compose**.

Dockge обычно уже предоставляет окружение с Docker, но если ставишь вручную:

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Загрузка проекта

На VPS клонируй репозиторий и зайди в папку:

```bash
git clone <url-твоего-репозитория> ga-ru-redirect
cd ga-ru-redirect
```

### 3. Настройка переменных (опционально)

Отредактируй `docker-compose.yml`, если нужно изменить ссылку редиректа или порт:

```yaml
environment:
  - REDIRECT_URL=https://твоя-ссылка
  - PORT=3000
```

### 4. Запуск через Dockge

1. Открой веб-интерфейс Dockge (обычно `http://<vps-ip>:5001`)
2. Нажми **+ Compose**
3. В поле *Compose name* введи `ga-ru-redirect`
4. Скопируй содержимое `docker-compose.yml` в текстовое поле
5. Нажми **Deploy**

Dockge сам соберёт образ и запустит контейнер.

### 5. Проксирование снаружи

Сервер слушает порт `3000` внутри контейнера.  
Чтобы привязать домен `ga-ru.ru`, настрой обратный прокси (nginx, Caddy, Traefik).

Пример для **Caddy** (файл `Caddyfile`):

```
ga-ru.ru {
    reverse_proxy localhost:3000
}
```

Пример для **nginx**:

```nginx
server {
    listen 80;
    server_name ga-ru.ru;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 6. Проверка

```bash
curl -I http://localhost:3000/
# HTTP/1.1 302 Found
# Location: https://discord.com/invite/s6ZgA6S9xn

curl http://localhost:3000/health
# ok
```

## Ручной запуск (без Dockge)

Если хочешь запустить напрямую через Docker Compose:

```bash
docker compose up -d --build
```

Остановка:

```bash
docker compose down
```

## Зависимости

Никаких. Сервер написан на встроенном модуле Node.js `http`, дополнительные npm-пакеты не нужны.
