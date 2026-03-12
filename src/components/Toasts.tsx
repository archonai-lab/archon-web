import type { Toast } from "../lib/types";

const TYPE_STYLES: Record<Toast["type"], string> = {
  info: "bg-blue-500/20 border-blue-500/30 text-blue-300",
  success: "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
  warning: "bg-amber-500/20 border-amber-500/30 text-amber-300",
};

export function Toasts({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm shadow-lg animate-slide-in ${TYPE_STYLES[toast.type]}`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-current opacity-50 hover:opacity-100 ml-2 shrink-0"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
