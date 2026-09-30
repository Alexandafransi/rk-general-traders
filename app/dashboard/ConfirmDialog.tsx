"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";
import { useLocale } from "./i18n/LocaleContext";

type DialogTone = "default" | "danger";

type DialogOptions = {
  title?: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
};

type PendingDialog = {
  message: string;
  options: DialogOptions;
  showCancel: boolean;
  resolve: (confirmed: boolean) => void;
};

type ConfirmContextValue = {
  /** Replaces `window.confirm` — resolves `true` if the user confirms, `false` on cancel/dismiss. */
  confirm: (message: string, options?: DialogOptions) => Promise<boolean>;
  /** Replaces `window.alert` — a single-button notice, resolves once dismissed. */
  notify: (message: string, options?: Omit<DialogOptions, "cancelLabel">) => Promise<void>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingDialog | null>(null);

  const confirm = useCallback((message: string, options: DialogOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      setPending({ message, options, showCancel: true, resolve });
    });
  }, []);

  const notify = useCallback((message: string, options: DialogOptions = {}) => {
    return new Promise<void>((resolveVoid) => {
      setPending({ message, options, showCancel: false, resolve: () => resolveVoid() });
    });
  }, []);

  function close(result: boolean) {
    if (!pending) return;
    pending.resolve(result);
    setPending(null);
  }

  return (
    <ConfirmContext.Provider value={{ confirm, notify }}>
      {children}
      {pending && <ConfirmDialogView pending={pending} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

function ConfirmDialogView({ pending, onClose }: { pending: PendingDialog; onClose: (result: boolean) => void }) {
  const { t } = useLocale();
  const confirmBtnRef = useRef<HTMLButtonElement>(null);
  const tone = pending.options.tone ?? "default";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    confirmBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="dconfirm-overlay" onClick={() => onClose(false)}>
      <div className="dconfirm" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <span className={`dconfirm-icon ${tone}`}>
          <Icon name={tone === "danger" ? "trash" : "alert-circle"} size={19} />
        </span>
        {pending.options.title && <h3>{pending.options.title}</h3>}
        <p>{pending.message}</p>
        <div className="dconfirm-actions">
          {pending.showCancel && (
            <button type="button" className="dbtn" onClick={() => onClose(false)}>
              {pending.options.cancelLabel ?? t("common.cancel")}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            className={`dbtn ${tone === "danger" ? "danger" : "primary"}`}
            onClick={() => onClose(true)}
          >
            {pending.showCancel ? pending.options.confirmLabel ?? t("common.confirm") : pending.options.confirmLabel ?? t("common.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
