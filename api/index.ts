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
    const responseHeaders: Record<string, string> = {};
    let responseBody: any = null;
    let responseType: 'json' | 'text' | 'empty' = 'empty' as 'json' | 'text' | 'empty';
    
    const adapterResponse = {
      status: (code: number) => {
        statusCode = code;
        return adapterResponse;
      },
      statusCode: statusCode,
      writeHead: (code: number, headersObj?: Record<string, string> | string[]) => {
        console.log('adapterResponse.writeHead called, code:', code, 'headers:', headersObj);
        if (!responseSent) {
          statusCode = code;
          if (headersObj) {
            if (Array.isArray(headersObj)) {
              // Массив заголовков [name, value, name2, value2, ...]
              for (let i = 0; i < headersObj.length; i += 2) {
                responseHeaders[headersObj[i] as string] = headersObj[i + 1] as string;
              }
            } else {
              // Объект заголовков
              Object.assign(responseHeaders, headersObj);
            }
          }
        }
        return adapterResponse;
      },
      setHeader: (name: string, value: string) => {
        if (!responseSent) {
          responseHeaders[name] = value;
        }
        return adapterResponse;
      },
      getHeader: (name: string) => {
        return responseHeaders[name] || c.req.header(name) || undefined;
      },
      removeHeader: (name: string) => {
        delete responseHeaders[name];
      },
      write: (chunk: any) => {
        if (!responseSent) {
          if (responseBody === null) {
            responseBody = '';
          }
          responseBody += String(chunk);
          responseType = 'text';
        }
        return true;
      },
      end: (chunk?: any) => {
        console.log('adapterResponse.end called, chunk:', chunk ? String(chunk).substring(0, 200) : 'undefined');
        if (!responseSent) {
          responseSent = true;
          if (chunk !== undefined) {
            responseBody = String(chunk);
            responseType = 'text';
          }
        }
        return adapterResponse;
      },
      json: (data: any) => {
        console.log('adapterResponse.json called with:', JSON.stringify(data).substring(0, 200));
        if (!responseSent) {
          responseSent = true;
          responseBody = data;
          responseType = 'json';
        }
        return adapterResponse;
      },
      send: (data: any) => {
        if (!responseSent) {
          responseSent = true;
          responseBody = String(data);
          responseType = 'text';
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
    console.log('Calling transport.handleRequest with body:', JSON.stringify(body, null, 2));
    await transport.handleRequest(webRequest as any, adapterResponse as any, body);
    console.log('transport.handleRequest completed, responseSent:', responseSent, 'responseType:', responseType, 'statusCode:', statusCode);
    
    // Отправляем ответ на основе того, что было установлено в адаптере
    if (responseSent) {
      console.log('Sending response, type:', responseType, 'body length:', responseBody ? JSON.stringify(responseBody).length : 0);
      // Устанавливаем все заголовки
      Object.entries(responseHeaders).forEach(([name, value]) => {
        c.header(name, value);
      });
      
      // Отправляем ответ в зависимости от типа
      if (responseType === 'json') {
        return c.json(responseBody, statusCode as any);
      } else if (responseType === 'text') {
        return c.text(responseBody || '', statusCode as any);
      } else {
        return new Response(null, { status: statusCode, headers: responseHeaders });
      }
    }
    
    // Если transport не отправил ответ, возвращаем пустой ответ
    return new Response(null, { status: 200 });
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
