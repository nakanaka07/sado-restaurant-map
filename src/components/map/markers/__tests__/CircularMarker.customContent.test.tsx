import { render, screen } from "@testing-library/react";
import { CircularMarker } from "../CircularMarker";
import ToiletHistogram from "../ToiletHistogram";

// Basic test to ensure customContent replaces default img

describe("CircularMarker customContent", () => {
  it("renders customContent and omits default icon img", () => {
    render(
      <CircularMarker
        category="toilet"
        size="medium"
        interactive={false}
        customContent={
          <ToiletHistogram values={[0.2, 0.5, 0.8]} ariaLabel="使用状況" />
        }
      />
    );

    // Histogram should be in the document (by aria-label)
    expect(screen.getByLabelText("使用状況")).toBeInTheDocument();

    // Default img (alt="") should not exist
    const imgs = screen.queryAllByRole("img", { hidden: true });
    // We expect only the svg role=img; ensure no plain img tag with empty alt
    const hasEmptyAltImg = imgs.some(
      img => (img as HTMLImageElement).alt === ""
    );
    expect(hasEmptyAltImg).toBe(false);
  });
});
