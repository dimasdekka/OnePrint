import React from "react";

interface ModalProps {
  isOpen: boolean;
  type?: "confirm" | "alert" | "info";
  title: string;
  message: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function Modal({
  isOpen,
  type = "confirm",
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all scale-100 animate-bounce-in">
        <div className="text-center">
          {type === "confirm" && <div className="text-4xl mb-4">❓</div>}
          {type === "alert" && <div className="text-4xl mb-4">⚠️</div>}
          {type === "info" && <div className="text-4xl mb-4">ℹ️</div>}

          <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>

          <div className="flex gap-3 justify-center">
            {type === "confirm" && (
              <>
                <button
                  onClick={() => onCancel?.()}
                  disabled={isLoading}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={() => onConfirm?.()}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {confirmText}
                </button>
              </>
            )}
            {(type === "alert" || type === "info") && (
              <button
                onClick={() => onConfirm?.() || onCancel?.()}
                className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition w-full"
              >
                OK
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
