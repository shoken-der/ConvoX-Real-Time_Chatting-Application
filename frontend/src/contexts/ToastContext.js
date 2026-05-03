import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = "info", duration = 4000, avatar, title }) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type, avatar, title }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

function ToastContainer({ toasts, removeToast }) {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const { type, message, avatar, title } = toast;

  const typeStyles = {
    info: "border-primary/30 bg-surface",
    success: "border-success/30 bg-surface",
    error: "border-danger/30 bg-surface",
    message: "border-primary/30 bg-surface",
  };

  const iconColors = {
    info: "text-primary",
    success: "text-success",
    error: "text-danger",
    message: "text-primary",
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-premium-lg backdrop-blur-md
        animate-toast-in ${typeStyles[type] || typeStyles.info}
      `}
      onClick={onClose}
    >
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="h-10 w-10 rounded-xl object-cover flex-shrink-0 shadow-sm"
          onError={(e) => {
            e.target.src = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
          }}
        />
      ) : (
        <div className={`flex-shrink-0 p-2 rounded-xl bg-surface-elevated ${iconColors[type]}`}>
          {type === "success" ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ) : type === "error" ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 12h.01M12 12h.01M16 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          )}
        </div>
      )}
      <div className="flex-1 min-w-0 pt-0.5">
        {title && (
          <p className="text-xs font-bold text-text-muted mb-0.5 uppercase tracking-wider">{title}</p>
        )}
        <p className="text-sm font-semibold text-text-main leading-snug break-words">{message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="flex-shrink-0 p-1 text-text-muted hover:text-text-main transition-colors focus:outline-none rounded-lg"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
