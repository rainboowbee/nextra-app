import AiHelper from '../components/AiHelper'
import { NextPage } from 'next'

const AiHelperPage: NextPage = () => {
  return (
    <div className="ai-helper-container">
      <div className="ai-helper-content">
        <div className="ai-helper-header">
          <h1 className="ai-helper-title">
            AI Помощник
          </h1>
          <p className="ai-helper-description">
            Интеллектуальный помощник для анализа кода и подготовки к ЕГЭ/ОГЭ по информатике
          </p>
        </div>
        
        <div className="ai-helper-chat-container">
          <AiHelper />
        </div>
      </div>

      <div className="ai-helper-decoration">
        <div className="ai-helper-blob-1"></div>
        <div className="ai-helper-blob-2"></div>
      </div>
    </div>
  )
}

export default AiHelperPage 