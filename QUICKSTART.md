# Быстрый старт - HTTP режим

## 1. Установите зависимости

```bash
pnpm install
```

## 2. Соберите проект

```bash
pnpm run build
```

## 3. Запустите сервер

```bash
pnpm start
```

Сервер запустится на `http://localhost:3000`

## 4. Проверьте работу

```bash
# Health check
curl http://localhost:3000/health

# Информация о сервере
curl http://localhost:3000/
```

## 5. Подключите Claude Desktop

Добавьте в конфигурацию Claude Desktop:

**Linux:** `~/.config/Claude/claude_desktop_config.json`  
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Перезапустите Claude Desktop.

## 6. Готово! 🎉

Теперь вы можете использовать инструменты PrimeVue в Claude Desktop.

## Изменение порта

```bash
PORT=8080 pnpm start
```

## Удаленное подключение

Если сервер на другой машине (например, `192.168.1.100`):

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://192.168.1.100:3000/mcp"
    }
  }
}
```

**Подробная документация:** [CONNECTION.md](./CONNECTION.md)

