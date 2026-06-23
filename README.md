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

### Как Dockge работает со сборкой

Dockge хранит все стеки в `/opt/dockge/stacks/<имя-стека>/`.
Когда в compose-файле указано `build: .`, Docker Compose ищет `Dockerfile` и исходники **в этой же папке**.
Поэтому недостаточно просто вставить compose-файл через веб-интерфейс — нужно, чтобы в папке стека лежали все файлы проекта.

### 1. Подготовка

Убедись, что на VPS установлены **Docker** и **Docker Compose**:

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Перенос файлов в папку стека

Dockge создаёт папку стека автоматически при первом деплое, но мы можем создать её сами и положить туда файлы проекта.

**Способ A — клонирование репозитория:**

Зайди на VPS по SSH и выполни:

```bash
mkdir -p /opt/dockge/stacks/ga-ru-redirect
cd /opt/dockge/stacks/ga-ru-redirect
git clone <url-твоего-репозитория> .
```

После этого в `/opt/dockge/stacks/ga-ru-redirect/` должны лежать:
```
Dockerfile
server.js
package.json
docker-compose.yml
.dockerignore
```

**Способ Б — ручное копирование через SCP:**

Скачай проект локально и скопируй файлы на VPS:

```bash
# У себя на машине
scp server.js Dockerfile docker-compose.yml package.json .dockerignore \
    user@<vps-ip>:/opt/dockge/stacks/ga-ru-redirect/
```

### 3. Запуск через Dockge

Теперь есть два пути:

**Вариант 1 (проще) — Dockge сам найдёт compose-файл:**

1. Открой веб-интерфейс Dockge (`http://<vps-ip>:5001`)
2. Нажми кнопку **Scan** (сканирование)
3. Dockge обнаружит compose-файл в `/opt/dockge/stacks/ga-ru-redirect/docker-compose.yml`
4. Нажми на появившийся стек и затем **Deploy**

Dockge соберёт образ и запустит контейнер.

**Вариант 2 — создать стек вручную:**

1. Нажми **+ Compose**
2. В поле *Compose name* введи `ga-ru-redirect`
3. Вставь содержимое `docker-compose.yml` в текстовое поле
4. Нажми **Deploy**

### 4. Настройка переменных (опционально)

Если нужно изменить ссылку редиректа — отредактируй `docker-compose.yml` (можно прямо через Dockge) и нажми Re-deploy. Пересобирать образ не нужно:

```yaml
environment:
  - REDIRECT_URL=https://твоя-ссылка
  - PORT=3000
```

### 5. Проксирование снаружи

Сервер проброшен на порт `80` (согласно `docker-compose.yml`: `"80:3000"`).
Домен `ga-ru.ru` должен указывать A-записью на IP твоего VPS.
Дополнительный обратный прокси не обязателен — сервер уже торчит на 80 порту.

Если понадобится HTTPS, удобнее всего Caddy:

```
ga-ru.ru {
    reverse_proxy localhost:8080
}
```

(тогда в `docker-compose.yml` поменяй `"80:3000"` на `"8080:3000"` и поставь Caddy отдельно)

### 6. Проверка

```bash
curl -I http://localhost/
# HTTP/1.1 302 Found
# Location: https://discord.com/invite/s6ZgA6S9xn

curl http://localhost/health
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
