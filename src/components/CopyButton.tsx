"use client";

import { useState } from "react";
import { useLanguage } from "@/components/Language";

export default function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const field = document.createElement("textarea");
      field.value = value;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      document.body.removeChild(field);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn btn--sm${copied ? " copied" : ""}`}
      aria-label={`${language === "id" ? "Salin" : "Copy"} ${value}`}
    >
      {copied ? (language === "id" ? "TERSALIN" : "COPIED") : (language === "id" && label === "Copy" ? "SALIN" : label.toUpperCase())}
    </button>
  );
}
