import { motion } from 'framer-motion'

export const DevPageBackground = () => {
  return (
    <div className="relative min-h-[calc(100vh-var(--nextra-navbar-height))] overflow-hidden">
      {/* Анимированный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.2),transparent_30%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.2),transparent_30%)]" />
        </div>
        
        {/* Анимированные круги */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000" />
      </div>

      {/* Контент */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-var(--nextra-navbar-height))] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Слот для контента */}
          <div className="nextra-content text-white">
            <slot />
          </div>
        </motion.div>

        {/* Индикатор прогресса */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-12"
        >
          <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="w-1/2 h-full bg-white/80 rounded-full animate-progress" />
          </div>
          <p className="text-white/80 mt-4 text-sm font-medium text-center">
            Прогресс разработки: 50%
          </p>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0, 0) scale(1); }
        }

        @keyframes progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0); }
          100% { transform: translateX(100%); }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-progress {
          animation: progress 2s ease-in-out infinite;
        }

        :global(.nextra-content h1) {
          font-size: 3.75rem;
          line-height: 1;
          font-weight: 700;
          margin-bottom: 1.5rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        :global(.nextra-content p) {
          font-size: 1.25rem;
          line-height: 1.75;
          opacity: 0.9;
          max-width: 42rem;
          margin: 0 auto;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          :global(.nextra-content h1) {
            font-size: 2.5rem;
          }

          :global(.nextra-content p) {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  )
} 