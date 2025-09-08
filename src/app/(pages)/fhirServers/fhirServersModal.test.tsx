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
  getFhirServerConfigs: jest.fn(),
  updateFhirServerConnectionStatus: jest.fn(),
}));

// Mock the test utilities
jest.mock("@/app/backend/fhir-servers/test-utils", () => ({
  testFhirServerConnection: jest.fn().mockResolvedValue({ success: true }),
  checkFhirServerSupportsMatch: jest
    .fn()
    .mockResolvedValue({ supportsMatch: false, fhirVersion: "4.0.1" }),
  validateFhirServerUrl: jest.fn().mockReturnValue(true),
}));

// Mock the toast component
jest.mock("@/app/ui/designSystem/toast/Toast", () => ({
  showToastConfirmation: jest.fn(),
}));

// Mock dynamic imports
jest.mock("next/dynamic", () => () => {
  return function MockModal({
    children,
    ...props
  }: React.PropsWithChildren<Record<string, unknown>>) {
    return (
      <div data-testid="modal" {...props}>
        {children}
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
  modalMode: "add" as ModalMode,
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
      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      // Check if CA certificate field appears
      expect(
        screen.getByLabelText(/Server CA Certificate/),
      ).toBeInTheDocument();
      expect(screen.getByTestId("ca-cert")).toBeInTheDocument();
    });

    it("should show required indicator for CA certificate field", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      const caCertLabel = screen.getByLabelText(/Server CA Certificate/);
      expect(caCertLabel).toBeInTheDocument();
      expect(screen.getByText("(required)")).toBeInTheDocument();
    });

    it("should update CA certificate value when user types", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      const caCertTextarea = screen.getByTestId("ca-cert");
      const testCert =
        "-----BEGIN CERTIFICATE-----\nTEST_CA_CERT\n-----END CERTIFICATE-----";

      await user.type(caCertTextarea, testCert);

      expect(caCertTextarea).toHaveValue(testCert);
    });

    it("should show validation error when CA certificate is empty for mutual TLS", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Fill required fields
      await user.type(screen.getByTestId("server-name"), "Test mTLS Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://test-mtls.example.com/fhir",
      );

      // Select Mutual TLS without providing CA cert
      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      // Try to submit without CA cert
      const addButton = screen.getByRole("button", {
        name: /Add server|Save changes/i,
      });
      await user.click(addButton);

      // Should show validation error
      expect(
        screen.getByText("CA Certificate needs to be set for mutual TLS auth"),
      ).toBeInTheDocument();
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

      for (const authMethod of authMethods) {
        const radio = screen.getByLabelText(authMethod);
        await user.click(radio);

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

      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

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
          false,
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
      expect(screen.getByLabelText("Mutual TLS")).toBeChecked();
    });

    it("should show mutual TLS hint text", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      expect(
        screen.getByText(
          /Mutual TLS client certificates will be loaded from the keys directory/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Provide the CA certificate of the server here/),
      ).toBeInTheDocument();
    });

    it("should clear CA certificate field when switching away from mutual TLS", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      // Select Mutual TLS and add CA cert
      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      const caCertTextarea = screen.getByTestId("ca-cert");
      await user.type(caCertTextarea, "test cert");

      // Switch to different auth method
      const noneRadio = screen.getByLabelText("None");
      await user.click(noneRadio);

      // Switch back to mutual TLS
      await user.click(mutualTlsRadio);

      // Field should be cleared (this tests the form state management)
      expect(screen.getByTestId("ca-cert")).toHaveValue("");
    });
  });

  describe("Form validation", () => {
    it("should show error styling when CA certificate validation fails", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Test Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://test.example.com/fhir",
      );

      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      const caCertTextarea = screen.getByTestId("ca-cert");
      expect(caCertTextarea).toHaveClass("error-input");
    });

    it("should clear CA certificate validation error when value is provided", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Test Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://test.example.com/fhir",
      );

      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      // Should show error
      expect(
        screen.getByText("CA Certificate needs to be set for mutual TLS auth"),
      ).toBeInTheDocument();

      // Add CA certificate
      const caCertTextarea = screen.getByTestId("ca-cert");
      await user.type(
        caCertTextarea,
        "-----BEGIN CERTIFICATE-----\nTEST\n-----END CERTIFICATE-----",
      );

      // Error should be cleared (this might require another form submission attempt)
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.queryByText(
            "CA Certificate needs to be set for mutual TLS auth",
          ),
        ).not.toBeInTheDocument();
      });
    });
  });

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
      const mutualTlsRadio = screen.getByLabelText("Mutual TLS");
      await user.click(mutualTlsRadio);

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
