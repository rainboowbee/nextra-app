import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

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
              const parsed = JSON.parse(data);
              if (parsed.content) {
                assistantResponse += parsed.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: assistantResponse } 
                    : msg
                ));
              }
            } catch (err) {
              console.error('Ошибка парсинга JSON:', err);
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

  // Компонент для рендеринга кода с подсветкой синтаксиса
  const CodeBlock = ({ language, value }) => {
    return (
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        className="rounded-md"
      >
        {value}
      </SyntaxHighlighter>
    );
  };

  // Функция для рендеринга контента сообщения с поддержкой MDX
  const renderMessageContent = (content) => {
    return (
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <CodeBlock
                language={match[1]}
                value={children.toString().replace(/\n$/, '')}
                {...props}
              />
            ) : (
              <code className={`${className} px-1 py-0.5 rounded bg-gray-200 dark:bg-gray-800`} {...props}>
                {children}
              </code>
            );
          },
          p: ({ children }) => <p className="mb-4">{children}</p>,
          h1: ({ children }) => <h1 className="text-2xl font-bold my-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-bold my-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-bold my-2">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-5 mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 mb-4">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 dark:border-gray-700 pl-4 italic my-4">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  // Компонент для анимации загрузки
  const LoadingAnimation = () => (
    <div className="flex items-center space-x-2 p-4">
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ 
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s'
            }}
          ></div>
        ))}
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400">Генерация ответа...</span>
    </div>
  );

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto">
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => setIsCodeAnalysis(false)}
            className={`px-4 py-2 rounded transition-colors duration-200 ${!isCodeAnalysis ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            Помощь по заданиям
          </button>
          <button 
            onClick={() => setIsCodeAnalysis(true)}
            className={`px-4 py-2 rounded transition-colors duration-200 ${isCodeAnalysis ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
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

      <div className="flex-1 overflow-auto p-4 mb-4 border rounded-md dark:border-gray-700 min-h-[400px] max-h-[600px] bg-gray-50 dark:bg-gray-900">
        {messages.map((message, index) => (
          <div 
            key={message.id} 
            className={`mb-6 animate-fade-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {/* Сообщение пользователя */}
            {message.role === 'user' && (
              <div className="flex flex-col items-end">
                <div className="flex items-center mb-1">
                  <span className="text-xs text-gray-500 mr-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Вы</div>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg max-w-[85%] shadow-sm border border-blue-200 dark:border-blue-800 transform transition-all hover:shadow-md">
                  <pre className="whitespace-pre-wrap text-black dark:text-white font-sans">
                    {message.content}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Сообщение ассистента */}
            {message.role === 'assistant' && (
              <div className="flex flex-col items-start">
                <div className="flex items-center mb-1">
                  <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full mr-2">AI</div>
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.content ? (
                  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg max-w-[85%] shadow-sm border border-gray-200 dark:border-gray-700 transform transition-all hover:shadow-md">
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      {renderMessageContent(message.content)}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 p-2 rounded-lg max-w-[85%] shadow-sm border border-gray-200 dark:border-gray-700">
                    <LoadingAnimation />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {error && (
          <div className="text-red-500 p-4 rounded bg-red-100 dark:bg-red-900/20 my-4 border border-red-200 dark:border-red-800 shadow">
            <div className="font-bold mb-1">Ошибка</div>
            <div>{error.message}</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <textarea
          className="flex-1 p-3 border rounded-md dark:border-gray-700 min-h-[80px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          value={input}
          onChange={handleInputChange}
          placeholder={isCodeAnalysis 
            ? "Вставьте код для анализа..." 
            : "Опишите задание или задайте вопрос..."}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50 hover:bg-blue-600 active:bg-blue-700 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Отправка...
            </span>
          ) : (
            "Отправить"
          )}
        </button>
      </form>

      {/* Заменяем <style jsx global> на обычный style тег */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .animate-bounce {
          animation: bounce 1s infinite;
        }
      `}} />
    </div>
  );
}