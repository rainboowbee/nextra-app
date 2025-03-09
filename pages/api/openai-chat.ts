import Configuration from 'openai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
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

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new openai(configuration);

    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.filter((message) => message.id !== 'welcome').map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7,
      stream: true,
    }, { responseType: 'stream' });

    // Обработка потока от OpenAI
    const stream = completion.data;
    
    // Добавляем заголовки для SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Передаем поток клиенту
    stream.on('data', (chunk) => {
      const decoder = new TextDecoder();
      const chunkText = decoder.decode(chunk);
      res.write(`data: ${chunkText}\n\n`);
    });

    stream.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    stream.on('error', (error) => {
      console.error('Stream error:', error);
      res.status(500).end();
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: `An error occurred: ${error.message}` });
  }
}