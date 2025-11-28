# Деплой на Vercel

## Быстрый старт

1. **Установите Vercel CLI** (если еще не установлен):
   ```bash
   npm i -g vercel
   ```

2. **Войдите в Vercel**:
   ```bash
   vercel login
   ```

3. **Деплой**:
   ```bash
   vercel
   ```

   Или для продакшн:
   ```bash
   vercel --prod
   ```

## Структура проекта

- `api/index.ts` - Serverless функция для Vercel
- `src/index.ts` - Локальный сервер (для разработки)
- `vercel.json` - Конфигурация Vercel

## Endpoints на Vercel

После деплоя ваши endpoints будут доступны по адресу:
- `https://your-project.vercel.app/api/mcp` - Основной MCP endpoint
- `https://your-project.vercel.app/api/health` - Health check
- `https://your-project.vercel.app/api/` - Информация о сервере

## Ограничения

- **Таймаут**: Максимальное время выполнения функции - 30 секунд (настроено в `vercel.json`). Для Pro плана можно увеличить до 60 секунд.

- **Холодный старт**: Первый запрос после периода бездействия может быть медленнее из-за холодного старта.

## Переменные окружения

Если нужно добавить переменные окружения:

1. Через Vercel Dashboard:
   - Settings → Environment Variables

2. Через CLI:
   ```bash
   vercel env add VARIABLE_NAME
   ```

## Локальная разработка

Для локальной разработки используйте:

```bash
pnpm run dev
```

Это запустит локальный сервер на `http://localhost:3000` с полной поддержкой всех функций.

## Тестирование на Vercel

После деплоя проверьте работу:

```bash
# Health check
curl https://your-project.vercel.app/api/health

# MCP endpoint
curl -X POST https://your-project.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'
```

## Обновление кода

После изменений в коде:

```bash
# Деплой изменений
vercel --prod
```

Или настройте автоматический деплой через GitHub/GitLab интеграцию в Vercel Dashboard.

## Мониторинг

Логи доступны в Vercel Dashboard:
- Deployments → выберите деплой → Functions → Logs

## Troubleshooting

### Ошибка "Module not found"
Убедитесь, что все зависимости указаны в `package.json` и установлены.

### Таймаут запросов
Увеличьте `maxDuration` в `vercel.json` (максимум зависит от вашего плана).

### Проблемы с импортами
Убедитесь, что пути импортов правильные и используются `.js` расширения для ESM модулей.

