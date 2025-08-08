/**
 * @fileoverview Search filter component
 * 検索フィルターコンポーネント
 */

import { useState, useRef, useEffect } from "react";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function SearchFilter({
  value,
  onChange,
  loading = false,
  placeholder = "店名・料理名で検索",
}: SearchFilterProps) {
  const [inputValue, setInputValue] = useState(value);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // デバウンス処理
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onChange?.(inputValue);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [inputValue, onChange]);

  // 外部からの値変更に対応
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  return (
    <div className="filter-search">
      <label htmlFor="search-input" className="filter-label">
        検索
      </label>
      <div className="search-input-container">
        <input
          id="search-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={placeholder}
          className="search-input"
          disabled={loading}
          aria-describedby="search-help"
        />
        {loading && (
          <div className="search-loading" aria-label="検索中">
            <span className="spinner" />
          </div>
        )}
        {inputValue && (
          <button
            type="button"
            onClick={() => setInputValue("")}
            className="search-clear"
            aria-label="検索をクリア"
          >
            ×
          </button>
        )}
      </div>
      <p id="search-help" className="filter-help">
        店名、料理名、エリア名で検索できます
      </p>
    </div>
  );
}
