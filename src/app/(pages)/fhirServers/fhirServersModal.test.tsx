import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FhirServersModal } from "./fhirServersModal";
import { FhirServerConfig } from "@/app/models/entities/fhir-servers";
import { ModalMode } from "./page";

// Mock the backend services
jest.mock("@/app/backend/fhir-servers/service", () => ({
  insertFhirServer: jest.fn(),
  updateFhirServer: jest.fn(),
  deleteFhirServer: jest.fn(),
  getFhirServerConfigs: jest.fn().mockResolvedValue([]),
  updateFhirServerConnectionStatus: jest.fn(),
}));

// Mock the test utilities
jest.mock("@/app/backend/fhir-servers/test-utils", () => ({
  testFhirServerConnection: jest.fn().mockResolvedValue({ success: true }),
  checkFhirServerSupportsMatch: jest
    .fn()
    .mockResolvedValue({ supportsMatch: false, fhirVersion: "4.0.1" }),
  validateFhirServerUrl: jest.fn().mockResolvedValue(undefined),
}));

// Mock the toast component
jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

// Mock dynamic imports
jest.mock("next/dynamic", () => () => {
  return function MockModal({
    children,
    buttons,
    heading,
    ...props
  }: React.PropsWithChildren<{
    buttons?: Array<{
      text: string | React.JSX.Element;
      type: string;
      id?: string;
      className?: string;
      onClick: () => void;
    }>;
    heading?: string;
  }>) {
    return (
      <div data-testid="modal">
        <h1>{heading}</h1>
        {children}
        {buttons && (
          <div data-testid="modal-footer">
            {buttons.map((button, index) => (
              <button
                key={index}
                type={button.type as "button" | "submit" | "reset"}
                id={button.id}
                className={button.className}
                onClick={button.onClick}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
});

const mockFhirServers: FhirServerConfig[] = [
  {
    id: "1",
    name: "Test Server",
    hostname: "https://test.example.com/fhir",
    authType: "none",
    disableCertValidation: false,
    defaultServer: false,
    patientMatchConfiguration: {
      enabled: false,
      onlySingleMatch: false,
      onlyCertainMatches: false,
      matchCount: 0,
      supportsMatch: false,
    },
  },
];

const defaultProps = {
  fhirServers: mockFhirServers,
  setFhirServers: jest.fn(),
  modalMode: "create" as ModalMode,
  serverToEdit: undefined,
  setSelectedFhirServer: jest.fn(),
  patientMatchData: undefined,
  setPatientMatchData: jest.fn(),
  modalRef: { current: null },
};

describe("FhirServersModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Mutual TLS Authentication", () => {
    it("should show CA certificate field when Mutual TLS is selected", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Select Mutual TLS auth method
      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      // Check if CA certificate field appears
      expect(
        screen.getByLabelText(/Server CA Certificate/),
      ).toBeInTheDocument();
      expect(screen.getByTestId("ca-cert")).toBeInTheDocument();
    });

    it("should show optional indicator for CA certificate field", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      const caCertLabel = screen.getByLabelText(/Server CA Certificate/);
      expect(caCertLabel).toBeInTheDocument();

      // Check that the CA cert label contains "(optional)"
      expect(screen.getByText("Server CA Certificate")).toBeInTheDocument();
      const caCertContainer = screen
        .getByText("Server CA Certificate")
        .closest("label");
      expect(caCertContainer).toHaveTextContent("(optional)");
    });

    it("should update CA certificate value when user types", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      const caCertTextarea = screen.getByTestId("ca-cert");
      const testCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT\n-----END CERTIFICATE-----";

      await user.type(caCertTextarea, testCert);

      expect(caCertTextarea).toHaveValue(testCert);
    });

    it("should allow submission when CA certificate is empty for mutual TLS", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;
      mockInsertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "new-id" },
      });

      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByTestId("server-name"), "Test mTLS Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://test-mtls.example.com/fhir",
      );

      // Select Mutual TLS without providing CA cert
      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      // Submit without CA cert should succeed
      const addButton = screen.getByRole("button", {
        name: /Add server|Save changes/i,
      });
      await user.click(addButton);

      // Should successfully call insertFhirServer with empty caCert
      await waitFor(() => {
        expect(mockInsertFhirServer).toHaveBeenCalledWith(
          "Test mTLS Server",
          "https://test-mtls.example.com/fhir",
          false,
          false,
          true, // connection success
          expect.objectContaining({
            authType: "mutual-tls",
            caCert: undefined, // Should be undefined when not provided
          }),
          expect.any(Object),
        );
      });
    });

    it("should not show CA certificate field for other auth methods", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Test different auth methods
      const authMethods = [
        "None",
        "Basic",
        "Client credentials",
        "SMART on FHIR",
      ];

      const authMethodSelect = screen.getByTestId("auth-method");

      for (const authMethod of authMethods) {
        const optionValue =
          authMethod === "None"
            ? "none"
            : authMethod === "Basic"
              ? "basic"
              : authMethod === "Client credentials"
                ? "client_credentials"
                : "SMART";
        await user.selectOptions(authMethodSelect, optionValue);

        expect(screen.queryByTestId("ca-cert")).not.toBeInTheDocument();
      }
    });

    it("should include CA certificate in form data when submitting", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;
      mockInsertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "new-id" },
      });

      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Fill out form with mutual TLS
      await user.type(screen.getByTestId("server-name"), "mTLS Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://mtls.example.com/fhir",
      );

      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      const testCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT\n-----END CERTIFICATE-----";
      const caCertTextarea = screen.getByTestId("ca-cert");
      await user.type(caCertTextarea, testCert);

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockInsertFhirServer).toHaveBeenCalledWith(
          "mTLS Server",
          "https://mtls.example.com/fhir",
          false,
          false,
          true, // connection success should be true based on our mock
          expect.objectContaining({
            authType: "mutual-tls",
            caCert: testCert,
          }),
          expect.any(Object),
        );
      });
    });

    it("should populate CA certificate field when editing existing mTLS server", async () => {
      const existingCert =
        "-----BEGIN CERTIFICATE-----\nEXISTING_CERT\n-----END CERTIFICATE-----";
      const mtlsServer: FhirServerConfig = {
        id: "mtls-1",
        name: "Existing mTLS Server",
        hostname: "https://existing-mtls.example.com/fhir",
        authType: "mutual-tls",
        disableCertValidation: false,
        defaultServer: false,
        caCert: existingCert,
        patientMatchConfiguration: {
          enabled: false,
          onlySingleMatch: false,
          onlyCertainMatches: false,
          matchCount: 0,
          supportsMatch: false,
        },
      };

      render(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={mtlsServer}
        />,
      );

      // CA certificate field should be populated
      expect(screen.getByTestId("ca-cert")).toHaveValue(existingCert);
      expect(screen.getByTestId("auth-method")).toHaveValue("mutual-tls");
    });

    it("should show mutual TLS hint text", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      expect(
        screen.getByText(
          /Mutual TLS client certificates will be loaded from the keys directory/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Optionally provide the CA certificate of the server here if it's not trusted by default/,
        ),
      ).toBeInTheDocument();
    });

    it("should clear CA certificate field when switching away from mutual TLS", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Select Mutual TLS and add CA cert
      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      const caCertTextarea = screen.getByTestId("ca-cert");
      await user.type(caCertTextarea, "test cert");

      // Switch to different auth method
      await user.selectOptions(authMethodSelect, "none");

      // Switch back to mutual TLS
      await user.selectOptions(authMethodSelect, "mutual-tls");

      // Field should be cleared (this tests the form state management)
      expect(screen.getByTestId("ca-cert")).toHaveValue("");
    });
  });

  describe("Form validation", () => {});

  describe("Server updates", () => {
    it("should update existing server with CA certificate", async () => {
      const mockUpdateFhirServer =
        require("@/app/backend/fhir-servers/service").updateFhirServer;
      mockUpdateFhirServer.mockResolvedValue({ success: true });

      const existingServer: FhirServerConfig = {
        id: "existing-1",
        name: "Existing Server",
        hostname: "https://existing.example.com/fhir",
        authType: "none",
        disableCertValidation: false,
        defaultServer: false,
        patientMatchConfiguration: {
          enabled: false,
          onlySingleMatch: false,
          onlyCertainMatches: false,
          matchCount: 0,
          supportsMatch: false,
        },
      };

      const user = userEvent.setup();

      render(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={existingServer}
        />,
      );

      // Change to mutual TLS
      const authMethodSelect = screen.getByTestId("auth-method");
      await user.selectOptions(authMethodSelect, "mutual-tls");

      // Add CA certificate
      const testCert =
        "-----BEGIN CERTIFICATE-----\nNEW_CERT\n-----END CERTIFICATE-----";
      const caCertTextarea = screen.getByTestId("ca-cert");
      await user.type(caCertTextarea, testCert);

      const saveButton = screen.getByRole("button", { name: /Save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateFhirServer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "existing-1",
            authData: expect.objectContaining({
              authType: "mutual-tls",
              caCert: testCert,
            }),
          }),
        );
      });
    });
  });
});
