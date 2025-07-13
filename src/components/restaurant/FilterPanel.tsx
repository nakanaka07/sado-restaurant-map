interface FilterPanelProps {
  loading: boolean;
}

export function FilterPanel({ loading }: FilterPanelProps) {
  if (loading) {
    return (
      <div className="filter-panel">
        <p>フィルターを読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="filter-panel">
      <h2>飲食店を探す</h2>
      <div className="filter-section">
        <label htmlFor="search">店舗名で検索</label>
        <input
          id="search"
          type="text"
          placeholder="店舗名を入力..."
          disabled={loading}
        />
      </div>
      <div className="filter-section">
        <p>フィルター機能は実装中です</p>
      </div>
    </div>
  );
}
