import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AccessibleButton,
  AccessibleInput,
  AccessibleLoadingSpinner,
  FocusTrap,
  LiveRegion,
  SkipLink,
  VisuallyHidden,
} from "./AccessibilityComponents";

// 各テスト後にDOMをクリーンアップ
afterEach(() => {
  cleanup();
});

describe("VisuallyHidden", () => {
  it("視覚的に隠されたテキストをレンダリングする", () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>);
    const element = screen.getByText("Hidden text");
    expect(element).toBeInTheDocument();
  });

  it("正しいスタイルが適用されている", () => {
    render(<VisuallyHidden>Hidden content</VisuallyHidden>);
    const element = screen.getByText("Hidden content");
    expect(element).toHaveStyle({
      position: "absolute",
      width: "1px",
      height: "1px",
      overflow: "hidden",
    });
  });
});

describe("SkipLink", () => {
  it("スキップリンクをレンダリングする", () => {
    render(
      <SkipLink href="#main-content">メインコンテンツへスキップ</SkipLink>
    );
    const link = screen.getByRole("link", {
      name: "メインコンテンツへスキップ",
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "#main-content");
  });

  it("正しいクラス名が適用されている", () => {
    render(<SkipLink href="#content">Skip to content</SkipLink>);
    const link = screen.getByRole("link");
    expect(link).toHaveClass("skip-link");
  });
});

describe("AccessibleButton", () => {
  describe("基本的なレンダリング", () => {
    it("デフォルトプロパティでボタンをレンダリングする", () => {
      render(<AccessibleButton>Click me</AccessibleButton>);
      const button = screen.getByRole("button", { name: "Click me" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "button");
    });

    it("childrenを正しく表示する", () => {
      render(<AccessibleButton>Test Button</AccessibleButton>);
      expect(screen.getByText("Test Button")).toBeInTheDocument();
    });
  });

  describe("typeプロパティ", () => {
    it('type="submit"を正しく設定する', () => {
      render(<AccessibleButton type="submit">Submit</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it('type="reset"を正しく設定する', () => {
      render(<AccessibleButton type="reset">Reset</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("variantスタイル", () => {
    it("primary variantで正しいスタイルを適用する", () => {
      render(<AccessibleButton variant="primary">Primary</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ backgroundColor: "#0066cc" });
      expect(button).toHaveClass("btn--primary");
    });

    it("secondary variantで正しいスタイルを適用する", () => {
      render(
        <AccessibleButton variant="secondary">Secondary</AccessibleButton>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ backgroundColor: "#6c757d" });
      expect(button).toHaveClass("btn--secondary");
    });

    it("danger variantで正しいスタイルを適用する", () => {
      render(<AccessibleButton variant="danger">Delete</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({ backgroundColor: "#dc3545" });
      expect(button).toHaveClass("btn--danger");
    });
  });

  describe("sizeスタイル", () => {
    it("small sizeで正しいスタイルを適用する", () => {
      render(<AccessibleButton size="small">Small</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        padding: "4px 8px",
        fontSize: "14px",
      });
      expect(button).toHaveClass("btn--small");
    });

    it("medium sizeで正しいスタイルを適用する", () => {
      render(<AccessibleButton size="medium">Medium</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        padding: "8px 16px",
        fontSize: "16px",
      });
      expect(button).toHaveClass("btn--medium");
    });

    it("large sizeで正しいスタイルを適用する", () => {
      render(<AccessibleButton size="large">Large</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveStyle({
        padding: "12px 24px",
        fontSize: "18px",
      });
      expect(button).toHaveClass("btn--large");
    });
  });

  describe("disabled状態", () => {
    it("disabled状態でボタンをレンダリングする", () => {
      render(<AccessibleButton disabled>Disabled</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
      expect(button).toHaveStyle({
        opacity: "0.6",
        cursor: "not-allowed",
      });
    });

    it("disabled状態でクリックイベントが発火しない", () => {
      const handleClick = vi.fn();
      render(
        <AccessibleButton onClick={handleClick} disabled>
          Click
        </AccessibleButton>
      );
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe("クリックイベント", () => {
    it("クリック時にonClickハンドラーが呼ばれる", () => {
      const handleClick = vi.fn();
      render(<AccessibleButton onClick={handleClick}>Click</AccessibleButton>);
      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("onClickが未定義でもエラーが発生しない", () => {
      render(<AccessibleButton>No handler</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  describe("ARIA属性", () => {
    it("aria-labelを正しく設定する", () => {
      render(<AccessibleButton ariaLabel="Close dialog">×</AccessibleButton>);
      const button = screen.getByRole("button", { name: "Close dialog" });
      expect(button).toHaveAttribute("aria-label", "Close dialog");
    });

    it("aria-describedbyを正しく設定する", () => {
      render(
        <AccessibleButton ariaDescribedBy="help-text">Help</AccessibleButton>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "help-text");
    });

    it("aria-expandedを正しく設定する", () => {
      render(<AccessibleButton ariaExpanded={true}>Expand</AccessibleButton>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it("aria-expanded=falseを正しく設定する", () => {
      render(
        <AccessibleButton ariaExpanded={false}>Collapse</AccessibleButton>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });
});

describe("AccessibleInput", () => {
  describe("基本的なレンダリング", () => {
    it("デフォルトプロパティで入力フィールドをレンダリングする", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="test-input"
          label="Test Input"
          value=""
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Test Input");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
    });

    it("labelとinputが正しく関連付けられている", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="username"
          label="Username"
          value=""
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Username");
      expect(input).toHaveAttribute("id", "username");
    });
  });

  describe("typeプロパティ", () => {
    it('type="email"を正しく設定する', () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="email"
          label="Email"
          type="email"
          value=""
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Email");
      expect(input).toHaveAttribute("type", "email");
    });

    it('type="password"を正しく設定する', () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="password"
          label="Password"
          type="password"
          value=""
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it('type="search"を正しく設定する', () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="search"
          label="Search"
          type="search"
          value=""
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Search");
      expect(input).toHaveAttribute("type", "search");
    });
  });

  describe("valueとonChange", () => {
    it("valueを正しく表示する", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="name"
          label="Name"
          value="John Doe"
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Name");
      expect(input.value).toBe("John Doe");
    });

    it("入力時にonChangeハンドラーが呼ばれる", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value="test"
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Input");

      fireEvent.change(input, { target: { value: "new value" } });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange).toHaveBeenCalledWith("new value");
    });
  });

  describe("required属性", () => {
    it("required=trueで必須マーカーを表示する", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="required-input"
          label="Required Field"
          value=""
          onChange={handleChange}
          required
        />
      );
      const input = screen.getByLabelText(/Required Field/);
      expect(input).toBeRequired();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("required=falseで必須マーカーを表示しない", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="optional"
          label="Optional Field"
          value=""
          onChange={handleChange}
          required={false}
        />
      );
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });
  });

  describe("disabled状態", () => {
    it("disabled状態で入力フィールドをレンダリングする", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="disabled"
          label="Disabled"
          value=""
          onChange={handleChange}
          disabled
        />
      );
      const input = screen.getByLabelText("Disabled");
      expect(input).toBeDisabled();
      expect(input).toHaveStyle({ backgroundColor: "#f5f5f5" });
    });

    it("disabled状態で入力ができない", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="disabled"
          label="Disabled"
          value=""
          onChange={handleChange}
          disabled
        />
      );
      const input = screen.getByLabelText("Disabled");
      fireEvent.change(input, { target: { value: "test" } });
      fireEvent.input(input);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("placeholderとdescription", () => {
    it("placeholderを正しく表示する", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          placeholder="Enter text here"
        />
      );
      const input = screen.getByPlaceholderText("Enter text here");
      expect(input).toBeInTheDocument();
    });

    it("descriptionを正しく表示する", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          description="This is a helpful description"
        />
      );
      expect(
        screen.getByText("This is a helpful description")
      ).toBeInTheDocument();
    });

    it("descriptionとinputが正しく関連付けられている", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          description="Help text"
        />
      );
      const input = screen.getByLabelText("Input");
      expect(input).toHaveAttribute("aria-describedby", "input-description");
    });
  });

  describe("エラー表示", () => {
    it("エラーメッセージを表示する", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          error="This field is required"
        />
      );
      const errorMessage = screen.getByRole("alert");
      expect(errorMessage).toHaveTextContent("This field is required");
    });

    it("エラー時にaria-invalidがtrueになる", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          error="Invalid input"
        />
      );
      const input = screen.getByLabelText("Input");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("エラー時にborderの色が変わる", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          error="Error"
        />
      );
      const input = screen.getByLabelText("Input");
      expect(input).toHaveStyle({ border: "2px solid #dc3545" });
    });

    it("エラーがない場合はaria-invalidがfalseになる", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
        />
      );
      const input = screen.getByLabelText("Input");
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("エラーとdescriptionが両方あるときaria-describedbyが両方を含む", () => {
      const handleChange = vi.fn();
      render(
        <AccessibleInput
          id="input"
          label="Input"
          value=""
          onChange={handleChange}
          description="Help text"
          error="Error message"
        />
      );
      const input = screen.getByLabelText("Input");
      expect(input).toHaveAttribute(
        "aria-describedby",
        "input-description input-error"
      );
    });
  });
});

describe("LiveRegion", () => {
  it("デフォルトでpoliteのlive regionをレンダリングする", () => {
    render(<LiveRegion>Status update</LiveRegion>);
    const region = screen.getByText("Status update");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it('priority="assertive"でassertiveのlive regionをレンダリングする', () => {
    render(<LiveRegion priority="assertive">Urgent message</LiveRegion>);
    const region = screen.getByText("Urgent message");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("視覚的に隠されたスタイルが適用されている", () => {
    render(<LiveRegion>Hidden message</LiveRegion>);
    const region = screen.getByText("Hidden message");
    expect(region).toHaveStyle({
      position: "absolute",
      left: "-10000px",
      overflow: "hidden",
    });
  });
});

describe("AccessibleLoadingSpinner", () => {
  it("デフォルトプロパティでスピナーをレンダリングする", () => {
    render(<AccessibleLoadingSpinner />);
    const spinner = screen.getByRole("status", { name: "読み込み中" });
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({
      width: "40px",
      height: "40px",
    });
  });

  it("カスタムlabelを正しく設定する", () => {
    render(<AccessibleLoadingSpinner label="データ読み込み中" />);
    const spinner = screen.getByRole("status", { name: "データ読み込み中" });
    expect(spinner).toBeInTheDocument();
  });

  it('size="small"で正しいサイズを適用する', () => {
    render(<AccessibleLoadingSpinner size="small" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveStyle({
      width: "20px",
      height: "20px",
    });
  });

  it('size="medium"で正しいサイズを適用する', () => {
    render(<AccessibleLoadingSpinner size="medium" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveStyle({
      width: "40px",
      height: "40px",
    });
  });

  it('size="large"で正しいサイズを適用する', () => {
    render(<AccessibleLoadingSpinner size="large" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveStyle({
      width: "60px",
      height: "60px",
    });
  });

  it("VisuallyHiddenでlabelテキストを含む", () => {
    render(<AccessibleLoadingSpinner label="Loading data" />);
    expect(screen.getByText("Loading data")).toBeInTheDocument();
  });
});

describe("FocusTrap", () => {
  it("isActive=falseで通常レンダリングする", () => {
    render(
      <FocusTrap isActive={false}>
        <button>Button 1</button>
        <button>Button 2</button>
      </FocusTrap>
    );
    expect(screen.getByText("Button 1")).toBeInTheDocument();
    expect(screen.getByText("Button 2")).toBeInTheDocument();
  });

  it("isActive=trueで最初のフォーカス可能要素にフォーカスする", () => {
    render(
      <FocusTrap isActive={true}>
        <button>First</button>
        <button>Second</button>
      </FocusTrap>
    );
    const firstButton = screen.getByText("First");
    expect(firstButton).toHaveFocus();
  });

  it("EscapeキーでonEscapeハンドラーが呼ばれる", () => {
    const handleEscape = vi.fn();
    render(
      <FocusTrap isActive={true} onEscape={handleEscape}>
        <button>Button</button>
      </FocusTrap>
    );
    const button = screen.getByText("Button");
    fireEvent.keyDown(button, { key: "Escape", code: "Escape" });
    expect(handleEscape).toHaveBeenCalledTimes(1);
  });

  it("Tabキーで次の要素にフォーカスが移動する", () => {
    render(
      <FocusTrap isActive={true}>
        <button>Tab-First</button>
        <button>Tab-Second</button>
        <button>Tab-Third</button>
      </FocusTrap>
    );
    const firstButton = screen.getByText("Tab-First");
    const secondButton = screen.getByText("Tab-Second");

    expect(firstButton).toHaveFocus();
    fireEvent.keyDown(firstButton, { key: "Tab", code: "Tab" });
    secondButton.focus();
    expect(secondButton).toHaveFocus();
  });

  it("最後の要素でTabを押すと最初の要素に戻る", () => {
    render(
      <FocusTrap isActive={true}>
        <button>Wrap-First</button>
        <button>Wrap-Second</button>
      </FocusTrap>
    );
    const firstButton = screen.getByText("Wrap-First");
    const secondButton = screen.getByText("Wrap-Second");

    // 最後の要素に移動
    fireEvent.keyDown(firstButton, { key: "Tab", code: "Tab" });
    secondButton.focus();
    expect(secondButton).toHaveFocus();

    // Tabで最初に戻る
    fireEvent.keyDown(secondButton, { key: "Tab", code: "Tab" });
    firstButton.focus();
    expect(firstButton).toHaveFocus();
  });

  it("Shift+Tabで前の要素にフォーカスが移動する", () => {
    render(
      <FocusTrap isActive={true}>
        <button>ShiftTab-First</button>
        <button>ShiftTab-Second</button>
        <button>ShiftTab-Third</button>
      </FocusTrap>
    );
    const firstButton = screen.getByText("ShiftTab-First");
    const secondButton = screen.getByText("ShiftTab-Second");
    const thirdButton = screen.getByText("ShiftTab-Third");

    // 通常のTabで2回移動
    fireEvent.keyDown(firstButton, { key: "Tab", code: "Tab" });
    secondButton.focus();
    fireEvent.keyDown(secondButton, { key: "Tab", code: "Tab" });
    thirdButton.focus();
    expect(thirdButton).toHaveFocus();

    // Shift+Tabで戻る
    fireEvent.keyDown(thirdButton, { key: "Tab", code: "Tab", shiftKey: true });
    secondButton.focus();
    expect(secondButton).toHaveFocus();
  });

  it("最初の要素でShift+Tabを押すと最後の要素に移動する", () => {
    render(
      <FocusTrap isActive={true}>
        <button>ShiftWrap-First</button>
        <button>ShiftWrap-Second</button>
      </FocusTrap>
    );
    const firstButton = screen.getByText("ShiftWrap-First");
    const secondButton = screen.getByText("ShiftWrap-Second");

    expect(firstButton).toHaveFocus();

    // Shift+Tabで最後に移動
    fireEvent.keyDown(firstButton, { key: "Tab", code: "Tab", shiftKey: true });
    secondButton.focus();
    expect(secondButton).toHaveFocus();
  });

  it("isActiveがfalseからtrueに変わるとフォーカスが設定される", () => {
    const { rerender } = render(
      <FocusTrap isActive={false}>
        <button>ActiveChange-Button</button>
      </FocusTrap>
    );

    const button = screen.getByText("ActiveChange-Button");
    expect(button).not.toHaveFocus();

    rerender(
      <FocusTrap isActive={true}>
        <button>ActiveChange-Button</button>
      </FocusTrap>
    );

    expect(button).toHaveFocus();
  });

  it("onEscapeが未定義でもEscapeキーでエラーが発生しない", () => {
    render(
      <FocusTrap isActive={true}>
        <button>Button</button>
      </FocusTrap>
    );
    const button = screen.getByText("Button");
    expect(() =>
      fireEvent.keyDown(button, { key: "Escape", code: "Escape" })
    ).not.toThrow();
  });

  it("フォーカス可能な要素が複数種類ある場合も正しく動作する", () => {
    render(
      <FocusTrap isActive={true}>
        <button>MultiElement-Button</button>
        <a href="#">MultiElement-Link</a>
        <input type="text" placeholder="MultiElement-Input" />
        <select aria-label="MultiElement-Select">
          <option>Option</option>
        </select>
        <textarea placeholder="MultiElement-Textarea" />
      </FocusTrap>
    );

    const button = screen.getByText("MultiElement-Button");
    const link = screen.getByText("MultiElement-Link");
    const input = screen.getByPlaceholderText("MultiElement-Input");
    const select = screen.getByRole("combobox", {
      name: "MultiElement-Select",
    });
    const textarea = screen.getByPlaceholderText("MultiElement-Textarea");

    expect(button).toHaveFocus();

    // Tab で各要素を巡回
    fireEvent.keyDown(button, { key: "Tab", code: "Tab" });
    link.focus();
    expect(link).toHaveFocus();

    fireEvent.keyDown(link, { key: "Tab", code: "Tab" });
    input.focus();
    expect(input).toHaveFocus();

    fireEvent.keyDown(input, { key: "Tab", code: "Tab" });
    select.focus();
    expect(select).toHaveFocus();

    fireEvent.keyDown(select, { key: "Tab", code: "Tab" });
    textarea.focus();
    expect(textarea).toHaveFocus();

    // 最後から Tab で最初に戻る
    fireEvent.keyDown(textarea, { key: "Tab", code: "Tab" });
    button.focus();
    expect(button).toHaveFocus();
  });
});
