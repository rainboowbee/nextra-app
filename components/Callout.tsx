import React, { ReactNode } from "react";

interface CalloutProps {
  children: ReactNode;
  type?: "info" | "warning" | "error" | "success";
  title?: string;
}

interface CalloutStyles {
  icon: string;
  color: string;
  bg: string;
  border: string;
}

export const Callout: React.FC<CalloutProps> = ({
  children,
  type = "info",
  title,
}) => {
  const types: Record<string, CalloutStyles> = {
    info: {
      icon: "💡",
      color: "#3b82f6",
      bg: "#eff6ff",
      border: "#93c5fd",
    },
    warning: {
      icon: "⚠️",
      color: "#f59e0b",
      bg: "#fffbeb",
      border: "#fcd34d",
    },
    error: {
      icon: "🛑",
      color: "#ef4444",
      bg: "#fee2e2",
      border: "#fca5a5",
    },
    success: {
      icon: "✅",
      color: "#10b981",
      bg: "#ecfdf5",
      border: "#6ee7b7",
    },
  };

  const style = types[type] || types.info;
  const calloutTitle = title || type.charAt(0).toUpperCase() + type.slice(1);

  return (
    <div className="callout">
      <div className="callout-header">
        <span className="callout-icon">{style.icon}</span>
        {title && <span className="callout-title">{calloutTitle}</span>}
      </div>
      <div className="callout-content">{children}</div>
      <style jsx>{`
        .callout {
          border-radius: 0.375rem;
          padding: 1rem;
          margin: 1.5rem 0;
          background-color: ${style.bg};
          border-left: 4px solid ${style.border};
        }
        .callout-header {
          display: flex;
          align-items: center;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${style.color};
        }
        .callout-icon {
          margin-right: 0.5rem;
        }
        .callout-title {
          font-size: 1.05rem;
        }
        .callout-content {
          color: rgb(55, 65, 81);
        }
      `}</style>
    </div>
  );
};

export default Callout;
