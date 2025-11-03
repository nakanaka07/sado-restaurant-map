---
name: "Phase 3: インタラクティブUI - UX品質保証"
about: 3週間で55% → 65%到達 (+10%)
title: "[P1-test] Phase 3: インタラクティブUI - UX品質保証"
labels: ["P1", "test", "coverage", "phase3", "a11y", "ui"]
assignees: []
---

## 🎯 目標

**カバレッジ**: 55% → **65%** (+10%)
**期間**: 2025-11-25 ~ 2025-12-15 (3週間)
**工数**: 18時間
**重点**: WCAG AA準拠 + キーボードナビゲーション

---

## 📋 タスク一覧

### 🔲 Task 1: CuisineFilter.test.tsx (Week 1)

- **現状**: 0% (75行)
- **目標**: 90%+
- **効果**: +1.5%
- **工数**: 2時間
- **優先度**: P1

#### 実装要件

**テストケース** (推定12-15ケース):

```tsx
describe("CuisineFilter", () => {
  it("全料理タイプオプションを表示", () => {
    render(<CuisineFilter value="" onChange={vi.fn()} />);
    const select = screen.getByLabelText(/料理タイプ/);

    // 18カテゴリ + "すべて" = 19オプション
    expect(select.children).toHaveLength(19);
  });

  it("選択した料理タイプを反映", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<CuisineFilter value="" onChange={handleChange} />);
    const select = screen.getByLabelText(/料理タイプ/);

    await user.selectOptions(select, "寿司");
    expect(handleChange).toHaveBeenCalled();
  });

  it("キーボードナビゲーション", async () => {
    const user = userEvent.setup();
    render(<CuisineFilter value="" onChange={vi.fn()} />);

    await user.tab(); // selectにフォーカス
    await user.keyboard("{ArrowDown}"); // 次のオプション
    // 選択状態確認
  });
});
```

---

### 🔲 Task 2: DistrictFilter.test.tsx (Week 1)

- **現状**: 0% (113行)
- **目標**: 90%+
- **効果**: +1.5%
- **工数**: 3時間
- **優先度**: P1

#### 実装要件

**テストケース** (推定15-18ケース):

```tsx
describe("DistrictFilter", () => {
  it("全地域チェックボックスを表示", () => {
    render(<DistrictFilter selected={[]} onChange={vi.fn()} />);

    // 佐渡10地域 + "その他"
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes).toHaveLength(11);
  });

  it("全選択ボタンが機能する", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<DistrictFilter selected={[]} onChange={handleChange} />);

    const selectAllBtn = screen.getByText(/全選択/);
    await user.click(selectAllBtn);

    expect(handleChange).toHaveBeenCalledWith(expect.arrayContaining(["両津", "相川", "佐和田" /* ... */]));
  });

  it("個別選択が機能する", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<DistrictFilter selected={[]} onChange={handleChange} />);

    const checkbox = screen.getByLabelText("両津");
    await user.click(checkbox);

    expect(handleChange).toHaveBeenCalledWith(["両津"]);
  });

  it("WCAG AA準拠", async () => {
    const { container } = render(<DistrictFilter selected={[]} onChange={vi.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

### 🔲 Task 3: FeatureFilter.test.tsx (Week 2)

- **現状**: 0% (132行)
- **目標**: 85%+
- **効果**: +1.5%
- **工数**: 4時間
- **優先度**: P1

#### 実装要件

**テストケース** (推定18-20ケース):

```tsx
describe("FeatureFilter", () => {
  it("複数条件フィルターを表示", () => {
    render(<FeatureFilter selected={[]} onChange={vi.fn()} />);

    // 特徴チェックボックス群
    expect(screen.getByLabelText("駐車場あり")).toBeInTheDocument();
    expect(screen.getByLabelText("カード可")).toBeInTheDocument();
    expect(screen.getByLabelText("Wi-Fiあり")).toBeInTheDocument();
  });

  it("複数選択が機能する", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<FeatureFilter selected={[]} onChange={handleChange} />);

    await user.click(screen.getByLabelText("駐車場あり"));
    await user.click(screen.getByLabelText("カード可"));

    expect(handleChange).toHaveBeenLastCalledWith(expect.arrayContaining(["駐車場あり", "カード可"]));
  });

  it("選択解除が機能する", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<FeatureFilter selected={["駐車場あり"]} onChange={vi.fn()} />);

    const checkbox = screen.getByLabelText("駐車場あり");
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    // onChange で空配列が渡されることを確認
  });
});
```

---

### 🔲 Task 4: CustomMapControls.test.tsx (Week 2)

- **現状**: 0% (57行)
- **目標**: 80%
- **効果**: +1%
- **工数**: 3時間
- **優先度**: P1
- **リスク**: 🟡 Google Maps API モック

#### 実装要件

**テストケース** (推定10-12ケース):

```tsx
describe("CustomMapControls", () => {
  it("Google Maps にカスタムコントロールを追加", () => {
    const mockMap = {
      controls: {
        [google.maps.ControlPosition.TOP_RIGHT]: {
          push: vi.fn(),
          getArray: () => [],
          removeAt: vi.fn(),
        },
      },
    };

    render(
      <APIProvider apiKey="test">
        <Map>
          <CustomMapControls onFilterChange={vi.fn()} />
        </Map>
      </APIProvider>
    );

    expect(mockMap.controls[ControlPosition.TOP_RIGHT].push).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it("アンマウント時にコントロールを削除", () => {
    const { unmount } = render(<CustomMapControls onFilterChange={vi.fn()} />);

    unmount();

    // controls.removeAt が呼ばれることを確認
  });
});
```

**参考**: `RestaurantMap.test.tsx` (13,771 bytes) のモックパターン

---

### 🔲 Task 5: FilterModal.test.tsx (Week 3)

- **現状**: 0% (278行)
- **目標**: 85%
- **効果**: +3%
- **工数**: 6時間
- **優先度**: P1
- **リスク**: 🔴 a11y複雑度高

#### 実装要件

**テストケース** (推定25-30ケース):

```tsx
describe("FilterModal", () => {
  describe("基本動作", () => {
    it("開いた時にモーダルを表示", () => {
      render(<FilterModal isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    it("閉じた時にモーダルを非表示", () => {
      render(<FilterModal isOpen={false} onClose={vi.fn()} />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("フォーカス管理", () => {
    it("開いた時に最初のフォーカス可能要素にフォーカス", async () => {
      render(<FilterModal isOpen={true} onClose={vi.fn()} />);

      await waitFor(() => {
        const firstInput = screen.getByRole("textbox");
        expect(firstInput).toHaveFocus();
      });
    });

    it("閉じた時に元の要素にフォーカスを戻す", async () => {
      const triggerButton = document.createElement("button");
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      const { rerender } = render(<FilterModal isOpen={true} onClose={vi.fn()} />);

      rerender(<FilterModal isOpen={false} onClose={vi.fn()} />);

      await waitFor(() => {
        expect(triggerButton).toHaveFocus();
      });
    });

    it("Tabキーでフォーカストラップが機能する", async () => {
      const user = userEvent.setup();
      render(<FilterModal isOpen={true} onClose={vi.fn()} />);

      const focusableElements = screen.getAllByRole("button");

      // 最後の要素から Tab → 最初の要素に戻る
      focusableElements[focusableElements.length - 1].focus();
      await user.tab();

      expect(focusableElements[0]).toHaveFocus();
    });
  });

  describe("キーボード操作", () => {
    it("Escキーでモーダルを閉じる", async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(<FilterModal isOpen={true} onClose={handleClose} />);

      await user.keyboard("{Escape}");
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("背景クリック", () => {
    it("背景クリックでモーダルを閉じる", async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(<FilterModal isOpen={true} onClose={handleClose} />);

      const backdrop = screen.getByTestId("modal-backdrop");
      await user.click(backdrop);

      expect(handleClose).toHaveBeenCalled();
    });

    it("モーダル内クリックでは閉じない", async () => {
      const handleClose = vi.fn();
      const user = userEvent.setup();

      render(<FilterModal isOpen={true} onClose={handleClose} />);

      const modalContent = screen.getByRole("dialog");
      await user.click(modalContent);

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe("アクセシビリティ", () => {
    it("WCAG AA準拠", async () => {
      const { container } = render(<FilterModal isOpen={true} onClose={vi.fn()} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("aria-labelledby が正しく設定される", () => {
      render(<FilterModal isOpen={true} onClose={vi.fn()} />);

      const dialog = screen.getByRole("dialog");
      const titleId = dialog.getAttribute("aria-labelledby");

      expect(titleId).toBeTruthy();
      expect(screen.getByText(/フィルター/)).toHaveAttribute("id", titleId);
    });
  });
});
```

**参考**: `AccessibilityComponents.test.tsx` (24,677 bytes, 99.59%カバレッジ)

---

## ✅ 完了条件

- [ ] 全テストスイートが通過 (合計 80-95テスト追加)
- [ ] カバレッジが **65%以上** に到達
- [ ] WCAG AA準拠 (jest-axe で全コンポーネント検証済み)
- [ ] キーボードナビゲーション完全対応
- [ ] ESLint/TypeScript エラー 0件
- [ ] Quality Gates全通過

---

## 📊 カバレッジ影響予測

| タスク                | 現状 | 目標 | プロジェクト影響 |
| --------------------- | ---- | ---- | ---------------- |
| CuisineFilter.tsx     | 0%   | 90%  | +1.5%            |
| DistrictFilter.tsx    | 0%   | 90%  | +1.5%            |
| FeatureFilter.tsx     | 0%   | 85%  | +1.5%            |
| CustomMapControls.tsx | 0%   | 80%  | +1%              |
| FilterModal.tsx       | 0%   | 85%  | +3%              |
| **合計**              | -    | -    | **+8.5%**        |

**最終カバレッジ**: 55% + 8.5% = **63.5%** → 目標65%まで残り1.5%

---

## 🚀 次のステップ

Phase 3完了後、Phase 4 (統合テスト) へ:

- RestaurantMap.tsx 統合テスト
- E2E testing (Playwright導入検討)
- カバレッジ 70%+ 到達

---

## 📎 関連リンク

- [FilterPanel.test.tsx 参考](../../../src/components/restaurant/FilterPanel/FilterPanel.test.tsx) (17,532 bytes, 97.35%)
- [AccessibilityComponents.test.tsx 参考](../../../src/components/common/AccessibilityComponents.test.tsx) (24,677 bytes, 99.59%)
- [WCAG 2.1 ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [Testing Library ベストプラクティス](https://testing-library.com/docs/queries/about)
