"use client";

import { useEffect } from "react";
import Icon from "./Icon";

export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="dmodal-overlay" onClick={onClose}>
      <div className="dmodal" onClick={(e) => e.stopPropagation()}>
        <div className="dmodal-hd">
          <h3>{title}</h3>
          <button type="button" className="dash-icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="dmodal-bd">{children}</div>
      </div>
    </div>
  );
}
