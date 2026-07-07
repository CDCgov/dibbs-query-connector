import { render, screen } from "@testing-library/react";
import { renderWithUser } from "@/app/tests/unit/setup";
import ConceptSelection from "./ConceptSelection";
import { FilterableConcept } from "./utils";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

const mockToast = showToastConfirmation as jest.Mock;

/**
 * Builds a list of filterable concepts for the table.
 * @param overrides - per-concept overrides merged onto the defaults
 * @returns an array of FilterableConcept
 */
function makeConcepts(
  overrides: Partial<FilterableConcept>[] = [],
): FilterableConcept[] {
  const base: FilterableConcept[] = [
    { code: "A1", display: "Apple", include: true, render: true },
    { code: "B2", display: "Banana", include: true, render: true },
  ];
  return base.map((c, i) => ({ ...c, ...(overrides[i] ?? {}) }));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ConceptSelection", () => {
  it("renders a row with code and name for each rendered concept", () => {
    render(
      <ConceptSelection
        concepts={makeConcepts()}
        onConceptsChange={jest.fn()}
      />,
    );

    expect(screen.getByText("A1")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("B2")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
  });

  it("shows the empty header when no concepts should render", () => {
    render(
      <ConceptSelection
        concepts={makeConcepts([{ render: false }, { render: false }])}
        onConceptsChange={jest.fn()}
      />,
    );

    expect(screen.getByText("No matching codes found")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).not.toBeInTheDocument();
  });

  it("does not render a row for a concept flagged render:false", () => {
    render(
      <ConceptSelection
        concepts={makeConcepts([{}, { render: false }])}
        onConceptsChange={jest.fn()}
      />,
    );

    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.queryByText("Banana")).not.toBeInTheDocument();
  });

  it("toggling a single concept off calls onConceptsChange and a 'removed' toast", async () => {
    const onConceptsChange = jest.fn();
    const { user } = renderWithUser(
      <ConceptSelection
        concepts={makeConcepts()}
        onConceptsChange={onConceptsChange}
      />,
    );

    await user.click(document.getElementById("checkbox-A1") as HTMLElement);

    expect(onConceptsChange).toHaveBeenCalledTimes(1);
    const updated = onConceptsChange.mock.calls[0][0] as FilterableConcept[];
    expect(updated[0].include).toBe(false);
    expect(updated[1].include).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ body: "A1 successfully removed" }),
    );
  });

  it("toggling a single concept on calls onConceptsChange and an 'added' toast", async () => {
    const onConceptsChange = jest.fn();
    const { user } = renderWithUser(
      <ConceptSelection
        concepts={makeConcepts([{ include: false }, { include: false }])}
        onConceptsChange={onConceptsChange}
      />,
    );

    await user.click(document.getElementById("checkbox-A1") as HTMLElement);

    const updated = onConceptsChange.mock.calls[0][0] as FilterableConcept[];
    expect(updated[0].include).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ body: "A1 successfully added" }),
    );
  });

  it("select-all when nothing is selected includes every rendered concept", async () => {
    const onConceptsChange = jest.fn();
    const { user } = renderWithUser(
      <ConceptSelection
        concepts={makeConcepts([{ include: false }, { include: false }])}
        onConceptsChange={onConceptsChange}
      />,
    );

    await user.click(document.getElementById("toggleAll") as HTMLElement);

    const updated = onConceptsChange.mock.calls[0][0] as FilterableConcept[];
    expect(updated.every((c) => c.include)).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ body: "2 code(s) successfully added" }),
    );
  });

  it("toggle-all when everything is selected removes every rendered concept", async () => {
    const onConceptsChange = jest.fn();
    const { user } = renderWithUser(
      <ConceptSelection
        concepts={makeConcepts()}
        onConceptsChange={onConceptsChange}
      />,
    );

    await user.click(document.getElementById("toggleAll") as HTMLElement);

    const updated = onConceptsChange.mock.calls[0][0] as FilterableConcept[];
    expect(updated.every((c) => !c.include)).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ body: "2 code(s) successfully removed" }),
    );
  });

  it("toggle-all from a partial (minus) state deselects all and reports 'removed'", async () => {
    const onConceptsChange = jest.fn();
    const { user } = renderWithUser(
      <ConceptSelection
        concepts={makeConcepts([{ include: true }, { include: false }])}
        onConceptsChange={onConceptsChange}
      />,
    );

    await user.click(document.getElementById("toggleAll") as HTMLElement);

    const updated = onConceptsChange.mock.calls[0][0] as FilterableConcept[];
    expect(updated.every((c) => !c.include)).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ body: "2 code(s) successfully removed" }),
    );
  });

  it("toggle-all leaves non-rendered concepts untouched", async () => {
    const onConceptsChange = jest.fn();
    const { user } = renderWithUser(
      <ConceptSelection
        concepts={makeConcepts([
          { include: false },
          { include: false, render: false },
        ])}
        onConceptsChange={onConceptsChange}
      />,
    );

    await user.click(document.getElementById("toggleAll") as HTMLElement);

    const updated = onConceptsChange.mock.calls[0][0] as FilterableConcept[];
    // only the rendered concept is toggled; the hidden one is returned as-is
    expect(updated[0].include).toBe(true);
    expect(updated[1].include).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ body: "1 code(s) successfully added" }),
    );
  });

  it("highlights matching text when a search filter is supplied", () => {
    render(
      <ConceptSelection
        concepts={makeConcepts()}
        onConceptsChange={jest.fn()}
        searchFilter={["App"]}
      />,
    );

    const highlight = document.querySelector(".searchHighlight");
    expect(highlight).not.toBeNull();
    expect(highlight).toHaveTextContent("App");
  });
});
