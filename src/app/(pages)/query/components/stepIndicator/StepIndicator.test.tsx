import { render } from "@testing-library/react";
import StepIndicator, { CUSTOMIZE_QUERY_STEPS } from "./StepIndicator";

const STEP_LABELS = Object.values(CUSTOMIZE_QUERY_STEPS);

/**
 * Finds the step indicator segment (`<li>`) that contains the given label.
 * @param label - the visible label text of the step
 * @returns the segment element for that step
 */
function segmentFor(label: string): HTMLElement {
  // The current step's label is also echoed in the Truss heading, so scope the
  // lookup to the segment list to keep the match unambiguous.
  const segments = Array.from(
    document.querySelectorAll(".usa-step-indicator__segment"),
  ) as HTMLElement[];
  const match = segments.find((seg) =>
    seg
      .querySelector(".usa-step-indicator__segment-label")
      ?.textContent?.includes(label),
  );
  if (!match) {
    throw new Error(`No step segment found for label "${label}"`);
  }
  return match;
}

describe("StepIndicator", () => {
  it("renders every step label", () => {
    render(<StepIndicator headingLevel="h4" curStep="search" />);

    STEP_LABELS.forEach((label) => {
      expect(segmentFor(label)).toBeInTheDocument();
    });
  });

  it("marks the first step current and the rest incomplete on the initial step", () => {
    render(<StepIndicator headingLevel="h4" curStep="search" />);

    expect(segmentFor(STEP_LABELS[0])).toHaveClass(
      "usa-step-indicator__segment--current",
    );
    [1, 2, 3].forEach((i) => {
      const segment = segmentFor(STEP_LABELS[i]);
      expect(segment).not.toHaveClass("usa-step-indicator__segment--current");
      expect(segment).not.toHaveClass("usa-step-indicator__segment--complete");
    });
  });

  it("marks earlier steps complete, the active step current, and later steps incomplete", () => {
    // "select-query" is index 2 in the step order
    render(<StepIndicator headingLevel="h4" curStep="select-query" />);

    expect(segmentFor(STEP_LABELS[0])).toHaveClass(
      "usa-step-indicator__segment--complete",
    );
    expect(segmentFor(STEP_LABELS[1])).toHaveClass(
      "usa-step-indicator__segment--complete",
    );
    expect(segmentFor(STEP_LABELS[2])).toHaveClass(
      "usa-step-indicator__segment--current",
    );
    const lastSegment = segmentFor(STEP_LABELS[3]);
    expect(lastSegment).not.toHaveClass("usa-step-indicator__segment--current");
    expect(lastSegment).not.toHaveClass(
      "usa-step-indicator__segment--complete",
    );
  });

  it("marks all prior steps complete when on the final step", () => {
    render(<StepIndicator headingLevel="h4" curStep="results" />);

    [0, 1, 2].forEach((i) => {
      expect(segmentFor(STEP_LABELS[i])).toHaveClass(
        "usa-step-indicator__segment--complete",
      );
    });
    expect(segmentFor(STEP_LABELS[3])).toHaveClass(
      "usa-step-indicator__segment--current",
    );
  });

  it("applies a custom className to the container", () => {
    const { container } = render(
      <StepIndicator
        headingLevel="h4"
        curStep="search"
        className="my-custom-class"
      />,
    );

    expect(container.querySelector(".usa-step-indicator")).toHaveClass(
      "my-custom-class",
    );
  });
});
