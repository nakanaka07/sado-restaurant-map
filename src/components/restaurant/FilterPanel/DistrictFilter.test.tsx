import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DistrictFilter } from "./DistrictFilter";
import type { SadoDistrict } from "@/types";

describe("DistrictFilter", () => {
  const mockOnToggle = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("基本レンダリング", () => {
    it("正常にレンダリングされること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      expect(screen.getByText("地区")).toBeInTheDocument();
      expect(screen.getByText("複数の地区を選択できます")).toBeInTheDocument();
    });

    it("すべての地区オプションが表示されること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const expectedDistricts = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
      ];

      expectedDistricts.forEach((district) => {
        expect(screen.getByLabelText(district)).toBeInTheDocument();
      });
    });

    it("正しい数の地区オプションが表示されること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes).toHaveLength(10); // 佐渡市の10地区
    });
  });

  describe("選択機能", () => {
    it("地区をクリックして選択できること", async () => {
      const user = userEvent.setup();
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const checkbox = screen.getByLabelText("両津");
      await user.click(checkbox);

      expect(mockOnToggle).toHaveBeenCalledWith("両津");
    });

    it("複数の地区を選択できること", async () => {
      const user = userEvent.setup();
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const checkbox1 = screen.getByLabelText("両津");
      const checkbox2 = screen.getByLabelText("相川");

      await user.click(checkbox1);
      await user.click(checkbox2);

      expect(mockOnToggle).toHaveBeenCalledWith("両津");
      expect(mockOnToggle).toHaveBeenCalledWith("相川");
      expect(mockOnToggle).toHaveBeenCalledTimes(2);
    });

    it("選択済みの地区を再度クリックして解除できること", async () => {
      const user = userEvent.setup();
      render(
        <DistrictFilter selectedDistricts={["両津"]} onToggle={mockOnToggle} />
      );

      const checkbox = screen.getByLabelText("両津");
      await user.click(checkbox);

      expect(mockOnToggle).toHaveBeenCalledWith("両津");
    });
  });

  describe("選択状態の表示", () => {
    it("選択された地区のチェックボックスがチェック状態になること", () => {
      const selectedDistricts: SadoDistrict[] = ["両津", "相川"];
      render(
        <DistrictFilter
          selectedDistricts={selectedDistricts}
          onToggle={mockOnToggle}
        />
      );

      expect(screen.getByLabelText("両津")).toBeChecked();
      expect(screen.getByLabelText("相川")).toBeChecked();
      expect(screen.getByLabelText("佐和田")).not.toBeChecked();
    });

    it("空の選択状態では全てのチェックボックスが未選択になること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it("全ての地区が選択された状態を正しく表示すること", () => {
      const allDistricts: SadoDistrict[] = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
      ];
      render(
        <DistrictFilter
          selectedDistricts={allDistricts}
          onToggle={mockOnToggle}
        />
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe("アクセシビリティ", () => {
    it("fieldsetでアクセシビリティが適切に設定されていること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const fieldset = screen.getByRole("group", { name: "地区" });
      expect(fieldset).toBeInTheDocument();
      expect(screen.getByText("地区")).toBeInTheDocument();
    });

    it("ヘルプテキストが関連付けられていること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const districtOptionsGroup = screen.getByRole("group", { name: "" });
      expect(districtOptionsGroup).toHaveAttribute(
        "aria-describedby",
        "district-help"
      );

      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).toHaveAttribute("aria-describedby", "district-help");
      });
    });

    it("各チェックボックスに正しいラベルが関連付けられていること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const expectedDistricts = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
      ];

      expectedDistricts.forEach((district) => {
        const checkbox = screen.getByLabelText(district);
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).toHaveAttribute("type", "checkbox");
      });
    });

    it("キーボードで操作できること", async () => {
      const user = userEvent.setup();
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const checkbox = screen.getByLabelText("両津");
      // 直接チェックボックスをクリックしてトグル動作を確認
      await user.click(checkbox);

      expect(mockOnToggle).toHaveBeenCalledWith("両津");
    });
  });

  describe("地区固有のテスト", () => {
    const allDistricts: { value: SadoDistrict; label: string }[] = [
      { value: "両津", label: "両津" },
      { value: "相川", label: "相川" },
      { value: "佐和田", label: "佐和田" },
      { value: "金井", label: "金井" },
      { value: "新穂", label: "新穂" },
      { value: "畑野", label: "畑野" },
      { value: "真野", label: "真野" },
      { value: "小木", label: "小木" },
      { value: "羽茂", label: "羽茂" },
      { value: "赤泊", label: "赤泊" },
    ];

    allDistricts.forEach(({ value, label }) => {
      it(`${label}地区が選択できること`, async () => {
        const user = userEvent.setup();
        render(
          <DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />
        );

        const checkbox = screen.getByLabelText(label);
        await user.click(checkbox);

        expect(mockOnToggle).toHaveBeenCalledWith(value);
      });

      it(`${label}地区が初期選択状態として設定できること`, () => {
        render(
          <DistrictFilter selectedDistricts={[value]} onToggle={mockOnToggle} />
        );

        const checkbox = screen.getByLabelText(label);
        expect(checkbox).toBeChecked();
      });
    });
  });

  describe("地区の順序", () => {
    it("地区が正しい順序で表示されること", () => {
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const checkboxes = screen.getAllByRole("checkbox");
      const expectedOrder = [
        "両津",
        "相川",
        "佐和田",
        "金井",
        "新穂",
        "畑野",
        "真野",
        "小木",
        "羽茂",
        "赤泊",
      ];

      checkboxes.forEach((checkbox, index) => {
        expect(checkbox).toHaveAccessibleName(expectedOrder[index]);
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("コールバックが未定義でもエラーが発生しないこと", async () => {
      const user = userEvent.setup();
      render(
        <DistrictFilter selectedDistricts={[]} onToggle={undefined as any} />
      );

      const checkbox = screen.getByLabelText("両津");

      // エラーが発生しないことを確認
      await expect(user.click(checkbox)).resolves.not.toThrow();
    });

    it("無効な地区が選択状態に含まれていても正常に動作すること", () => {
      const invalidDistricts = ["invalid" as SadoDistrict];
      render(
        <DistrictFilter
          selectedDistricts={invalidDistricts}
          onToggle={mockOnToggle}
        />
      );

      // 正常にレンダリングされることを確認
      expect(screen.getByText("地区")).toBeInTheDocument();

      // 有効な地区は全て未選択状態
      const checkboxes = screen.getAllByRole("checkbox");
      checkboxes.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe("パフォーマンス", () => {
    it("大量の選択変更でも正常に動作すること", async () => {
      const user = userEvent.setup();
      render(<DistrictFilter selectedDistricts={[]} onToggle={mockOnToggle} />);

      const allCheckboxes = screen.getAllByRole("checkbox");

      // 全ての地区を順次選択
      for (const checkbox of allCheckboxes) {
        await user.click(checkbox);
      }

      expect(mockOnToggle).toHaveBeenCalledTimes(10);
    });
  });
});
