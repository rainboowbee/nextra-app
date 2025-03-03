import React, { ReactNode } from "react";

// Интерфейс для основного компонента Steps
interface StepsProps {
  children: ReactNode;
}

// Интерфейс для дочернего компонента Step
interface StepProps {
  children: ReactNode;
  title: string;
}

// Компонент для отдельного шага
const Step: React.FC<StepProps> = ({ children, title }) => {
  return <div className="step-content">{children}</div>;
};

// Основной компонент Steps
export const Steps: React.FC<StepsProps> = ({ children }) => {
  // Преобразуем children в массив
  const childrenArray = React.Children.toArray(children);

  // Фильтруем только компоненты типа Step
  const steps = childrenArray.filter(
    (child) =>
      React.isValidElement(child) && (child as React.ReactElement).type === Step
  );

  // Если нет шагов, возвращаем исходное содержимое
  if (steps.length === 0) {
    return <>{children}</>;
  }

  return (
    <div className="steps-container">
      {steps.map((child, index) => {
        if (!React.isValidElement(child)) return null;

        const stepProps = child.props;

        return (
          <div key={index} className="step-item">
            <div className="step-header">
              <div className="step-number">{index + 1}</div>
              <h3 className="step-title">{stepProps.title}</h3>
            </div>
            {child}
          </div>
        );
      })}
      <style jsx>{`
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          margin: 2rem 0;
        }
        .step-item {
          border-left: 2px solid #e5e7eb;
          padding-left: 1.5rem;
          position: relative;
        }
        .step-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }
        .step-number {
          background-color: #3b82f6;
          color: white;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          position: absolute;
          left: -0.9rem;
        }
        .step-title {
          margin: 0;
          margin-left: 1rem;
          font-size: 1.25rem;
          font-weight: 600;
        }
        .step-content {
          margin-left: 1rem;
        }
      `}</style>
    </div>
  );
};

// Экспортируем Step как подкомпонент Steps
Steps.Step = Step;

export default Steps;
