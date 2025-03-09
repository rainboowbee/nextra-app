import React, { useState, useRef, useEffect } from 'react';

export default function AiHelper() {
  const [isCodeAnalysis, setIsCodeAnalysis] = useState(false);
  const [apiProvider, setApiProvider] = useState('together'); // 'together' или 'openai'
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Привет! Я AI-помощник по информатике. Я могу помочь с анализом кода или подсказать по заданиям ЕГЭ/ОГЭ. Что вас интересует?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);

  // Автоскролл при новых сообщениях
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Добавляем сообщение пользователя
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Создаем плейсхолдер для ответа ассистента
      const assistantMessageId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: ''
      }]);

      // Выбираем API endpoint в зависимости от провайдера
      const apiEndpoint = apiProvider === 'openai' ? '/api/openai-chat' : '/api/ai-chat';

      // Отправляем запрос
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.concat(userMessage),
          body: {
            mode: isCodeAnalysis ? 'code-analysis' : 'task-help'
          }
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Читаем SSE поток
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              // Пытаемся парсить как JSON
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0]?.delta?.content) {
                assistantResponse += parsed.choices[0].delta.content;
                // Обновляем сообщение ассистента с накопленным текстом
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: assistantResponse } 
                    : msg
                ));
              }
            } catch (e) {
              // Если не удалось распарсить как JSON, добавляем как простой текст
              if (data !== '[DONE]') {
                assistantResponse += data;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: assistantResponse } 
                    : msg
                ));
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsCodeAnalysis(false)}
            className={`px-4 py-2 rounded ${!isCodeAnalysis ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Помощь по заданиям
          </button>
          <button 
            onClick={() => setIsCodeAnalysis(true)}
            className={`px-4 py-2 rounded ${isCodeAnalysis ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
          >
            Анализ кода
          </button>
        </div>
        
        <div className="flex items-center ml-auto">
          <label className="mr-2 text-sm">API:</label>
          <select 
            value={apiProvider}
            onChange={(e) => setApiProvider(e.target.value)}
            className="p-2 rounded border dark:border-gray-700 bg-white dark:bg-gray-800"
          >
            <option value="together">Together AI (Mistral)</option>
            <option value="openai">OpenAI (GPT-3.5)</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 mb-4 border rounded-md dark:border-gray-700 min-h-[400px] max-h-[600px]">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`mb-4 p-3 rounded-lg ${message.role === 'assistant' 
              ? 'bg-gray-100 dark:bg-gray-800 ml-4' 
              : 'bg-blue-100 dark:bg-blue-900 mr-4'}`}
          >
            <p className="text-sm font-bold mb-1">
              {message.role === 'assistant' ? 'AI-помощник' : 'Вы'}:
            </p>
            <div className="whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        {isLoading && !messages[messages.length - 1].content && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-pulse">Думаю...</div>
          </div>
        )}
        {error && (
          <div className="text-red-500 p-2 rounded bg-red-100 dark:bg-red-900/20 mb-4">
            Произошла ошибка: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <textarea
          className="flex-1 p-2 border rounded-md dark:border-gray-700 min-h-[80px] resize-none"
          value={input}
          onChange={handleInputChange}
          placeholder={isCodeAnalysis 
            ? "Вставьте код для анализа..." 
            : "Опишите задание или задайте вопрос..."}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50"
        >
          Отправить
        </button>
      </form>
    </div>
  );
}