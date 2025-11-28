# Инструкция по подключению к Vue Prime MCP Server

## Режим работы: HTTP (сетевой)

Сервер работает как HTTP сервер и доступен по сети.

## Шаг 1: Установка зависимостей и сборка

```bash
# Установите зависимости
pnpm install

# Соберите проект
pnpm run build
```

## Шаг 2: Запуск сервера

### Разработка

```bash
pnpm run dev
```

### Продакшн

```bash
pnpm start
```

Сервер запустится на `http://localhost:3000` по умолчанию.

Вы можете изменить порт и хост через переменные окружения:

```bash
PORT=8080 HOST=0.0.0.0 pnpm start
```

## Шаг 3: Проверка работы сервера

### Health Check

```bash
curl http://localhost:3000/health
```

Ответ:
```json
{
  "status": "ok",
  "service": "vue-prime-mcp"
}
```

### Информация о сервере

```bash
curl http://localhost:3000/
```

Ответ содержит информацию о доступных ресурсах и инструментах.

## Шаг 4: Подключение MCP клиентов

### Claude Desktop (HTTP режим)

Для подключения через HTTP добавьте в конфигурацию Claude Desktop:

#### Linux

```bash
nano ~/.config/Claude/claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

#### macOS

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

#### Windows

```
%APPDATA%\Claude\claude_desktop_config.json
```

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Удаленное подключение

Если сервер запущен на удаленной машине, используйте IP адрес или доменное имя:

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://192.168.1.100:3000/mcp"
    }
  }
}
```

## Шаг 5: Тестирование MCP запросов

### Пример запроса через curl

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### Пример получения списка инструментов

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

### Пример вызова инструмента

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "get-primevue-component",
      "arguments": {
        "componentName": "menu"
      }
    }
  }'
```

## Использование с другими MCP клиентами

### MCP Client SDK (TypeScript/JavaScript)

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { HTTPClientTransport } from '@modelcontextprotocol/sdk/client/http.js';

const transport = new HTTPClientTransport({
  url: 'http://localhost:3000/mcp'
});

const client = new Client({
  name: 'example-client',
  version: '1.0.0'
});

await client.connect(transport);

// Использование инструментов
const result = await client.callTool({
  name: 'get-primevue-component',
  arguments: {
    componentName: 'menu'
  }
});
```

### Python MCP Client

```python
import requests

url = "http://localhost:3000/mcp"

# Список инструментов
response = requests.post(url, json={
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
})

print(response.json())
```

## Переменные окружения

- `PORT` - Порт для HTTP сервера (по умолчанию: 3000)
- `HOST` - Хост для HTTP сервера (по умолчанию: 0.0.0.0)

Пример:

```bash
PORT=8080 HOST=127.0.0.1 pnpm start
```

## Безопасность

⚠️ **Важно**: По умолчанию сервер слушает на всех интерфейсах (0.0.0.0). Для продакшн использования:

1. Используйте обратный прокси (nginx, Caddy) с SSL/TLS
2. Настройте файрвол для ограничения доступа
3. Рассмотрите добавление аутентификации

### Пример с nginx

```nginx
server {
    listen 443 ssl;
    server_name mcp.example.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location /mcp {
        proxy_pass http://localhost:3000/mcp;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Устранение проблем

### Сервер не запускается

1. Проверьте, что порт не занят:
   ```bash
   lsof -i :3000
   # или
   netstat -tulpn | grep 3000
   ```

2. Измените порт через переменную окружения:
   ```bash
   PORT=3001 pnpm start
   ```

### Ошибки подключения

1. Проверьте, что сервер запущен:
   ```bash
   curl http://localhost:3000/health
   ```

2. Проверьте файрвол:
   ```bash
   sudo ufw allow 3000
   ```

3. Проверьте логи сервера на наличие ошибок

### CORS ошибки

Если вы подключаетесь из браузера, может потребоваться настроить CORS. Добавьте в код:

```typescript
import cors from 'cors';
app.use(cors());
```

И установите пакет:
```bash
pnpm add cors
pnpm add -D @types/cors
```

## Мониторинг

### Health Check

Используйте `/health` endpoint для мониторинга:

```bash
# Проверка каждые 30 секунд
watch -n 30 'curl -s http://localhost:3000/health'
```

### Логи

Сервер выводит логи в консоль. Для продакшн использования рассмотрите использование системы логирования (winston, pino).

## Развертывание

### PM2

```bash
pnpm add -g pm2
pm2 start dist/index.js --name vue-prime-mcp
pm2 save
pm2 startup
```

### Docker

Создайте `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Сборка и запуск:

```bash
docker build -t vue-prime-mcp .
docker run -p 3000:3000 vue-prime-mcp
```
