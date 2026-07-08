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

  describe("Endpoint Type", () => {
    it("defaults to Standard FHIR and can be changed", async () => {
      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      const endpointTypeSelect = screen.getByTestId("endpoint-type");
      expect(endpointTypeSelect).toHaveValue("standard");

      await user.selectOptions(endpointTypeSelect, "immunization");
      expect(endpointTypeSelect).toHaveValue("immunization");
    });

    it("includes the selected endpoint type in the submit payload", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;
      mockInsertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "new-id" },
      });

      const user = userEvent.setup();

      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "IZ Gateway");
      await user.type(
        screen.getByTestId("server-url"),
        "https://iz.example.com/fhir",
      );
      await user.selectOptions(
        screen.getByTestId("endpoint-type"),
        "immunization",
      );

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(mockInsertFhirServer).toHaveBeenCalledWith(
          "IZ Gateway",
          "https://iz.example.com/fhir",
          false,
          false,
          true,
          expect.objectContaining({
            endpointType: "immunization",
          }),
          expect.any(Object),
        );
      });
    });

    it("populates endpoint type when editing an existing server", async () => {
      const fanoutServer: FhirServerConfig = {
        id: "fanout-1",
        name: "Fanout Server",
        hostname: "https://fanout.example.com/fhir",
        authType: "mutual-tls",
        endpointType: "fanout",
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

      render(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={fanoutServer}
        />,
      );

      expect(screen.getByTestId("endpoint-type")).toHaveValue("fanout");
    });
  });

  describe("Form validation", () => {
    it("shows a required error and blocks submit when server name is empty", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      // Provide a URL but leave the name blank.
      await user.type(
        screen.getByTestId("server-url"),
        "https://noname.example.com/fhir",
      );

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Enter a server URL to query."),
        ).toBeInTheDocument();
      });
      expect(mockInsertFhirServer).not.toHaveBeenCalled();
    });

    it("shows a URL error when validateFhirServerUrl rejects", async () => {
      const testUtils = require("@/app/backend/fhir-servers/test-utils");
      testUtils.validateFhirServerUrl.mockRejectedValueOnce(
        new Error("Invalid host"),
      );
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Bad URL Server");
      await user.type(screen.getByTestId("server-url"), "not-a-url");

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Fix the following server URL error: Invalid host/),
        ).toBeInTheDocument();
      });
      expect(mockInsertFhirServer).not.toHaveBeenCalled();
    });

    it("requires a bearer token for basic auth", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Basic Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://basic.example.com/fhir",
      );
      await user.selectOptions(screen.getByTestId("auth-method"), "basic");
      // Type then clear so accessToken is "" (the empty-string the validator checks).
      const bearerInput = screen.getByLabelText(/Bearer Token/);
      await user.type(bearerInput, "x");
      await user.clear(bearerInput);

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Bearer token needs to be set for basic auth"),
        ).toBeInTheDocument();
      });
      expect(mockInsertFhirServer).not.toHaveBeenCalled();
    });

    it("requires client id, secret and scopes for client credentials", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "CC Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://cc.example.com/fhir",
      );
      await user.selectOptions(
        screen.getByTestId("auth-method"),
        "client_credentials",
      );

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Client ID token needs to be set for client auth"),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText("Client secret needs to be set for client auth"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Scopes needs to be set for client auth"),
      ).toBeInTheDocument();
      expect(mockInsertFhirServer).not.toHaveBeenCalled();
    });

    it("requires client id and scopes for SMART auth", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "SMART Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://smart.example.com/fhir",
      );
      await user.selectOptions(screen.getByTestId("auth-method"), "SMART");

      const addButton = screen.getByRole("button", { name: /Add server/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(
          screen.getByText("Client ID token needs to be set for SMART auth"),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByText("Scopes needs to be set for SMART auth"),
      ).toBeInTheDocument();
      expect(mockInsertFhirServer).not.toHaveBeenCalled();
    });
  });

  describe("Basic authentication", () => {
    it("reveals the bearer token field and submits it", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;
      mockInsertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "basic-id" },
      });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("auth-method"), "basic");
      expect(screen.getByLabelText(/Bearer Token/)).toBeInTheDocument();

      await user.type(screen.getByTestId("server-name"), "Basic Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://basic.example.com/fhir",
      );
      await user.type(screen.getByLabelText(/Bearer Token/), "my-token");

      await user.click(screen.getByRole("button", { name: /Add server/i }));

      await waitFor(() => {
        expect(mockInsertFhirServer).toHaveBeenCalledWith(
          "Basic Server",
          "https://basic.example.com/fhir",
          false,
          false,
          true,
          expect.objectContaining({
            authType: "basic",
            bearerToken: "my-token",
          }),
          expect.any(Object),
        );
      });
    });
  });

  describe("Client credentials authentication", () => {
    it("reveals the client credential fields and submits them", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;
      mockInsertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "cc-id" },
      });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.selectOptions(
        screen.getByTestId("auth-method"),
        "client_credentials",
      );

      await user.type(screen.getByTestId("server-name"), "CC Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://cc.example.com/fhir",
      );
      await user.type(screen.getByTestId("client-id"), "client-abc");
      await user.type(screen.getByTestId("client-secret"), "secret-xyz");
      await user.type(screen.getByTestId("scopes"), "system/*.read");
      await user.type(
        screen.getByTestId("token-endpoint"),
        "https://cc.example.com/token",
      );

      await user.click(screen.getByRole("button", { name: /Add server/i }));

      await waitFor(() => {
        expect(mockInsertFhirServer).toHaveBeenCalledWith(
          "CC Server",
          "https://cc.example.com/fhir",
          false,
          false,
          true,
          expect.objectContaining({
            authType: "client_credentials",
            clientId: "client-abc",
            clientSecret: "secret-xyz",
            scopes: "system/*.read",
            tokenEndpoint: "https://cc.example.com/token",
          }),
          expect.any(Object),
        );
      });
    });
  });

  describe("SMART on FHIR authentication", () => {
    it("reveals the SMART fields and submits them", async () => {
      const mockInsertFhirServer =
        require("@/app/backend/fhir-servers/service").insertFhirServer;
      mockInsertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "smart-id" },
      });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.selectOptions(screen.getByTestId("auth-method"), "SMART");
      expect(
        screen.getByText(/system\/Patient.read system\/Observation.read/),
      ).toBeInTheDocument();

      await user.type(screen.getByTestId("server-name"), "SMART Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://smart.example.com/fhir",
      );
      await user.type(screen.getByTestId("client-id"), "smart-client");
      await user.type(screen.getByTestId("scopes"), "system/Patient.read");

      await user.click(screen.getByRole("button", { name: /Add server/i }));

      await waitFor(() => {
        expect(mockInsertFhirServer).toHaveBeenCalledWith(
          "SMART Server",
          "https://smart.example.com/fhir",
          false,
          false,
          true,
          expect.objectContaining({
            authType: "SMART",
            clientId: "smart-client",
            scopes: "system/Patient.read",
          }),
          expect.any(Object),
        );
      });
    });
  });

  describe("Test connection", () => {
    it("marks the button as Success when the connection test passes", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      const testUtils = require("@/app/backend/fhir-servers/test-utils");
      service.updateFhirServerConnectionStatus.mockResolvedValue({});
      testUtils.testFhirServerConnection.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Conn Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://conn.example.com/fhir",
      );

      await user.click(
        screen.getByRole("button", { name: /Test connection/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Success/i }),
        ).toBeInTheDocument();
      });
    });

    it("updates the server list when the status DB update returns a server", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      const testUtils = require("@/app/backend/fhir-servers/test-utils");
      testUtils.testFhirServerConnection.mockResolvedValue({ success: true });
      service.updateFhirServerConnectionStatus.mockResolvedValue({
        server: { id: "1", name: "Test Server" },
      });
      const setFhirServers = jest.fn();

      const user = userEvent.setup();
      render(
        <FhirServersModal {...defaultProps} setFhirServers={setFhirServers} />,
      );

      await user.type(screen.getByTestId("server-name"), "Conn Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://conn.example.com/fhir",
      );

      await user.click(
        screen.getByRole("button", { name: /Test connection/i }),
      );

      await waitFor(() => {
        expect(setFhirServers).toHaveBeenCalled();
      });
    });

    it("does not run the connection test when the form is invalid", async () => {
      const testUtils = require("@/app/backend/fhir-servers/test-utils");
      testUtils.testFhirServerConnection.mockClear();

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      // No name/url filled in.
      await user.click(
        screen.getByRole("button", { name: /Test connection/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText("Enter a server URL to query."),
        ).toBeInTheDocument();
      });
      expect(testUtils.testFhirServerConnection).not.toHaveBeenCalled();
    });
  });

  describe("Save error handling", () => {
    it("surfaces a connection error status when insert fails", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      service.insertFhirServer.mockResolvedValue({
        success: false,
        error: "Insert failed",
      });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Fail Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://fail.example.com/fhir",
      );

      await user.click(screen.getByRole("button", { name: /Add server/i }));

      await waitFor(() => {
        expect(service.insertFhirServer).toHaveBeenCalled();
      });
      // Modal should stay open (not closed) - the save button remains present.
      expect(
        screen.getByRole("button", { name: /Add server/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Delete server", () => {
    const existingServer: FhirServerConfig = {
      id: "del-1",
      name: "Deletable Server",
      hostname: "https://del.example.com/fhir",
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

    it("renders a Delete button only in edit mode", async () => {
      const { rerender } = render(<FhirServersModal {...defaultProps} />);
      expect(
        screen.queryByRole("button", { name: /^Delete$/i }),
      ).not.toBeInTheDocument();

      rerender(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={existingServer}
        />,
      );
      expect(
        screen.getByRole("button", { name: /^Delete$/i }),
      ).toBeInTheDocument();
    });

    it("calls deleteFhirServer with the server id on delete", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      service.deleteFhirServer.mockResolvedValue({ success: true });

      const user = userEvent.setup();
      render(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={existingServer}
        />,
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      await waitFor(() => {
        expect(service.deleteFhirServer).toHaveBeenCalledWith("del-1");
      });
    });

    it("keeps the modal open when delete fails", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      service.deleteFhirServer.mockResolvedValue({
        success: false,
        error: "Delete failed",
      });

      const user = userEvent.setup();
      render(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={existingServer}
        />,
      );

      await user.click(screen.getByRole("button", { name: /^Delete$/i }));

      await waitFor(() => {
        expect(service.deleteFhirServer).toHaveBeenCalled();
      });
      expect(
        screen.getByRole("button", { name: /Save changes/i }),
      ).toBeInTheDocument();
    });
  });

  describe("Custom headers", () => {
    it("adds, edits, and submits a custom header", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      service.insertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "hdr-id" },
      });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Header Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://hdr.example.com/fhir",
      );

      await user.click(screen.getByRole("button", { name: /Add header/i }));

      await user.type(screen.getByPlaceholderText("Header name"), "X-Custom");
      await user.type(screen.getByPlaceholderText("Header value"), "abc123");

      await user.click(screen.getByRole("button", { name: /Add server/i }));

      await waitFor(() => {
        expect(service.insertFhirServer).toHaveBeenCalledWith(
          "Header Server",
          "https://hdr.example.com/fhir",
          false,
          false,
          true,
          expect.objectContaining({
            headers: { "X-Custom": "abc123" },
          }),
          expect.any(Object),
        );
      });
    });

    it("removes a custom header row", async () => {
      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.click(screen.getByRole("button", { name: /Add header/i }));
      expect(screen.getByPlaceholderText("Header name")).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /Remove header row/i }),
      );
      expect(
        screen.queryByPlaceholderText("Header name"),
      ).not.toBeInTheDocument();
    });
  });

  describe("Common toggles", () => {
    it("submits disableCertValidation and defaultServer when checked", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      service.insertFhirServer.mockResolvedValue({
        success: true,
        server: { id: "toggle-id" },
      });

      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      await user.type(screen.getByTestId("server-name"), "Toggle Server");
      await user.type(
        screen.getByTestId("server-url"),
        "https://toggle.example.com/fhir",
      );
      await user.click(screen.getByLabelText("Disable certificate validation"));
      await user.click(screen.getByLabelText("Default server?"));

      await user.click(screen.getByRole("button", { name: /Add server/i }));

      await waitFor(() => {
        expect(service.insertFhirServer).toHaveBeenCalledWith(
          "Toggle Server",
          "https://toggle.example.com/fhir",
          true, // disableCertValidation
          true, // defaultServer
          true,
          expect.any(Object),
          expect.any(Object),
        );
      });
    });

    it("selects a non-default query strategy", async () => {
      const user = userEvent.setup();
      render(<FhirServersModal {...defaultProps} />);

      const strategySelect = screen.getByTestId("query-strategy");
      expect(strategySelect).toHaveValue("default");
      await user.selectOptions(strategySelect, "epic");
      expect(strategySelect).toHaveValue("epic");
    });
  });

  describe("Default server propagation on edit", () => {
    it("clears the default flag on other default servers", async () => {
      const service = require("@/app/backend/fhir-servers/service");
      service.updateFhirServer.mockResolvedValue({ success: true });

      const otherDefault: FhirServerConfig = {
        id: "other-default",
        name: "Other Default",
        hostname: "https://other.example.com/fhir",
        authType: "none",
        disableCertValidation: false,
        defaultServer: true,
        patientMatchConfiguration: {
          enabled: false,
          onlySingleMatch: false,
          onlyCertainMatches: false,
          matchCount: 0,
          supportsMatch: false,
        },
      };
      const editing: FhirServerConfig = {
        id: "editing-1",
        name: "Editing Server",
        hostname: "https://editing.example.com/fhir",
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
          fhirServers={[otherDefault, editing]}
          modalMode="edit"
          serverToEdit={editing}
        />,
      );

      // Mark the edited server as default so the propagation loop runs.
      await user.click(screen.getByLabelText("Default server?"));
      await user.click(screen.getByRole("button", { name: /Save changes/i }));

      await waitFor(() => {
        // Once for the edited server, once for the other default server.
        expect(service.updateFhirServer).toHaveBeenCalledTimes(2);
      });
      expect(service.updateFhirServer).toHaveBeenCalledWith(
        expect.objectContaining({ id: "other-default" }),
      );
    });
  });

  describe("Patient $match settings", () => {
    it("renders match settings and toggles when the server supports match", async () => {
      const user = userEvent.setup();
      render(
        <FhirServersModal
          {...defaultProps}
          patientMatchData={{
            enabled: true,
            onlySingleMatch: false,
            onlyCertainMatches: false,
            matchCount: 0,
            supportsMatch: true,
          }}
        />,
      );

      expect(screen.getByText("Patient $match settings")).toBeInTheDocument();

      const matchCount = screen.getByTestId("match-count");
      await user.clear(matchCount);
      await user.type(matchCount, "5");
      expect(defaultProps.setPatientMatchData).toHaveBeenCalled();

      await user.click(screen.getByLabelText("Enable patient matching"));
      expect(defaultProps.setPatientMatchData).toHaveBeenCalled();
    });

    it("shows FHIR 6 radio options in edit mode when supported", async () => {
      const testUtils = require("@/app/backend/fhir-servers/test-utils");
      testUtils.checkFhirServerSupportsMatch.mockResolvedValue({
        supportsMatch: true,
        fhirVersion: "6.0.0",
      });

      const matchServer: FhirServerConfig = {
        id: "match-1",
        name: "Match Server",
        hostname: "https://match.example.com/fhir",
        authType: "none",
        disableCertValidation: false,
        defaultServer: false,
        patientMatchConfiguration: {
          enabled: true,
          onlySingleMatch: false,
          onlyCertainMatches: true,
          matchCount: 0,
          supportsMatch: true,
        },
      };

      render(
        <FhirServersModal
          {...defaultProps}
          modalMode="edit"
          serverToEdit={matchServer}
          patientMatchData={{
            enabled: true,
            onlySingleMatch: false,
            onlyCertainMatches: true,
            matchCount: 0,
            supportsMatch: true,
          }}
        />,
      );

      await waitFor(() => {
        expect(
          screen.getByLabelText("Only include single matches"),
        ).toBeInTheDocument();
      });
      expect(
        screen.getByLabelText("Only include certain matches"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Include all matches")).toBeInTheDocument();
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
