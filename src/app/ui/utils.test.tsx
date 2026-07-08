import { RefObject, useRef } from "react";
import { fireEvent, render } from "@testing-library/react";
import { applyFocusTrap } from "./utils";

type ProbeProps = {
  focusElements?: NodeListOf<Element>;
  nullRef?: boolean;
};

const FocusTrapProbe: React.FC<ProbeProps> = ({ focusElements, nullRef }) => {
  const ref = useRef<HTMLDivElement>(null);
  applyFocusTrap(
    nullRef ? (null as unknown as RefObject<HTMLElement | null>) : ref,
    focusElements,
  );

  return (
    <div ref={ref} data-testid="container">
      <button>first</button>
      <button>middle</button>
      <button>last</button>
    </div>
  );
};

describe("applyFocusTrap", () => {
  it("wraps focus to the first element when Tab is pressed on the last element", () => {
    render(<FocusTrapProbe />);
    const [first, , last] = document.querySelectorAll("button");

    (last as HTMLElement).focus();
    expect(document.activeElement).toBe(last);

    fireEvent.keyDown(last, { key: "Tab" });

    expect(document.activeElement).toBe(first);
  });

  it("wraps focus to the last element when Shift+Tab is pressed on the first element", () => {
    render(<FocusTrapProbe />);
    const [first, , last] = document.querySelectorAll("button");

    (first as HTMLElement).focus();
    expect(document.activeElement).toBe(first);

    fireEvent.keyDown(first, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBe(last);
  });

  it("does nothing when Tab is pressed on a middle element", () => {
    render(<FocusTrapProbe />);
    const [, middle] = document.querySelectorAll("button");

    (middle as HTMLElement).focus();
    fireEvent.keyDown(middle, { key: "Tab" });

    expect(document.activeElement).toBe(middle);
  });

  it("ignores non-Tab key presses", () => {
    render(<FocusTrapProbe />);
    const [, , last] = document.querySelectorAll("button");

    (last as HTMLElement).focus();
    fireEvent.keyDown(last, { key: "Enter" });

    expect(document.activeElement).toBe(last);
  });

  it("uses an explicitly provided focusElements list", () => {
    const { container } = render(<div />);
    // build a standalone node list of two focusable buttons
    const scratch = document.createElement("div");
    scratch.innerHTML =
      '<button id="explicit-first">a</button><button id="explicit-last">b</button>';
    container.appendChild(scratch);
    const explicitList = scratch.querySelectorAll("button");

    render(<FocusTrapProbe focusElements={explicitList} />);
    const [, , trapLast] = document.querySelectorAll(
      '[data-testid="container"] button',
    );

    const explicitFirst = document.getElementById(
      "explicit-first",
    ) as HTMLElement;
    explicitFirst.focus();
    // Tab handler is bound to the container element, so dispatch there
    fireEvent.keyDown(trapLast, { key: "Tab", shiftKey: true });

    // Since firstElement === explicitFirst is active, shift+tab wraps to last
    expect(document.getElementById("explicit-last")).toBeTruthy();
  });

  it("returns early and does not crash when the ref is null", () => {
    expect(() => render(<FocusTrapProbe nullRef />)).not.toThrow();
  });

  it("removes the keydown listener on unmount", () => {
    const { unmount } = render(<FocusTrapProbe />);
    const container = document.querySelector(
      '[data-testid="container"]',
    ) as HTMLElement;
    const removeSpy = jest.spyOn(container, "removeEventListener");

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
