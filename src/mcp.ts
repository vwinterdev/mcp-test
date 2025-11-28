import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { loadComponentDoc, loadLlmsFullTxt, loadLlmsTxt } from "./resurs.js";
import { z } from 'zod';

const server = new McpServer(
    {
      name: 'vue-prime-mcp',
      version: '1.0.0'
    }
);

// Регистрируем ресурс для llms.txt (структурированный список ключевых страниц)
server.registerResource(
    'primevue-llms-txt',
    new ResourceTemplate('primevue://llms-txt', { list: undefined }),
    {
      title: 'PrimeVue LLMs.txt',
      description: 'Структурированный список ключевых страниц документации PrimeVue (llms.txt)'
    },
    async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: await loadLlmsTxt()
          }
        ]
    })
  );
  

// Регистрируем ресурс для llms-full.txt (полная документация)
server.registerResource(
    'primevue-llms-full-txt',
    new ResourceTemplate('primevue://llms-full-txt', { list: undefined }),
    {
      title: 'PrimeVue LLMs Full Documentation',
      description: 'Полная документация PrimeVue (llms-full.txt)'
    },
    async (uri) => ({
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: await loadLlmsFullTxt()
          }
        ]
    })
);

// Регистрируем ресурс для документации компонента в формате Markdown
server.registerResource(
    'primevue-component',
    new ResourceTemplate('primevue://component/{componentName}', { 
      list: undefined 
    }),
    {
      title: 'PrimeVue Component Documentation',
      description: 'Документация компонента PrimeVue в формате Markdown'
    },
    async (uri, { componentName }) => {
        let accText = '';
        if(Array.isArray(componentName)) {
            for(const name of componentName) {
                accText += await loadComponentDoc(name);
            }
        } else {
            accText = await loadComponentDoc(componentName);
        }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: accText
          }
        ]
      }
    }
  );

// Регистрируем инструмент для получения документации компонента
server.registerTool(
    'get-primevue-component',
    {
      title: 'Get PrimeVue Component Documentation',
      description: 'Получает документацию конкретного компонента PrimeVue в формате Markdown из https://primevue.org/llms/components/{component}.md',
      inputSchema: {
        componentName: z.string().describe('Название компонента PrimeVue (например: menu, button, datatable, dialog). Имя должно быть в нижнем регистре.')
      },
      outputSchema: {
        success: z.boolean(),
        componentName: z.string(),
        content: z.string().optional(),
        error: z.string().optional()
      }
    },
    async ({ componentName }) => {
      try {
        const content = await loadComponentDoc(componentName);
        const output = {
          success: true,
          componentName,
          content
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const output = {
          success: false,
          componentName,
          error: errorMessage
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      }
    }
  );
  
  // Регистрируем инструмент для получения llms.txt
  server.registerTool(
    'get-primevue-llms-txt',
    {
      title: 'Get PrimeVue LLMs.txt',
      description: 'Получает структурированный список ключевых страниц документации PrimeVue из https://primevue.org/llms/llms.txt',
      inputSchema: {},
      outputSchema: {
        success: z.boolean(),
        content: z.string().optional(),
        error: z.string().optional()
      }
    },
    async () => {
      try {
        const content = await loadLlmsTxt();
        console.log({ content });
        const output = {
          success: true,
          content
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const output = {
          success: false,
          error: errorMessage
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      }
    }
  );
  
  // Регистрируем инструмент для получения llms-full.txt
  server.registerTool(
    'get-primevue-llms-full-txt',
    {
      title: 'Get PrimeVue LLMs Full Documentation',
      description: 'Получает полную документацию PrimeVue из https://primevue.org/llms/llms-full.txt',
      inputSchema: {},
      outputSchema: {
        success: z.boolean(),
        content: z.string().optional(),
        error: z.string().optional()
      }
    },
    async () => {
      try {
        const content = await loadLlmsFullTxt();
        const output = {
          success: true,
          content
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const output = {
          success: false,
          error: errorMessage
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      }
    }
  );
  
  // Регистрируем инструмент для поиска в документации
  server.registerTool(
    'search-primevue-docs',
    {
      title: 'Search PrimeVue Documentation',
      description: 'Ищет информацию в полной документации PrimeVue (llms-full.txt) по ключевому слову или фразе',
      inputSchema: {
        query: z.string().describe('Поисковый запрос (ключевое слово или фраза)')
      },
      outputSchema: {
        found: z.boolean(),
        matches: z.array(z.string()).optional(),
        excerpt: z.string().optional(),
        error: z.string().optional()
      }
    },
    async ({ query }) => {
      try {
        const docs = await loadLlmsFullTxt();
        const queryLower = query.toLowerCase();
        const lines = docs.split('\n');
        
        const matches: string[] = [];
        let excerpt = '';
        
        // Ищем строки, содержащие запрос
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].toLowerCase().includes(queryLower)) {
            matches.push(lines[i]);
            // Берем контекст вокруг найденной строки
            if (!excerpt) {
              const start = Math.max(0, i - 2);
              const end = Math.min(lines.length, i + 3);
              excerpt = lines.slice(start, end).join('\n');
            }
            // Ограничиваем количество совпадений
            if (matches.length >= 10) {
              break;
            }
          }
        }
        
        const output = {
          found: matches.length > 0,
          matches: matches.length > 0 ? matches.slice(0, 10) : undefined,
          excerpt: excerpt || undefined
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2)
            }
          ],
          structuredContent: output
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                found: false,
                error: errorMessage
              }, null, 2)
            }
          ],
          structuredContent: {
            found: false,
            error: errorMessage
          }
        };
      }
    }
  );
  
  // Регистрируем промпт для работы с PrimeVue
  server.registerPrompt(
    'primevue-help',
    {
      title: 'PrimeVue Help Prompt',
      description: 'Создает промпт для получения помощи по PrimeVue',
      argsSchema: {
        topic: z.string().optional().describe('Конкретная тема или вопрос о PrimeVue')
      }
    },
    ({ topic }) => {
      const basePrompt = `Ты помощник по PrimeVue - библиотеке компонентов для Vue.js.
  Используй документацию PrimeVue для ответа на вопросы.
  ${topic ? `Пользователь спрашивает о: ${topic}` : 'Помоги пользователю с PrimeVue.'}
  
  Документация PrimeVue доступна через:
  - Ресурс primevue://llms-txt для структурированного списка ключевых страниц
  - Ресурс primevue://llms-full-txt для полной документации
  - Ресурс primevue://component/{componentName} для документации конкретного компонента в Markdown
  - Инструменты для получения документации и поиска.`;
  
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: basePrompt
            }
          }
        ]
      };
    }
  );
  
export default server;