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
    // MCP SDK требует Node.js ServerResponse методы
    let responseSent = false;
    let statusCode = 200;
    const headers: Record<string, string> = {};
    
    const adapterResponse = {
      status: (code: number) => {
        statusCode = code;
        return adapterResponse;
      },
      statusCode: statusCode,
      writeHead: (code: number, headersObj?: Record<string, string> | string[]) => {
        if (!responseSent) {
          statusCode = code;
          if (headersObj) {
            if (Array.isArray(headersObj)) {
              // Массив заголовков [name, value, name2, value2, ...]
              for (let i = 0; i < headersObj.length; i += 2) {
                headers[headersObj[i] as string] = headersObj[i + 1] as string;
              }
            } else {
              // Объект заголовков
              Object.assign(headers, headersObj);
            }
          }
        }
        return adapterResponse;
      },
      setHeader: (name: string, value: string) => {
        if (!responseSent) {
          headers[name] = value;
        }
        return adapterResponse;
      },
      getHeader: (name: string) => {
        return headers[name] || c.req.header(name) || undefined;
      },
      removeHeader: (name: string) => {
        delete headers[name];
      },
      write: (chunk: any) => {
        // Для streaming ответов
        return true;
      },
      end: (chunk?: any) => {
        if (!responseSent) {
          responseSent = true;
          // Устанавливаем headers через Hono context
          Object.entries(headers).forEach(([name, value]) => {
            c.header(name, value);
          });
          if (chunk) {
            return c.text(String(chunk), statusCode as any);
          }
          return new Response(null, { status: statusCode });
        }
        return adapterResponse;
      },
      json: (data: any) => {
        if (!responseSent) {
          responseSent = true;
          // Устанавливаем headers через Hono context
          Object.entries(headers).forEach(([name, value]) => {
            c.header(name, value);
          });
          return c.json(data, statusCode as any);
        }
        return adapterResponse;
      },
      send: (data: any) => {
        if (!responseSent) {
          responseSent = true;
          // Устанавливаем headers через Hono context
          Object.entries(headers).forEach(([name, value]) => {
            c.header(name, value);
          });
          return c.text(String(data), statusCode as any);
        }
        return adapterResponse;
      },
      headersSent: responseSent,
      on: (event: string, handler: () => void) => {
        // В serverless окружении события не поддерживаются
        return adapterResponse;
      },
      once: (event: string, handler: () => void) => {
        return adapterResponse;
      },
      removeListener: () => adapterResponse,
      emit: () => false
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
