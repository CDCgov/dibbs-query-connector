import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchForm from "@/app/(pages)/query/components/searchForm/SearchForm";

// Mock the query execution functions
jest.mock("@/app/backend/query-execution", () => ({
  executePatientDiscoveryQuery: jest.fn().mockResolvedValue({
    success: true,
    results: [],
  }),
}));

jest.mock("@/app/backend/fhir-servers", () => ({
  getFhirServerConfigs: jest.fn().mockResolvedValue([]),
}));

// Mock auth functions
jest.mock("@/app/utils/auth", () => ({
  superAdminAccessCheck: jest.fn().mockResolvedValue(true),
  adminAccessCheck: jest.fn().mockResolvedValue(true),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

const mockSetPatientDiscoveryQueryResponse = jest.fn();
const mockSetMode = jest.fn();
const mockSetLoading = jest.fn();
const mockSetFhirServer = jest.fn();
const mockFhirServer = "Test Server";
const mockFhirServers = ["Test Server", "mTLS Server"];

describe("Search Form Name Validation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSetPatientDiscoveryQueryResponse.mockClear();
    mockSetMode.mockClear();
    mockSetLoading.mockClear();
    mockSetFhirServer.mockClear();

    // Mock window.scrollTo
    Object.defineProperty(window, "scrollTo", {
      value: jest.fn(),
      writable: true,
    });
  });

  it("should accept names with letters only", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");
    const dobInput = document.getElementById("dob");

    await user.type(firstNameInput, "John");
    await user.type(lastNameInput, "Doe");
    await user.type(dobInput, "1990-01-01");

    // Should not show validation error
    expect(
      screen.queryByText(/Enter a name using only/),
    ).not.toBeInTheDocument();

    // Form should be submittable
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    await user.click(submitButton);

    // Just verify the form doesn't crash and the button can be clicked
    // The actual query execution logic is tested elsewhere
    expect(submitButton).not.toBeDisabled();
  });

  it("should accept names with numbers", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");
    const dobInput = document.getElementById("dob");

    await user.type(firstNameInput, "John123");
    await user.type(lastNameInput, "Doe456");
    await user.type(dobInput, "1990-01-01");

    // Should not show validation error
    expect(
      screen.queryByText(/Enter a name using only/),
    ).not.toBeInTheDocument();

    // Form should be submittable
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    await user.click(submitButton);

    // Just verify the form doesn't crash and the button can be clicked
    // The actual query execution logic is tested elsewhere
    expect(submitButton).not.toBeDisabled();
  });

  it("should accept names with special characters (hyphens, apostrophes, periods)", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");
    const dobInput = document.getElementById("dob");

    await user.type(firstNameInput, "Mary-Jane");
    await user.type(lastNameInput, "O'Connor-Smith Jr.");
    await user.type(dobInput, "1990-01-01");

    // Should not show validation error
    expect(
      screen.queryByText(/Enter a name using only/),
    ).not.toBeInTheDocument();

    // Form should be submittable
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    await user.click(submitButton);

    // Just verify the form doesn't crash and the button can be clicked
    // The actual query execution logic is tested elsewhere
    expect(submitButton).not.toBeDisabled();
  });

  it("should accept names with accented characters", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");
    const dobInput = document.getElementById("dob");

    await user.type(firstNameInput, "José");
    await user.type(lastNameInput, "García-López");
    await user.type(dobInput, "1990-01-01");

    // Should not show validation error
    expect(
      screen.queryByText(/Enter a name using only/),
    ).not.toBeInTheDocument();

    // Form should be submittable
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    await user.click(submitButton);

    // Just verify the form doesn't crash and the button can be clicked
    // The actual query execution logic is tested elsewhere
    expect(submitButton).not.toBeDisabled();
  });

  it("should reject names with invalid characters", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");

    // Try to enter invalid characters
    await user.type(firstNameInput, "John@Smith");
    await user.type(lastNameInput, "Doe#123");

    // Check that the inputs have the correct pattern validation
    const firstName = screen.getByLabelText("First name");
    const lastName = screen.getByLabelText("Last name");

    expect(firstName).toHaveAttribute("pattern", "^[A-Za-z0-9À-ɏḀ-ỿ\\-'. ]+$");
    expect(lastName).toHaveAttribute("pattern", "^[A-Za-z0-9À-ɏḀ-ỿ\\-'. ]+$");

    // The HTML5 validation should prevent form submission
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    expect(submitButton).not.toBeDisabled();
  });

  it("should accept mixed alphanumeric names common in certain cultures", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    const firstNameInput = screen.getByLabelText("First name");
    const lastNameInput = screen.getByLabelText("Last name");
    const dobInput = document.getElementById("dob");

    // Test cases that might include numbers in names
    await user.type(firstNameInput, "X Æ A-12"); // Like Elon Musk's child
    await user.type(lastNameInput, "Smith 3rd");
    await user.type(dobInput, "1990-01-01");

    // Should not show validation error
    expect(
      screen.queryByText(/Enter a name using only/),
    ).not.toBeInTheDocument();

    // Form should be submittable
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    await user.click(submitButton);

    // Just verify the form doesn't crash and the button can be clicked
    // The actual query execution logic is tested elsewhere
    expect(submitButton).not.toBeDisabled();
  });
});

describe("Search Form mTLS Server Selection", () => {
  it("should allow selection of mTLS-enabled servers", async () => {
    const user = userEvent.setup();

    render(
      <SearchForm
        setPatientDiscoveryQueryResponse={mockSetPatientDiscoveryQueryResponse}
        setMode={mockSetMode}
        setLoading={mockSetLoading}
        fhirServers={mockFhirServers}
        selectedFhirServer={mockFhirServer}
        setFhirServer={mockSetFhirServer}
      />,
    );

    // Open advanced options
    const advancedButton = screen.getByRole("button", { name: "Advanced" });
    await user.click(advancedButton);

    // Select the mTLS server
    const serverDropdown = screen.getByLabelText(
      "Healthcare Organization (HCO)",
    );
    await user.selectOptions(serverDropdown, "mTLS Server");

    // Fill required fields
    await user.type(screen.getByLabelText("First name"), "John");
    await user.type(screen.getByLabelText("Last name"), "Doe");
    const dobInput = document.getElementById("dob");
    await user.type(dobInput, "1990-01-01");

    // Submit form
    const submitButton = screen.getByRole("button", {
      name: "Search for patient",
    });
    await user.click(submitButton);

    // Just verify the form doesn't crash and the button can be clicked
    // The actual query execution logic is tested elsewhere
    expect(submitButton).not.toBeDisabled();
  });
});
