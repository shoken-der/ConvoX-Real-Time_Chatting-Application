import { useEffect } from "react";
import { XCircleIcon } from "@heroicons/react/solid";
import { useAuth } from "../../contexts/AuthContext";

export default function ErrorMessage() {
  const { error, setError } = useAuth();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    error && (
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 left-4 sm:left-auto z-[9999] max-w-[calc(100vw-2rem)] sm:max-w-sm animate-zoom-in">
        <div className="bg-surface/90 backdrop-blur-xl rounded-2xl shadow-premium-lg border border-danger/20 p-0.5">
          <div className="flex items-start p-3 pr-4 gap-3 bg-danger/5 rounded-[14px]">
            <div className="flex-shrink-0 relative mt-0.5 ml-0.5">
              <div className="absolute inset-0 bg-danger blur-md opacity-20 animate-pulse rounded-full" />
              <XCircleIcon className="relative h-5 w-5 text-danger" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-danger leading-relaxed break-words">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  );
}
