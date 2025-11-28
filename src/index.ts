#!/usr/bin/env node

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import server from './mcp.js';
import express, { type Request, type Response } from 'express';

// Настройка HTTP сервера
const app = express();
app.use(express.json());

// Современный Streamable HTTP endpoint
// POST для клиент-серверных запросов
app.post('/mcp', async (req: Request, res: Response) => {
  try {
    console.log('MCP POST request received');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    // Создаем новый transport для каждого запроса (stateless режим)
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true
    });

    // Закрываем transport при закрытии соединения
    res.on('close', () => {
      console.log('Connection closed');
      transport.close();
    });

    // Подключаем сервер к transport
    await server.connect(transport);
    console.log('Server connected to transport');
    
    // Обрабатываем запрос через MCP transport
    // Transport сам отправит ответ через res
    await transport.handleRequest(req, res, req.body);
    console.log('Request handled, headers sent:', res.headersSent);
  } catch (error) {
    console.error('Error handling MCP request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
          data: error instanceof Error ? error.message : 'Unknown error'
        },
        id: null
      });
    }
  }
});

// GET для информации о сервере
app.get('/mcp', async (req: Request, res: Response) => {
  try {
    console.log('MCP GET request received');
    
    // Для stateless режима GET запросы не поддерживаются
    // Но можем вернуть информацию о сервере
    res.json({
      jsonrpc: '2.0',
      result: {
        server: 'vue-prime-mcp',
        version: '1.0.0',
        note: 'This server uses stateless mode. Use POST /mcp for requests.'
      },
      id: null
    });
  } catch (error) {
    console.error('Error handling MCP GET request:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'vue-prime-mcp' });
});

// Информация о сервере
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Vue Prime MCP Server',
    version: '1.0.0',
    description: 'MCP server for PrimeVue documentation',
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

// Запуск HTTP сервера
const port = parseInt(process.env.PORT || '3000');
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`PrimeVue MCP Server running on http://${host}:${port}`);
  console.log(`Streamable HTTP endpoint: http://${host}:${port}/mcp`);
  console.log(`Health check: http://${host}:${port}/health`);
}).on('error', (error: Error) => {
  console.error('Server error:', error);
  process.exit(1);
});
