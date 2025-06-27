import { RefObject, useEffect } from "react";

/**
 * Helper function that traps keyboard focus within a given element. Adds an
 * event listener when target element is rendered, which constricts tabbable
 * focus to the elements' child elements (either passed as param or hard-coded below).
 * @param elementRef Ref for the element within which focus should be trapped
 * @param focusElements (optional) List of HTML element types that should receive focus
 */
export const applyFocusTrap = (
  elementRef: RefObject<HTMLElement | null>,
  focusElements?: NodeListOf<Element>,
) => {
  useEffect(() => {
    if (!elementRef) return;
    const containerElement = elementRef.current;

    const focusableElements =
      focusElements ??
      containerElement?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

    const firstElement = focusableElements?.[0];
    const lastElement = focusableElements?.[focusableElements.length - 1];

    function handleTabKeyPress(event: KeyboardEvent) {
      if (event.key === "Tab") {
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement && (lastElement as HTMLElement).focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          (firstElement as HTMLElement).focus();
        }
      }
    }

    containerElement?.addEventListener("keydown", handleTabKeyPress);

    return () => {
      containerElement?.removeEventListener("keydown", handleTabKeyPress);
    };
  }, [focusElements]);
};
