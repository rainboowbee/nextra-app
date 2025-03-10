import { Readable } from 'stream';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, body } = req.body;
    const { mode } = body || { mode: 'task-help' };

    // Формируем системный промпт на основе режима
    let systemPrompt = mode === 'code-analysis'
      ? `Ты эксперт-программист, который помогает анализировать код на python и находить в нем ошибки. 
         Объясняй решения шаг за шагом, указывай на возможные улучшения и оптимизации.
         Пиши ответы на русском языке. Используй конкретные примеры, если это поможет пояснить материал.
         
         Важно: Всегда форматируй код в блоках кода, используя тройные обратные кавычки с указанием языка.
         После блока кода ОБЯЗАТЕЛЬНО добавляй пустую строку перед продолжением текста.
         
         Пример правильного форматирования:
         \`\`\`python
         def example():
             return "Hello"
         \`\`\`

         Это пояснение к коду.
         
         \`\`\`python
         def another():
             return "World"
         \`\`\`

         И это следующее пояснение.`
      : `Ты эксперт по информатике, который помогает ученикам с подготовкой к ЕГЭ и ОГЭ.
         Объясняй решения шаг за шагом.
         Пиши ответы на русском языке. Используй конкретные примеры, если это поможет пояснить материал.
         
         Важно: Всегда форматируй код в блоках кода, используя тройные обратные кавычки с указанием языка.
         После блока кода ОБЯЗАТЕЛЬНО добавляй пустую строку перед продолжением текста.
         
         Пример правильного форматирования:
         \`\`\`python
         def example():
             return "Hello"
         \`\`\`

         Это пояснение к коду.
         
         \`\`\`python
         def another():
             return "World"
         \`\`\`

         И это следующее пояснение.`;

    // Подготовка сообщений для API
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter((msg) => msg.id !== 'welcome').map(msg => ({
        role: msg.role,
        content: msg.content
      })),
    ];

    // Настраиваем заголовки для стриминга
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Отправляем запрос в Together AI
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
        messages: apiMessages,
        temperature: 0.7,
        stream: false, // Получаем полный ответ, а не поток
      }),
    });

    if (!response.ok) {
      res.write(`data: {"error": "Ошибка API: ${response.status} ${response.statusText}"}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Получаем полный JSON-ответ
    const result = await response.json();

    if (!result.choices || result.choices.length === 0) {
      res.write('data: {"error": "Не удалось получить ответ от AI"}\n\n');
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Извлекаем текст ответа
    let content = result.choices[0].message?.content || '';
    
    // Форматируем текст в стиле MDX
    content = content
      // Убираем множественные пробелы между словами (только в обычном тексте)
      .replace(/```[\s\S]*?```/g, match => {
        // Сохраняем блоки кода без изменений
        return `<<<CODE>>>${match}<<<CODE>>>`;
      })
      .replace(/[ \t]+/g, ' ')
      // Возвращаем блоки кода
      .replace(/<<<CODE>>>([\s\S]*?)<<<CODE>>>/g, '$1')
      // Убираем множественные переносы строк (оставляем максимум два)
      .replace(/\n{3,}/g, '\n\n')
      // Убираем пустые строки перед блоками кода
      .replace(/\n+```/g, '\n```')
      // Убираем лишние пустые строки после блоков кода
      .replace(/```\n+/g, '```\n')
      // Исправляем случаи, когда нет закрывающих кавычек
      .replace(/```(\w+)\n([^]*?)(?=```|$)/g, (match, lang, code) => {
        if (!match.endsWith('```')) {
          // Сохраняем оригинальные отступы в коде
          return `\`\`\`${lang}\n${code}\`\`\`\n`;
        }
        return match;
      })
      // Убираем пробелы в конце строк (только в обычном тексте)
      .replace(/```[\s\S]*?```/g, match => {
        return `<<<CODE>>>${match}<<<CODE>>>`;
      })
      .replace(/[ \t]+$/gm, '')
      .replace(/<<<CODE>>>([\s\S]*?)<<<CODE>>>/g, '$1')
      // Убираем пустые строки в начале и конце текста
      .trim();

    // Разбиваем текст на сегменты, сохраняя форматирование MDX
    const segments = [];
    let currentPos = 0;
    const codeBlockRegex = /```(\w+)\n([\s\S]*?)```\n/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Добавляем текст до блока кода
      if (match.index > currentPos) {
        const text = content.substring(currentPos, match.index).trim();
        if (text) {
          // Форматируем текстовый сегмент
          const formattedText = text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line)
            .join('\n');
          
          segments.push({
            type: 'text',
            content: formattedText + '\n\n'
          });
        }
      }
      
      // Добавляем блок кода, сохраняя оригинальное форматирование
      const [fullMatch, lang, code] = match;
      segments.push({
        type: 'code',
        content: `\`\`\`${lang}\n${code}\`\`\`\n`
      });
      
      currentPos = match.index + match[0].length;
    }
    
    // Отправляем сегменты
    for (const segment of segments) {
      res.write(`data: ${JSON.stringify({ content: segment.content })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Ошибка обработчика:', error);
    res.write(`data: {"error": "Произошла ошибка: ${error.message}"}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}