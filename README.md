# Vue Prime MCP Server

MCP сервер для доступа к документации PrimeVue через Model Context Protocol.

## Возможности

Сервер предоставляет доступ к трем основным эндпоинтам документации PrimeVue:

1. **`/llms.txt`** - Структурированный список ключевых страниц документации (индустриальный стандарт для помощи AI моделям)
2. **`/llms-full.txt`** - Полная документация PrimeVue со всеми страницами
3. **`/components/{component}.md`** - Документация конкретного компонента в формате Markdown

### Ресурсы

- `primevue://llms-txt` - Структурированный список ключевых страниц из `https://primevue.org/llms/llms.txt`
- `primevue://llms-full-txt` - Полная документация из `https://primevue.org/llms/llms-full.txt`
- `primevue://component/{componentName}` - Документация компонента из `https://primevue.org/llms/components/{component}.md`

### Инструменты

#### `get-primevue-component`

Получает документацию конкретного компонента PrimeVue в формате Markdown.

**Параметры:**
- `componentName` (string) - Название компонента в нижнем регистре (например: "menu", "button", "datatable")

**Пример:**
```json
{
  "componentName": "menu"
}
```

**Эндпоинт:** `https://primevue.org/llms/components/menu.md`

#### `get-primevue-llms-txt`

Получает структурированный список ключевых страниц документации PrimeVue.

**Параметры:** Нет

**Эндпоинт:** `https://primevue.org/llms/llms.txt`

#### `get-primevue-llms-full-txt`

Получает полную документацию PrimeVue.

**Параметры:** Нет

**Эндпоинт:** `https://primevue.org/llms/llms-full.txt`

#### `search-primevue-docs`

Ищет информацию в полной документации PrimeVue по ключевому слову или фразе.

**Параметры:**
- `query` (string) - Поисковый запрос

**Пример:**
```json
{
  "query": "Button component"
}
```

### Промпты

#### `primevue-help`

Создает промпт для получения помощи по PrimeVue.

**Параметры:**
- `topic` (string, опционально) - Конкретная тема или вопрос

## Установка

```bash
pnpm install
```

## Сборка

```bash
pnpm run build
```

## Запуск

### Разработка

```bash
pnpm run dev
```

### Продакшн

```bash
pnpm start
```

## Использование с MCP клиентами

### Режим работы: HTTP (сетевой)

Сервер работает как HTTP сервер и доступен по сети на порту 3000 (по умолчанию).

### Быстрый старт

1. **Установите зависимости и соберите проект:**
   ```bash
   pnpm install
   pnpm run build
   ```

2. **Запустите сервер:**
   ```bash
   pnpm start
   # или для разработки
   pnpm run dev
   ```

3. **Проверьте работу:**
   ```bash
   curl http://localhost:3000/health
   ```

4. **Подключите MCP клиент** (см. инструкции ниже)

### Claude Desktop (HTTP режим)

#### Linux

1. Создайте или откройте файл конфигурации:
   ```bash
   mkdir -p ~/.config/Claude
   nano ~/.config/Claude/claude_desktop_config.json
   ```

2. Добавьте конфигурацию:
   ```json
   {
     "mcpServers": {
       "vue-prime-mcp": {
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

3. Убедитесь, что сервер запущен, и перезапустите Claude Desktop

#### macOS

1. Создайте или откройте файл конфигурации:
   ```bash
   mkdir -p ~/Library/Application\ Support/Claude
   open ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. Добавьте конфигурацию:
   ```json
   {
     "mcpServers": {
       "vue-prime-mcp": {
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

3. Убедитесь, что сервер запущен, и перезапустите Claude Desktop

#### Windows

1. Откройте файл конфигурации:
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. Добавьте конфигурацию:
   ```json
   {
     "mcpServers": {
       "vue-prime-mcp": {
         "url": "http://localhost:3000/mcp"
       }
     }
   }
   ```

3. Убедитесь, что сервер запущен, и перезапустите Claude Desktop

### Удаленное подключение

Если сервер запущен на другой машине, используйте IP адрес:

```json
{
  "mcpServers": {
    "vue-prime-mcp": {
      "url": "http://192.168.1.100:3000/mcp"
    }
  }
}
```

### Настройка порта и хоста

Измените порт и хост через переменные окружения:

```bash
PORT=8080 HOST=0.0.0.0 pnpm start
```

### Endpoints

- `POST /mcp` - Основной MCP endpoint для Streamable HTTP
- `GET /mcp` - Информация о сервере (для GET запросов)
- `GET /health` - Health check endpoint
- `GET /` - Информация о сервере и доступных ресурсах/инструментах

**Подробная инструкция:** См. файл [CONNECTION.md](./CONNECTION.md)

## Эндпоинты PrimeVue

Сервер использует следующие официальные эндпоинты PrimeVue:

- **llms.txt**: `https://primevue.org/llms/llms.txt` - Структурированный список ключевых страниц для AI моделей
- **llms-full.txt**: `https://primevue.org/llms/llms-full.txt` - Полная документация
- **Component Markdown**: `https://primevue.org/llms/components/{component}.md` - Документация компонента в Markdown

Добавление `.md` к URL страницы возвращает Markdown версию этой страницы.

## Кэширование

Сервер кэширует загруженную документацию для быстрого доступа:
- `llms.txt` кэшируется после первой загрузки
- `llms-full.txt` кэшируется после первой загрузки
- Документация компонентов кэшируется индивидуально

## Разработка

Проект использует TypeScript и компилируется в JavaScript. Исходный код находится в `src/`, скомпилированный код - в `dist/`.

## Деплой на Vercel

Проект готов к деплою на Vercel. Подробные инструкции см. в [VERCEL.md](./VERCEL.md).

### Быстрый деплой

```bash
# Установите Vercel CLI
npm i -g vercel

# Войдите
vercel login

# Деплой
vercel --prod
```

После деплоя endpoints будут доступны по адресу:
- `https://your-project.vercel.app/api/mcp` - Основной MCP endpoint
- `https://your-project.vercel.app/api/health` - Health check

**Примечание:** Сервер использует stateless режим - каждый запрос независим и не требует сессий.

## Лицензия

MIT
