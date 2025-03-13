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
    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[800px]">
      <div className="flex flex-wrap gap-3 p-4 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3 mx-auto max-w-3xl w-full">
          <button 
            onClick={() => setIsCodeAnalysis(false)}
            className={`ai-helper-button ${
              !isCodeAnalysis 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform hover:scale-[1.02] hover:shadow-xl' 
                : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-200 backdrop-blur-sm'
            }`}
          >
            Помощь по заданиям
          </button>
          <button 
            onClick={() => setIsCodeAnalysis(true)}
            className={`ai-helper-button ${
              isCodeAnalysis 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 transform hover:scale-[1.02] hover:shadow-xl' 
                : 'bg-gray-100 dark:bg-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-600/50 text-gray-700 dark:text-gray-200 backdrop-blur-sm'
            }`}
          >
            Анализ кода
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50/30 to-white/30 dark:from-gray-900/30 dark:to-gray-800/30 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto space-y-8">
          {messages.map((message, index) => (
            <div 
              key={message.id}
              className={`animate-fade-in relative ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Линия соединения */}
              {index > 0 && (
                <div 
                  className={`absolute top-0 w-px h-8 bg-gradient-to-b from-transparent to-gray-200/50 dark:to-gray-700/50 ${
                    message.role === 'user' ? 'right-[15%]' : 'left-[15%]'
                  }`}
                  style={{ transform: 'translateY(-32px)' }}
                />
              )}

              <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center mb-2">
                  {message.role === 'user' ? (
                    <>
                      <span className="text-xs text-gray-500 mr-2 font-medium">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs px-4 py-1.5 rounded-full shadow-sm font-medium">
                        Вы
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs px-4 py-1.5 rounded-full shadow-sm font-medium mr-2">
                        AI
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </>
                  )}
                </div>
                
                {message.role === 'user' ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl blur-lg transform scale-105"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg transform transition-all duration-200 hover:scale-[1.01] hover:shadow-xl">
                      <pre className="whitespace-pre-wrap font-sans">
                        {message.content}
                      </pre>
                    </div>
                  </div>
                ) : (
                  message.content ? (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-lg transform scale-105"></div>
                      <div className="relative bg-white/90 dark:bg-gray-800/90 p-4 rounded-2xl rounded-tl-none shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm transform transition-all duration-200 hover:scale-[1.01] hover:shadow-xl">
                        <div className="prose dark:prose-invert prose-sm max-w-none">
                          {renderMessageContent(message.content)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-lg transform scale-105"></div>
                      <div className="relative bg-white/90 dark:bg-gray-800/90 p-4 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
                        <LoadingAnimation />
                      </div>
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
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 w-full max-w-2xl z-50">
          <div className="mx-4 p-4 bg-red-50/90 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl shadow-lg backdrop-blur-sm">
            <div className="font-medium text-red-800 dark:text-red-200">Ошибка</div>
            <div className="mt-1 text-sm text-red-700 dark:text-red-300">{error.message}</div>
          </div>
        </div>
      )}

      <div className="flex items-center p-4 bg-white/80 dark:bg-gray-800/80 border-t border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder={isCodeAnalysis ? "Вставьте код для анализа..." : "Задайте вопрос по информатике..."}
            className="ai-helper-input"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="ai-helper-submit"
          >
            Отправить
          </button>
        </form>
      </div>

      <style jsx global>{`
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
    </div>
  );
}