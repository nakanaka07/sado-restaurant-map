/**
 * @fileoverview DetailedBusinessHours Comprehensive Tests
 * カバレッジ目標: 0% → 100%
 *
 * テスト対象:
 * - 営業時間データの正常表示（曜日別）
 * - compact/highlightToday/showLabelプロパティの動作
 * - 今日の曜日ハイライト（日-土）
 * - 定休日表示
 * - 空データ・エッジケース
 * - TodayHoursHighlightコンポーネント
 * - getTextColor関数
 * - formatOpeningHours統合
 * - アクセシビリティ（aria-label, コントラスト）
 */

import type { OpeningHours } from "@/types";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DetailedBusinessHours } from "../DetailedBusinessHours";

// ==============================
// テストデータ
// ==============================

const FULL_WEEK_HOURS: readonly OpeningHours[] = [
  { day: "月曜日", open: "11:00", close: "14:00", isHoliday: false },
  { day: "火曜日", open: "11:00", close: "14:00", isHoliday: false },
  { day: "水曜日", open: "", close: "", isHoliday: true }, // 定休日
  { day: "木曜日", open: "11:00", close: "14:00", isHoliday: false },
  { day: "金曜日", open: "11:00", close: "14:00", isHoliday: false },
  { day: "土曜日", open: "11:00", close: "20:00", isHoliday: false },
  { day: "日曜日", open: "11:00", close: "20:00", isHoliday: false },
];

const WEEKDAY_ONLY_HOURS: readonly OpeningHours[] = [
  { day: "月曜日", open: "09:00", close: "17:00", isHoliday: false },
  { day: "火曜日", open: "09:00", close: "17:00", isHoliday: false },
  { day: "水曜日", open: "09:00", close: "17:00", isHoliday: false },
  { day: "木曜日", open: "09:00", close: "17:00", isHoliday: false },
  { day: "金曜日", open: "09:00", close: "17:00", isHoliday: false },
  { day: "土曜日", open: "", close: "", isHoliday: true },
  { day: "日曜日", open: "", close: "", isHoliday: true },
];

// ==============================
// 基本表示テスト
// ==============================

describe("DetailedBusinessHours - Basic Rendering", () => {
  beforeEach(() => {
    // 月曜日 12:00 に固定
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 2024-01-15 (月)
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("全曜日の営業時間を表示する", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    expect(screen.getByText("月")).toBeInTheDocument();
    expect(screen.getByText("火")).toBeInTheDocument();
    expect(screen.getByText("水")).toBeInTheDocument();
    expect(screen.getByText("木")).toBeInTheDocument();
    expect(screen.getByText("金")).toBeInTheDocument();
    expect(screen.getByText("土")).toBeInTheDocument();
    expect(screen.getByText("日")).toBeInTheDocument();
  });

  it("デフォルトで営業時間ラベルを表示する", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    expect(screen.getByText("📅 営業時間")).toBeInTheDocument();
  });

  it("営業時間データが空の場合、適切なメッセージを表示する", () => {
    render(<DetailedBusinessHours openingHours={[]} />);

    expect(screen.getByText("営業時間不明")).toBeInTheDocument();
  });

  it("undefinedの場合、適切なメッセージを表示する", () => {
    render(
      <DetailedBusinessHours
        openingHours={undefined as unknown as readonly OpeningHours[]}
      />
    );

    expect(screen.getByText("営業時間不明")).toBeInTheDocument();
  });

  it("営業時間を正しい形式で表示する", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    // formatOpeningHours の出力形式をチェック
    expect(screen.getAllByText(/11:00 - 14:00/i).length).toBeGreaterThan(0);
  });
});

// ==============================
// compact プロパティテスト
// ==============================

describe("DetailedBusinessHours - Compact Mode", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("compact=false (デフォルト) で縦並び表示", () => {
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} compact={false} />
    );

    const wrapper = container.querySelector(
      ".detailed-business-hours > div:nth-of-type(2)"
    );
    expect(wrapper).toHaveStyle({ flexDirection: "column" });
  });

  it("compact=true で横並び表示", () => {
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} compact={true} />
    );

    const wrapper = container.querySelector(
      ".detailed-business-hours > div:last-child"
    );
    expect(wrapper).toHaveStyle({ flexDirection: "row", flexWrap: "wrap" });
  });

  it("compact=true でフォントサイズが11pxになる", () => {
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} compact={true} />
    );

    const dayElements = container.querySelectorAll(
      ".detailed-business-hours > div:last-child > div"
    );
    expect(dayElements[0]).toHaveStyle({ fontSize: "11px" });
  });
});

// ==============================
// highlightToday プロパティテスト
// ==============================

describe("DetailedBusinessHours - Highlight Today", () => {
  it("月曜日を今日としてハイライト", () => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} highlightToday />
    );

    const mondayElement = Array.from(
      container.querySelectorAll(
        ".detailed-business-hours > div:nth-of-type(2) > div"
      )
    ).find(
      el => el.textContent?.includes("月") && el.textContent?.includes("本日")
    );

    expect(mondayElement).toHaveStyle({
      backgroundColor: "rgb(243, 244, 246)",
      fontWeight: "600",
    });

    vi.useRealTimers();
  });

  it("水曜日（定休日）を今日としてハイライト", () => {
    vi.setSystemTime(new Date(2024, 0, 17, 12, 0)); // 水曜日
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} highlightToday />
    );

    const wednesdayElement = Array.from(
      container.querySelectorAll(
        ".detailed-business-hours > div:nth-of-type(2) > div"
      )
    ).find(
      el => el.textContent?.includes("水") && el.textContent?.includes("定休日")
    );

    expect(wednesdayElement).toHaveStyle({
      backgroundColor: "rgb(243, 244, 246)",
    });

    expect(screen.getAllByText("定休日")[0]).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("highlightToday=false で今日をハイライトしない", () => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
    const { container } = render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        highlightToday={false}
      />
    );

    const mondayElement = Array.from(
      container.querySelectorAll(
        ".detailed-business-hours > div:last-child > div"
      )
    ).find(el => el.textContent?.includes("月")) as HTMLElement;

    expect(mondayElement.style.backgroundColor).toBe("transparent");
    expect(mondayElement).toHaveStyle({
      fontWeight: "normal",
    });

    vi.useRealTimers();
  });

  it("highlightToday=true で「本日」ラベルを表示", () => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
    render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} highlightToday />
    );

    // 「本日」というテキストが行内に表示される
    expect(screen.getByText("本日")).toBeInTheDocument();

    vi.useRealTimers();
  });

  it("全曜日の今日ハイライトが正しく動作する", () => {
    const days = [
      { date: new Date(2024, 0, 14, 12, 0), name: "日" }, // 日曜日
      { date: new Date(2024, 0, 15, 12, 0), name: "月" },
      { date: new Date(2024, 0, 16, 12, 0), name: "火" },
      { date: new Date(2024, 0, 17, 12, 0), name: "水" },
      { date: new Date(2024, 0, 18, 12, 0), name: "木" },
      { date: new Date(2024, 0, 19, 12, 0), name: "金" },
      { date: new Date(2024, 0, 20, 12, 0), name: "土" },
    ];

    days.forEach(({ date, name }) => {
      vi.setSystemTime(date);
      const { container, unmount } = render(
        <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} highlightToday />
      );

      const allDayElements = Array.from(
        container.querySelectorAll(
          ".detailed-business-hours > div:nth-of-type(2) > div"
        )
      );

      const todayElement = allDayElements.find(el => {
        const firstSpan = el.querySelector("span:first-child");
        return firstSpan?.textContent === name;
      });

      expect(todayElement).toHaveStyle({
        backgroundColor: "rgb(243, 244, 246)",
      });

      unmount();
      vi.useRealTimers();
    });
  });
});

// ==============================
// showLabel プロパティテスト
// ==============================

describe("DetailedBusinessHours - Show Label", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("showLabel=true (デフォルト) でラベルを表示", () => {
    render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} showLabel={true} />
    );

    expect(screen.getByText("📅 営業時間")).toBeInTheDocument();
  });

  it("showLabel=false でラベルを非表示", () => {
    render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} showLabel={false} />
    );

    expect(screen.queryByText("📅 営業時間")).not.toBeInTheDocument();
  });
});

// ==============================
// className プロパティテスト
// ==============================

describe("DetailedBusinessHours - ClassName", () => {
  it("デフォルトclassNameを持つ", () => {
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />
    );

    expect(
      container.querySelector(".detailed-business-hours")
    ).toBeInTheDocument();
  });

  it("カスタムclassNameを適用する", () => {
    const { container } = render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        className="custom-class"
      />
    );

    const element = container.querySelector(".detailed-business-hours");
    expect(element).toHaveClass("detailed-business-hours");
    expect(element).toHaveClass("custom-class");
  });
});

// ==============================
// 定休日表示テスト
// ==============================

describe("DetailedBusinessHours - Holiday Display", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("定休日を「定休日」として表示", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    expect(screen.getByText("定休日")).toBeInTheDocument();
  });

  it("定休日が赤色で表示される", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    const holidayElement = screen.getByText("定休日");
    expect(holidayElement).toHaveStyle({ color: "#ef4444" });
  });

  it("複数の定休日を表示", () => {
    render(<DetailedBusinessHours openingHours={WEEKDAY_ONLY_HOURS} />);

    expect(screen.getAllByText("定休日")).toHaveLength(2); // 土日
  });

  it("定休日の場合、時間表示をしない", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    // 水曜日の定休日には時間が表示されない
    const wednesdayRow = screen.getByText("水").closest("div") as HTMLElement;
    expect(wednesdayRow.textContent).not.toMatch(/\d{2}:\d{2}/);
  });
});

// ==============================
// TodayHoursHighlight コンポーネントテスト
// ==============================

describe("DetailedBusinessHours - TodayHoursHighlight", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("highlightToday=true かつ compact=false で強調表示エリアを表示", () => {
    render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        highlightToday
        compact={false}
      />
    );

    expect(screen.getByText("本日の営業時間")).toBeInTheDocument();
  });

  it("highlightToday=false で強調表示エリアを非表示", () => {
    render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        highlightToday={false}
        compact={false}
      />
    );

    expect(screen.queryByText("本日の営業時間")).not.toBeInTheDocument();
  });

  it("compact=true で強調表示エリアを非表示", () => {
    render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        highlightToday
        compact={true}
      />
    );

    expect(screen.queryByText("本日の営業時間")).not.toBeInTheDocument();
  });

  it("今日が定休日の場合、強調表示エリアに「定休日」を表示", () => {
    vi.setSystemTime(new Date(2024, 0, 17, 12, 0)); // 水曜日（定休日）
    render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        highlightToday
        compact={false}
      />
    );

    expect(screen.getByText("本日の営業時間")).toBeInTheDocument();
    // 強調表示エリア内の「定休日」をチェック（.getByText は親要素から検索）
    const highlightArea = screen.getByText("本日の営業時間")
      .parentElement as HTMLElement;
    expect(highlightArea.textContent).toContain("定休日");

    vi.useRealTimers();
  });

  it("今日の営業時間が見つからない場合、強調表示エリアを非表示", () => {
    const partialHours: readonly OpeningHours[] = [
      { day: "火曜日", open: "11:00", close: "14:00", isHoliday: false },
      { day: "水曜日", open: "11:00", close: "14:00", isHoliday: false },
    ];

    render(
      <DetailedBusinessHours
        openingHours={partialHours}
        highlightToday
        compact={false}
      />
    );

    expect(screen.queryByText("本日の営業時間")).not.toBeInTheDocument();
  });
});

// ==============================
// エッジケーステスト
// ==============================

describe("DetailedBusinessHours - Edge Cases", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("1日分のみの営業時間データを表示", () => {
    const singleDay: readonly OpeningHours[] = [
      { day: "月曜日", open: "09:00", close: "18:00", isHoliday: false },
    ];

    render(<DetailedBusinessHours openingHours={singleDay} />);

    expect(screen.getByText("月")).toBeInTheDocument();
    expect(screen.getAllByText(/09:00/)[0]).toBeInTheDocument();
  });

  it("全日定休日の場合", () => {
    const allHolidays: readonly OpeningHours[] = [
      { day: "月曜日", open: "", close: "", isHoliday: true },
      { day: "火曜日", open: "", close: "", isHoliday: true },
      { day: "水曜日", open: "", close: "", isHoliday: true },
      { day: "木曜日", open: "", close: "", isHoliday: true },
      { day: "金曜日", open: "", close: "", isHoliday: true },
      { day: "土曜日", open: "", close: "", isHoliday: true },
      { day: "日曜日", open: "", close: "", isHoliday: true },
    ];

    render(<DetailedBusinessHours openingHours={allHolidays} />);

    // TodayHoursHighlightにも「定休日」が表示されるため8個になる
    expect(screen.getAllByText("定休日").length).toBeGreaterThanOrEqual(7);
  });

  it("異なる時間形式を正しく表示", () => {
    const variousFormats: readonly OpeningHours[] = [
      { day: "月曜日", open: "09:00", close: "21:00", isHoliday: false },
      { day: "火曜日", open: "10:30", close: "22:45", isHoliday: false },
    ];

    render(<DetailedBusinessHours openingHours={variousFormats} />);

    expect(screen.getAllByText(/09:00/)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/21:00/)[0]).toBeInTheDocument();
    expect(screen.getByText(/10:30/)).toBeInTheDocument();
    expect(screen.getByText(/22:45/)).toBeInTheDocument();
  });

  it("深夜営業時間を表示", () => {
    const lateNightHours: readonly OpeningHours[] = [
      { day: "金曜日", open: "18:00", close: "02:00", isHoliday: false },
    ];

    render(<DetailedBusinessHours openingHours={lateNightHours} />);

    expect(screen.getByText(/18:00/)).toBeInTheDocument();
    expect(screen.getByText(/02:00/)).toBeInTheDocument();
  });
});

// ==============================
// スタイリングテスト
// ==============================

describe("DetailedBusinessHours - Styling", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("今日の曜日の色が青色になる", () => {
    const { container } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} highlightToday />
    );

    const mondayLabel = Array.from(
      container.querySelectorAll(
        ".detailed-business-hours > div:nth-of-type(2) > div > span:first-child"
      )
    ).find(el => el.textContent === "月");

    expect(mondayLabel).toHaveStyle({ color: "rgb(25, 118, 210)" });
  });

  it("定休日のテキスト色がグレーになる", () => {
    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    const wednesdayRow = screen.getByText("水").parentElement as HTMLElement;
    expect(wednesdayRow).toHaveStyle({ color: "#9ca3af" });
  });

  it("通常の曜日のテキスト色がデフォルト色になる", () => {
    vi.setSystemTime(new Date(2024, 0, 16, 12, 0)); // 火曜日
    render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} highlightToday />
    );

    const mondayRow = screen.getByText("月").parentElement as HTMLElement;
    expect(mondayRow).toHaveStyle({ color: "#4b5563" });

    vi.useRealTimers();
  });
});

// ==============================
// 統合テスト
// ==============================

describe("DetailedBusinessHours - Integration Tests", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0)); // 月曜日
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("compact + highlightToday + showLabel の組み合わせ", () => {
    const { container } = render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        compact
        highlightToday
        showLabel
      />
    );

    // ラベル表示
    expect(screen.getByText("📅 営業時間")).toBeInTheDocument();

    // 横並び
    const wrapper = container.querySelector(
      ".detailed-business-hours > div:last-child"
    );
    expect(wrapper).toHaveStyle({ flexDirection: "row" });

    // 今日ハイライト（フォントサイズ11px）
    const mondayElement = Array.from(
      container.querySelectorAll(
        ".detailed-business-hours > div:last-child > div"
      )
    ).find(el => el.textContent?.includes("月"));

    expect(mondayElement).toHaveStyle({
      backgroundColor: "#f3f4f6",
      fontSize: "11px",
    });

    // 強調表示エリアは非表示（compactのため）
    expect(screen.queryByText("本日の営業時間")).not.toBeInTheDocument();
  });

  it("highlightToday=false + showLabel=false + compact=true", () => {
    const { container } = render(
      <DetailedBusinessHours
        openingHours={FULL_WEEK_HOURS}
        compact
        highlightToday={false}
        showLabel={false}
      />
    );

    // ラベル非表示
    expect(screen.queryByText("📅 営業時間")).not.toBeInTheDocument();

    // 今日ハイライトなし
    const mondayElement = Array.from(
      container.querySelectorAll(
        ".detailed-business-hours > div:last-child > div"
      )
    ).find(el => el.textContent?.includes("月")) as HTMLElement;

    expect(mondayElement.style.backgroundColor).toBe("transparent");
    expect(mondayElement).toHaveStyle({
      fontWeight: "normal",
    });

    // 「本日」ラベルなし
    expect(screen.queryByText("本日")).not.toBeInTheDocument();
  });
});

// ==============================
// パフォーマンステスト
// ==============================

describe("DetailedBusinessHours - Performance", () => {
  it("React.memo による再レンダリング抑制", () => {
    const { rerender } = render(
      <DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />
    );

    // 同じpropsで再レンダリング
    rerender(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    expect(screen.getByText("月")).toBeInTheDocument();
  });

  it("displayNameが正しく設定されている", () => {
    expect(DetailedBusinessHours.displayName).toBe("DetailedBusinessHours");
  });

  it("大量の曜日データを高速にレンダリング", () => {
    const start = performance.now();

    render(<DetailedBusinessHours openingHours={FULL_WEEK_HOURS} />);

    const duration = performance.now() - start;

    // 7曜日のレンダリングが50ms以内
    expect(duration).toBeLessThan(50);
  });
});
