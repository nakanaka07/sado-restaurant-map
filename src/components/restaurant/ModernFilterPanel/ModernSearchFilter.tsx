/**
 * @fileoverview Modern search filter component
 * モダンな検索フィルターコンポーネント
 */

interface ModernSearchFilterProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
}

export function ModernSearchFilter({
  value,
  onChange,
  loading = false,
}: ModernSearchFilterProps) {
  return (
    <div className="filter-section">
      <label htmlFor="modern-search" className="filter-label">
        <span
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: "var(--color-text-primary)",
          }}
        >
          🔍 検索
        </span>
      </label>
      <input
        id="modern-search"
        type="text"
        value={value}
        onChange={onChange}
        placeholder="店名、料理、地域で検索..."
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 12px",
          border: "2px solid #e5e7eb",
          borderRadius: "8px",
          fontSize: "14px",
          transition: "all 0.2s ease",
          backgroundColor: "#fff",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e5e7eb";
          e.target.style.boxShadow = "none";
        }}
        aria-describedby="search-help"
      />
      <div id="search-help" className="sr-only">
        店名、料理ジャンル、地域名で検索できます
      </div>
    </div>
  );
}
