import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Components } from 'react-markdown';

export default function AiHelper() {
  const [isCodeAnalysis, setIsCodeAnalysis] = useState(false);
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

      // Отправляем запрос
      const response = await fetch('/api/ai-chat', {
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
                // Обновляем сообщение полностью, не разбивая его на отдельные символы
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

  // Функция для рендеринга контента сообщения с поддержкой MDX
  const renderMessageContent = (content: string) => {
    return (
      <div className="nextra-content">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeContent = Array.isArray(children) ? children.join('') : children;
              
              return !inline && match ? (
                <div className="nextra-code-block mt-6 first:mt-0">
                  <pre className="nx-bg-primary-700/5 nx-mb-4 nx-overflow-x-auto nx-rounded-xl nx-border nx-py-4 nx-bg-white dark:nx-bg-zinc-900 nx-border-black/5 dark:nx-border-white/10 nx-shadow-sm">
                    <code className="nx-p-4 nx-block text-black dark:text-gray-200">
                      {codeContent}
                    </code>
                  </pre>
                </div>
              ) : (
                <code className="nx-border-black/5 nx-bg-primary-700/5 nx-font-medium nx-text-black dark:nx-text-gray-200 nx-subpixel-antialiased dark:nx-border-white/10 nx-rounded-md nx-border nx-py-0.5 nx-px-1 dark:nx-bg-zinc-800" {...props}>
                  {children}
                </code>
              );
            },
            pre({ children }) {
              return <>{children}</>;
            },
            p: ({ children }) => <p className="nx-mt-6 nx-leading-7 first:nx-mt-0">{children}</p>,
            h1: ({ children }: { children: React.ReactNode }) => <h1 className="nx-mt-6 nx-text-4xl nx-font-bold nx-tracking-tight first:nx-mt-0">{children}</h1>,
            h2: ({ children }: { children: React.ReactNode }) => <h2 className="nx-mt-12 nx-text-3xl nx-font-bold nx-tracking-tight first:nx-mt-0">{children}</h2>,
            h3: ({ children }: { children: React.ReactNode }) => <h3 className="nx-mt-8 nx-text-2xl nx-font-semibold nx-tracking-tight">{children}</h3>,
            ul: ({ children }: { children: React.ReactNode }) => <ul className="nx-mt-6 nx-list-disc first:nx-mt-0 ltr:nx-ml-6 rtl:nx-mr-6">{children}</ul>,
            ol: ({ children }: { children: React.ReactNode }) => <ol className="nx-mt-6 nx-list-decimal first:nx-mt-0 ltr:nx-ml-6 rtl:nx-mr-6">{children}</ol>,
            li: ({ children }: { children: React.ReactNode }) => <li className="nx-my-2">{children}</li>,
            blockquote: ({ children }: { children: React.ReactNode }) => (
              <blockquote className="nx-mt-6 nx-border-gray-300 nx-italic first:nx-mt-0 ltr:nx-border-l-2 ltr:nx-pl-6 rtl:nx-border-r-2 rtl:nx-pr-6">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
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
    <>
      <div className="flex flex-col flex-1 nextra-container main-container">
        <div className="flex flex-wrap gap-2 p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700">
          <div className="flex space-x-2 mx-auto max-w-3xl w-full">
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div 
                key={message.id}
                className={`animate-fade-in ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center mb-2">
                    {message.role === 'user' ? (
                      <>
                        <span className="text-xs text-gray-500 mr-2">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">Вы</div>
                      </>
                    ) : (
                      <>
                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-3 py-1 rounded-full mr-2">AI</div>
                        <span className="text-xs text-gray-500">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {message.role === 'user' ? (
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-md">
                      <pre className="whitespace-pre-wrap font-sans">
                        {message.content}
                      </pre>
                    </div>
                  ) : (
                    message.content ? (
                      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none shadow-md border-2 border-emerald-100 dark:border-emerald-900">
                        <div className="prose dark:prose-invert prose-sm max-w-none">
                          {renderMessageContent(message.content)}
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-md border-2 border-emerald-100 dark:border-emerald-900">
                        <LoadingAnimation />
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {error && (
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl">
            <div className="text-red-500 p-4 rounded bg-red-100 dark:bg-red-900/20 mx-4 border border-red-200 dark:border-red-800 shadow">
              <div className="font-bold mb-1">Ошибка</div>
              <div>{error.message}</div>
            </div>
          </div>
        )}

        <div className="border-t dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex space-x-2 max-w-3xl mx-auto">
            <textarea
              className="flex-1 p-3 border rounded-md dark:border-gray-700 min-h-[80px] resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white dark:bg-gray-900"
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
        </div>
      </div>
      <style jsx global>{`
        .nextra-container {
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
        }
        
        .main-container {
          min-height: calc(100vh - 64px);
          display: flex;
          flex-direction: column;
        }

        article {
          display: flex;
          flex-direction: column;
          flex: 1;
          max-width: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        main {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

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

        /* Стили для блоков кода */
        .nextra-code-block pre {
          margin: 0;
          white-space: pre !important;
          tab-size: 2;
        }

        .nextra-code-block code {
          display: block;
          line-height: 1.5;
          font-size: 14px;
          font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
          overflow-x: auto;
          white-space: pre !important;
          word-wrap: normal;
          tab-size: 2;
        }

        /* Стили для inline кода */
        p code {
          font-size: 14px;
          font-family: 'Menlo', 'Monaco', 'Consolas', monospace;
          white-space: pre-wrap;
        }

        /* Темная тема для блоков кода */
        @media (prefers-color-scheme: dark) {
          .nextra-code-block pre {
            background-color: rgb(24, 24, 27) !important;
          }
          
          .nextra-code-block code {
            color: rgb(229, 231, 235) !important;
          }
        }

        .nextra-content > *:first-child {
          margin-top: 0;
        }

        .nextra-content > *:last-child {
          margin-bottom: 0;
        }
      `}</style>
    </>
  );
}