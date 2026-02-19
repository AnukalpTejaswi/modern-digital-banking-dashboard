import { toast } from 'react-toastify';

const baseConfig = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/* Base card-style class */
const baseClass =
  "rounded-xl border backdrop-blur-md shadow-lg px-4 py-3 text-sm font-medium flex items-center gap-3";

/* SUCCESS */
export const showSuccess = (message) =>
  toast.success(message, {
    ...baseConfig,
    className: `${baseClass} bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--border)]`,
    icon: "✓",
  });

/* ERROR */
export const showError = (message) =>
  toast.error(message, {
    ...baseConfig,
    className: `${baseClass} bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--danger)]`,
    icon: "⨯",
  });

/* WARNING */
export const showWarning = (message) =>
  toast.warn(message, {
    ...baseConfig,
    className: `${baseClass} bg-[var(--card-bg)] text-[var(--text-primary)] border-amber-300`,
    icon: "⚠",
  });

/* INFO */
export const showInfo = (message) =>
  toast.info(message, {
    ...baseConfig,
    className: `${baseClass} bg-[var(--card-bg)] text-[var(--text-primary)] border-[var(--accent)]`,
    icon: "ℹ",
  });

/* CONFIRM */
export const showConfirm = (message, onConfirm) => {
  toast(
    ({ closeToast }) => (
      <div>
        <p className="font-medium mb-3 text-[var(--text-primary)]">
          {message}
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => {
              onConfirm();
              closeToast();
            }}
            className="px-3 py-1 rounded-md text-white bg-[var(--danger)] hover:opacity-90"
          >
            Delete
          </button>

          <button
            onClick={closeToast}
            className="px-3 py-1 rounded-md border border-[var(--border)] bg-[var(--card-bg)] hover:bg-[var(--bg-base)]"
          >
            Cancel
          </button>
        </div>
      </div>
    ),
    {
      position: 'top-right',
      autoClose: false,
      closeOnClick: false,
      draggable: false,
      className: "rounded-xl border bg-[var(--card-bg)] border-[var(--border)] shadow-xl",
    }
  );
};
