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
         Например:
         \`\`\`python
         print("Hello World")
         # Выведет Hello world
         \`\`\`

         Или

         \`\`\`python
         mystring = "   Hello World   "
         print(mystring)
         # вывод:   Hello World
         \`\`\`
         
         Не забывай указывать язык программирования после открывающих обратных кавычек. Так же не ставь лишние пустые строки между кодом.`
      : `Ты эксперт по информатике, который помогает ученикам с подготовкой к ЕГЭ и ОГЭ.
         Объясняй решения шаг за шагом
         Пиши ответы на русском языке. Используй конкретные примеры, если это поможет пояснить материал.
         
         Важно: Всегда форматируй код в блоках кода, используя тройные обратные кавычки с указанием языка.
         Например:
         \`\`\`python
         print("Hello World")
         \`\`\`

         Или

         \`\`\`python
         mystring = "   Hello World   "
         print(mystring)
         # вывод:   Hello World
         \`\`\`
         
         Не забывай указывать язык программирования после открывающих обратных кавычек. Так же не ставь лишние пустые строки между кодом.`;

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
    const content = result.choices[0].message?.content || '';

    // Разбиваем контент на части и отправляем по одной (имитация стриминга)
    const chunkSize = 4; // Размер чанка
    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk = content.slice(i, i + chunkSize);
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      
      // Добавляем небольшую задержку для имитации потоковой передачи
      await new Promise(resolve => setTimeout(resolve, 10));
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