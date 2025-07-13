import React from "react";

interface VisuallyHiddenProps {
  children: React.ReactNode;
}

/**
 * スクリーンリーダー専用のテキスト
 * 視覚的には見えないが、スクリーンリーダーには読み上げられる
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return (
    <span
      style={{
        position: "absolute",
        width: "1px",
        height: "1px",
        padding: 0,
        margin: "-1px",
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {children}
    </span>
  );
}

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

/**
 * キーボードナビゲーション用のスキップリンク
 */
export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="skip-link"
      style={{
        position: "absolute",
        top: "-40px",
        left: "6px",
        background: "#000",
        color: "#fff",
        padding: "8px",
        textDecoration: "none",
        borderRadius: "4px",
        zIndex: 1000,
        transition: "top 0.3s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = "6px";
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = "-40px";
      }}
    >
      {children}
    </a>
  );
}

interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
}

/**
 * アクセシブルなボタンコンポーネント
 */
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  type = "button",
  variant = "primary",
  size = "medium",
}: AccessibleButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      className={`btn btn--${variant} btn--${size}`}
      style={{
        padding:
          size === "small"
            ? "4px 8px"
            : size === "large"
            ? "12px 24px"
            : "8px 16px",
        fontSize:
          size === "small" ? "14px" : size === "large" ? "18px" : "16px",
        border: "none",
        borderRadius: "4px",
        cursor: disabled ? "not-allowed" : "pointer",
        backgroundColor:
          variant === "primary"
            ? "#0066cc"
            : variant === "danger"
            ? "#dc3545"
            : "#6c757d",
        color: "#fff",
        opacity: disabled ? 0.6 : 1,
        transition: "background-color 0.2s, opacity 0.2s",
      }}
    >
      {children}
    </button>
  );
}

interface AccessibleInputProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password" | "search" | "tel" | "url";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  description?: string;
}

/**
 * アクセシブルな入力フィールド
 */
export function AccessibleInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  description,
}: AccessibleInputProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy =
    [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="input-group">
      <label
        htmlFor={id}
        className="input-label"
        style={{
          display: "block",
          marginBottom: "4px",
          fontWeight: "bold",
        }}
      >
        {label}
        {required && (
          <span aria-label="必須" style={{ color: "#dc3545" }}>
            *
          </span>
        )}
      </label>

      {description && (
        <div
          id={descriptionId}
          className="input-description"
          style={{ marginBottom: "4px", fontSize: "14px", color: "#666" }}
        >
          {description}
        </div>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-describedby={ariaDescribedBy}
        aria-invalid={error ? "true" : "false"}
        style={{
          width: "100%",
          padding: "8px 12px",
          border: `2px solid ${error ? "#dc3545" : "#ccc"}`,
          borderRadius: "4px",
          fontSize: "16px",
          backgroundColor: disabled ? "#f5f5f5" : "#fff",
        }}
      />

      {error && (
        <div
          id={errorId}
          className="input-error"
          role="alert"
          style={{
            marginTop: "4px",
            fontSize: "14px",
            color: "#dc3545",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

interface LiveRegionProps {
  children: React.ReactNode;
  priority?: "polite" | "assertive";
}

/**
 * スクリーンリーダー用のライブリージョン
 * 動的に変化するコンテンツを通知
 */
export function LiveRegion({ children, priority = "polite" }: LiveRegionProps) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      style={{
        position: "absolute",
        left: "-10000px",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  label?: string;
}

/**
 * アクセシブルなローディングスピナー
 */
export function AccessibleLoadingSpinner({
  size = "medium",
  label = "読み込み中",
}: LoadingSpinnerProps) {
  const sizeValue = size === "small" ? 20 : size === "large" ? 60 : 40;

  return (
    <div
      role="status"
      aria-label={label}
      style={{
        display: "inline-block",
        width: sizeValue,
        height: sizeValue,
        border: "3px solid #f3f3f3",
        borderTop: "3px solid #0066cc",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    >
      <VisuallyHidden>{label}</VisuallyHidden>
    </div>
  );
}

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  onEscape?: () => void;
}

/**
 * フォーカストラップ - モーダル等でフォーカスを制御
 */
export function FocusTrap({ children, isActive, onEscape }: FocusTrapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // フォーカス可能な要素を取得
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    // 初期フォーカス
    if (firstElement) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        onEscape();
        return;
      }

      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift+Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onEscape]);

  return <div ref={containerRef}>{children}</div>;
}
