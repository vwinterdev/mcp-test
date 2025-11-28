import Cache from "./cache.js"

// Функция для загрузки llms.txt (структурированный список ключевых страниц)
export const loadLlmsTxt = async () => {
    if (Cache.has('llmsTxt')) return Cache.get('llmsTxt') as string;
    try {
      const response = await fetch('https://primevue.org/llms/llms.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch llms.txt: ${response.statusText}`);
      }
      const text = await response.text();
      Cache.set('llmsTxt', text);
      return text;
    } catch (error) {
      console.error('Error loading llms.txt:', error);
      throw error;
    }
}

// Функция для загрузки llms-full.txt (полная документация)
export const loadLlmsFullTxt = async () => {
    if (Cache.has('llmsFullTxt')) return Cache.get('llmsFullTxt') as string;
    try {
      const response = await fetch('https://primevue.org/llms/llms-full.txt');
      if (!response.ok) {
        throw new Error(`Failed to fetch llms-full.txt: ${response.statusText}`);
      }
      const text = await response.text()
      Cache.set('llmsFullTxt', text);
      return text;
    } catch (error) {
      console.error('Error loading llms-full.txt:', error);
      throw error;
    }
}

// Функция для загрузки документации компонента в формате Markdown
export const loadComponentDoc = async (componentName: string) => {
    const normalizedName = componentName.toLowerCase();
    if (Cache.has(normalizedName)) return Cache.get(normalizedName)!;
    try {
      const url = `https://primevue.org/llms/components/${normalizedName}.md`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch component ${componentName}: ${response.statusText}`);
      }
      const text = await response.text();
      Cache.set(normalizedName, text);
      return text;
    } catch (error) {
      console.error(`Error loading component ${componentName}:`, error);
      throw error;
    }
}

