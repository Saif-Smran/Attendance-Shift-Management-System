import { useEffect } from "react";

const getConfirmClassName = (confirmVariant) => {
  if (confirmVariant === "danger") {
    return "rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60";
  }

  return "rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60";
};

const Modal = ({
  open,
  title,
  children,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  confirmDisabled = false,
  busy = false,
  widthClassName = "max-w-lg"
}) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4" onClick={onClose}>
      <div
        className={`surface w-full ${widthClassName} p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-brand-100 pb-4">
          <h2 className="text-lg font-semibold text-brand-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-slate-500 transition hover:bg-brand-50 hover:text-slate-700"
          >
            Close
          </button>
        </div>

        <div className="py-5">{children}</div>

        <div className="flex justify-end gap-2 border-t border-brand-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50"
            disabled={busy}
          >
            {cancelText}
          </button>
          {typeof onConfirm === "function" && (
            <button
              type="button"
              onClick={onConfirm}
              className={getConfirmClassName(confirmVariant)}
              disabled={confirmDisabled || busy}
            >
              {busy ? "Please wait..." : confirmText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
