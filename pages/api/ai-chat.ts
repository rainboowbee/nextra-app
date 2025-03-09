import { TogetherAIStream, StreamingTextResponse } from 'ai';

// Для Next.js 13.0.6 не используем runtime: 'edge'
// и используем стандартный обработчик API

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Парсим тело запроса стандартным способом, а не через req.json()
    const { messages, body } = req.body;
    const { mode } = body || { mode: 'task-help' };
    
    // Формируем системный промпт на основе выбранного режима
    let systemPrompt = '';
    if (mode === 'code-analysis') {
      systemPrompt = `Ты эксперт-программист, который помогает анализировать код и находить в нем ошибки. 
      Объясняй решения шаг за шагом, указывай на возможные улучшения и оптимизации.
      Пиши ответы на русском языке. Используй конкретные примеры, если это поможет пояснить материал.`;
    } else {
      systemPrompt = `Ты эксперт по информатике, который помогает ученикам с подготовкой к ЕГЭ и ОГЭ.
      Объясняй решения шаг за шагом, ссылайся на соответствующие разделы учебной программы.
      Пиши ответы на русском языке. Используй конкретные примеры, если это поможет пояснить материал.`;
    }

    // Используем бесплатную модель из TogetherAI
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TOGETHER_API_KEY || ''}`,
      },
      body: JSON.stringify({
        model: 'mistralai/Mistral-7B-Instruct-v0.2', // Бесплатная модель
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages.filter((message) => message.id !== 'welcome'),
        ],
        temperature: 0.7,
        stream: true,
      }),
    });

    // Для более старых версий Next.js нам нужно обрабатывать стрим по-другому
    if (!response.ok) {
      return res.status(response.status).json({ error: await response.text() });
    }
    
    // Ответ в виде потока текста
    const data = response.body;
    
    // Добавляем заголовки для SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Создаем читаемый поток из response
    const reader = data.getReader();
    const decoder = new TextDecoder();
    
    // Функция для чтения и отправки чанков данных
    async function readAndSendChunks() {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.write('data: [DONE]\n\n');
            res.end();
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          res.write(`data: ${chunk}\n\n`);
        }
      } catch (error) {
        console.error('Error reading stream:', error);
        res.status(500).end();
      }
    }
    
    readAndSendChunks();
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: `An error occurred: ${error.message}` });
  }
}