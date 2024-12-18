import QueryBuilding from "./page";
import { render, screen } from "@testing-library/react";

describe("tests the query building steps", () => {
  it("renders", () => {
    render(<QueryBuilding />);
    expect(screen.getByText("My queries")).toBeInTheDocument();
    expect(screen.getByText("No custom queries available")).toBeInTheDocument();
  });
});
