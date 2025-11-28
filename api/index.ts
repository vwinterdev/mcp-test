import { Hono } from 'hono';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import server from '../src/mcp.js';

// Настройка Hono приложения для Vercel
const app = new Hono();

// Современный Streamable HTTP endpoint
app.all('/mcp', async (c) => {
  try {
    // Создаем новый transport для каждого запроса (stateless режим)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    // Подключаем сервер к transport
    await server.connect(transport);
    
    // Получаем body запроса
    const body = await c.req.json().catch(() => ({}));
    
    // Создаем адаптер для работы с Web Request/Response
    // MCP SDK ожидает Node.js объекты, но мы можем адаптировать их
    const webRequest = c.req.raw;
    
    // Создаем адаптер response который работает с Hono context
    let responseSent = false;
    const adapterResponse = {
      status: (code: number) => ({
        json: (data: any) => {
          if (!responseSent) {
            responseSent = true;
            return c.json(data, { status: code as any });
          }
          return c;
        },
        send: (data: any) => {
          if (!responseSent) {
            responseSent = true;
            return c.text(String(data), { status: code as any });
          }
          return c;
        },
        end: () => {
          if (!responseSent) {
            responseSent = true;
            return new Response(null, { status: code });
          }
          return c;
        }
      }),
      json: (data: any) => {
        if (!responseSent) {
          responseSent = true;
          return c.json(data);
        }
        return c;
      },
      send: (data: any) => {
        if (!responseSent) {
          responseSent = true;
          return c.text(String(data));
        }
        return c;
      },
      setHeader: (name: string, value: string) => {
        // Headers устанавливаются через Hono
        return adapterResponse;
      },
      getHeader: (name: string) => {
        return c.req.header(name) || undefined;
      },
      headersSent: responseSent,
      on: () => adapterResponse // В serverless окружении события не поддерживаются
    };

    // Обрабатываем запрос через MCP transport
    await transport.handleRequest(webRequest as any, adapterResponse as any, body);
    
    // Если transport не отправил ответ, возвращаем пустой ответ
    if (!responseSent) {
      return new Response(null, { status: 200 });
    }
    
    // Ответ уже отправлен через adapterResponse
    return c.body(null, 200);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    return c.json({
      jsonrpc: '2.0',
      error: {
        code: -32603,
        message: 'Internal server error',
        data: error instanceof Error ? error.message : 'Unknown error'
      },
      id: null
    }, 500);
  }
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    service: 'vue-prime-mcp', 
    platform: 'vercel',
    runtime: 'nodejs'
  });
});

// Информация о сервере
app.get('/', (c) => {
  return c.json({
    name: 'Vue Prime MCP Server',
    version: '1.0.0',
    description: 'MCP server for PrimeVue documentation',
    platform: 'Vercel',
    endpoints: {
      mcp: '/mcp',
      health: '/health'
    },
    resources: [
      'primevue://llms-txt',
      'primevue://llms-full-txt',
      'primevue://component/{componentName}'
    ],
    tools: [
      'get-primevue-component',
      'get-primevue-llms-txt',
      'get-primevue-llms-full-txt',
      'search-primevue-docs'
    ]
  });
});

// Экспорт handler для Vercel
// Vercel автоматически использует экспорт по умолчанию
export default app;
