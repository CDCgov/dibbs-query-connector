import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { screen, waitFor } from "@testing-library/react";
import SearchForm from "./SearchForm";
import { useSearchParams } from "next/navigation";
import { getFhirServerConfigs } from "@/app/backend/fhir-servers/service";
import { getConditionsData } from "@/app/backend/query-building/service";
import { patientDiscoveryQuery } from "@/app/backend/query-execution/service";
import { hyperUnluckyPatient } from "@/app/constants";

jest.mock("next/navigation");

jest.mock("@/app/backend/fhir-servers/service", () => ({
  getFhirServerConfigs: jest.fn().mockResolvedValue([
    {
      name: "Matching Server",
      url: "https://example.com",
      enabled: true,
      authType: "none",
      fhirVersion: "4.0.1",
      metadataUrl: "https://example.com/metadata",
      patientMatchConfiguration: {
        onlyCertainMatches: true,
        supported: true,
      },
    },
  ]),
}));

jest.mock("@/app/backend/query-execution/service", () => ({
  patientDiscoveryQuery: jest.fn(),
}));

jest.mock("@/app/backend/query-building/service", () => ({
  getConditionsData: jest.fn(),
}));

(getConditionsData as jest.Mock).mockResolvedValue({
  conditionIdToNameMap: {},
});

describe("SearchForm", () => {
  beforeAll(() => {
    const windowMock = {
      scrollTo: jest.fn(),
    };

    Object.assign(global, windowMock);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it("renders the patient search form", () => {
    renderWithUser(
      <RootProviderMock currentPage={"/query"}>
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer=""
          setFhirServer={jest.fn()}
          fhirServers={[]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        ></SearchForm>
      </RootProviderMock>,
    );
    expect(screen.getByText("Enter patient information")).toBeVisible();
    expect(document.body).toMatchSnapshot();
  });

  it("renders fhir server form options on button click", async () => {
    const { user } = renderWithUser(
      <RootProviderMock currentPage={"/query"}>
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer=""
          setFhirServer={jest.fn()}
          fhirServers={[]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        ></SearchForm>
      </RootProviderMock>,
    );
    expect(screen.getByText("Enter patient information")).toBeVisible();
    expect(document.body).toMatchSnapshot();

    const advancedOptions = await screen.findByText("Advanced");
    await user.click(advancedOptions);

    expect(
      await screen.findByText("Healthcare Organization (HCO)"),
    ).toBeVisible();
  });

  it("prefills form fields from query params", async () => {
    const queryParams = "last=unlucky&mrn=1234";

    const formattedParams = new URLSearchParams(queryParams);
    (useSearchParams as jest.Mock).mockReturnValue(formattedParams);

    renderWithUser(
      <RootProviderMock currentPage={`/query?${queryParams}`}>
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={[]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        ></SearchForm>
      </RootProviderMock>,
    );

    expect(screen.getByText("Enter patient information")).toBeVisible();
    expect(document.body).toMatchSnapshot();

    const firstName = screen.getByRole("textbox", {
      name: "First name",
    });
    const lastName = screen.getByRole("textbox", {
      name: "Last name",
    });
    const phone = screen.getByRole("textbox", {
      name: "Phone number",
    });
    const mrn = screen.getByRole("textbox", {
      name: "Medical Record Number",
    });

    expect(firstName).toHaveValue("");
    expect(lastName).toHaveValue("unlucky");
    expect(phone).toHaveValue("");
    expect(mrn).toHaveValue("1234");
  });

  it("repopulates fields from initialValues when revising a search", () => {
    // Even with URL params present, persisted initialValues take precedence so
    // the revised search keeps what the user previously entered.
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams("last=fromurl"),
    );

    const initialValues = {
      firstName: "Jane",
      lastName: "Doe",
      dob: "1990-01-15",
      mrn: "9876",
      phone: "555-123-4567",
      email: "jane@example.com",
      address: {
        street1: "123 Main St",
        street2: "Apt 4",
        city: "Anytown",
        state: "MA",
        zip: "02101",
      },
    };

    renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={[]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
          initialValues={initialValues}
        />
      </RootProviderMock>,
    );

    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue(
      "Jane",
    );
    expect(screen.getByRole("textbox", { name: "Last name" })).toHaveValue(
      "Doe",
    );
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue(
      "555-123-4567",
    );
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue(
      "jane@example.com",
    );
    expect(
      screen.getByRole("textbox", { name: "Medical Record Number" }),
    ).toHaveValue("9876");
    expect(screen.getByRole("textbox", { name: "Street address" })).toHaveValue(
      "123 Main St",
    );
    expect(screen.getByRole("textbox", { name: "City" })).toHaveValue(
      "Anytown",
    );
    expect(screen.getByRole("textbox", { name: "Zip code" })).toHaveValue(
      "02101",
    );
  });

  it("does not prefill fhir server with bad data", async () => {
    const badServerName = "Fake FHIR";
    const defaultServerName = "Default FHIR";
    const queryParams = `server=${badServerName}`;

    const formattedParams = new URLSearchParams(queryParams);
    (useSearchParams as jest.Mock).mockReturnValue(formattedParams);

    const { user } = renderWithUser(
      <RootProviderMock currentPage={`/query?${queryParams}`}>
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer={defaultServerName}
          setFhirServer={jest.fn()}
          fhirServers={[defaultServerName, "Some other server name"]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        ></SearchForm>
      </RootProviderMock>,
    );

    expect(screen.getByText("Enter patient information")).toBeVisible();
    expect(document.body).toMatchSnapshot();

    const advancedOptions = await screen.findByText("Advanced");
    await user.click(advancedOptions);
    const selectedServer = screen.getByRole("combobox", {
      name: "Healthcare Organization (HCO)",
    });
    expect(selectedServer).not.toHaveValue(badServerName);
    expect(selectedServer).toHaveValue(defaultServerName);
  });

  it("does not prefill address with bad data", async () => {
    const goodAddressStreet = "123 Main St";
    const goodAddressCity = "Anytown";
    const badAddressState = "ZZ";
    const badAddressZip = "123abc";
    const queryParams = `street1=${goodAddressStreet}&city=${goodAddressCity}&state=${badAddressState}&zip=${badAddressZip}`;

    const formattedParams = new URLSearchParams(queryParams);
    (useSearchParams as jest.Mock).mockReturnValue(formattedParams);

    renderWithUser(
      <RootProviderMock currentPage={`/query?${queryParams}`}>
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer={"Default server"}
          setFhirServer={jest.fn()}
          fhirServers={["Default server"]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        ></SearchForm>
      </RootProviderMock>,
    );

    expect(screen.getByText("Enter patient information")).toBeVisible();
    expect(document.body).toMatchSnapshot();

    const streetAddress = screen.getByRole("textbox", {
      name: "Street address",
    });
    const city = screen.getByRole("textbox", {
      name: "City",
    });
    const state = screen.getByRole("combobox", {
      name: "State",
    });
    const zip = screen.getByRole("textbox", {
      name: "Zip code",
    });

    expect(streetAddress).toHaveValue(goodAddressStreet);
    expect(city).toHaveValue(goodAddressCity);

    expect(state).not.toHaveValue(badAddressState);
    expect(state).toHaveValue("");

    expect(zip).not.toHaveValue(badAddressZip);
    expect(zip).toHaveValue("");
  });

  it("shows and toggles patient match checkbox", async () => {
    const queryParams = "";
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams(queryParams),
    );
    (getFhirServerConfigs as jest.Mock).mockResolvedValue([
      {
        name: "Matching Server",
        patientMatchConfiguration: {
          enabled: true,
          supportsMatch: true,
          onlyCertainMatches: false,
          onlySingleMatch: false,
          matchCount: 5,
        },
      },
    ]);

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer="Matching Server"
          setFhirServer={jest.fn()}
          fhirServers={["Matching Server"]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        />
      </RootProviderMock>,
    );

    const advancedButton = await screen.findByRole("button", {
      name: "Advanced",
    });
    await user.click(advancedButton);

    const checkbox = await screen.findByRole("checkbox", {
      name: /enable patient match/i,
    });

    expect(checkbox).toBeVisible();
    expect(checkbox).toBeChecked();

    await user.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("fills demo fields and submits a valid patient discovery query", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));
    (patientDiscoveryQuery as jest.Mock).mockResolvedValue([
      { resourceType: "Patient", id: "p1" },
    ]);

    const setMode = jest.fn();
    const setLoading = jest.fn();
    const setResponse = jest.fn();
    const setUncertainMatchError = jest.fn();
    const setSearchFormValues = jest.fn();

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={setMode}
          setLoading={setLoading}
          setPatientDiscoveryQueryResponse={setResponse}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={["Default server"]}
          setUncertainMatchError={setUncertainMatchError}
          setSearchFormValues={setSearchFormValues}
        />
      </RootProviderMock>,
    );

    await user.click(screen.getByRole("button", { name: "Fill fields" }));

    // Fill fields populates from the hyper-unlucky demo patient.
    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue(
      hyperUnluckyPatient.FirstName,
    );
    expect(
      screen.getByRole("textbox", { name: "Medical Record Number" }),
    ).toHaveValue(hyperUnluckyPatient.MRN);

    await user.click(
      screen.getByRole("button", { name: "Search for patient" }),
    );

    // Raw form values are persisted before the async query fires.
    expect(setSearchFormValues).toHaveBeenCalledWith(
      expect.objectContaining({
        firstName: hyperUnluckyPatient.FirstName,
        lastName: hyperUnluckyPatient.LastName,
        mrn: hyperUnluckyPatient.MRN,
      }),
    );
    expect(setLoading).toHaveBeenCalledWith(true);
    expect(patientDiscoveryQuery).toHaveBeenCalledTimes(1);

    await waitFor(() =>
      expect(setResponse).toHaveBeenCalledWith([
        { resourceType: "Patient", id: "p1" },
      ]),
    );
    expect(setMode).toHaveBeenCalledWith("patient-results");
    expect(setUncertainMatchError).toHaveBeenCalledWith(false);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("shows validation errors and does not query when required fields are missing", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));
    (patientDiscoveryQuery as jest.Mock).mockClear();

    const setLoading = jest.fn();

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={jest.fn()}
          setLoading={setLoading}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={["Default server"]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        />
      </RootProviderMock>,
    );

    await user.click(
      screen.getByRole("button", { name: "Search for patient" }),
    );

    // Insufficient identifiers message plus per-field "required" hints appear.
    expect(
      screen.getByText(
        /first name, last name, and date of birth are required/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Field is required.").length).toBeGreaterThan(0);
    expect(patientDiscoveryQuery).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it("handles an uncertain-match response by flagging the error and clearing results", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));
    (patientDiscoveryQuery as jest.Mock).mockResolvedValue({
      uncertainMatchError: true,
    });

    const setResponse = jest.fn();
    const setUncertainMatchError = jest.fn();
    const setLoading = jest.fn();

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={jest.fn()}
          setLoading={setLoading}
          setPatientDiscoveryQueryResponse={setResponse}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={["Default server"]}
          setUncertainMatchError={setUncertainMatchError}
          setSearchFormValues={jest.fn()}
        />
      </RootProviderMock>,
    );

    await user.click(screen.getByRole("button", { name: "Fill fields" }));
    await user.click(
      screen.getByRole("button", { name: "Search for patient" }),
    );

    await waitFor(() =>
      expect(setUncertainMatchError).toHaveBeenCalledWith(true),
    );
    expect(setResponse).toHaveBeenCalledWith([]);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("handles a failed patient discovery query by clearing results", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));
    (patientDiscoveryQuery as jest.Mock).mockRejectedValue(
      new Error("network down"),
    );
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const setResponse = jest.fn();
    const setUncertainMatchError = jest.fn();
    const setMode = jest.fn();

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={setMode}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={setResponse}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={["Default server"]}
          setUncertainMatchError={setUncertainMatchError}
          setSearchFormValues={jest.fn()}
        />
      </RootProviderMock>,
    );

    await user.click(screen.getByRole("button", { name: "Fill fields" }));
    await user.click(
      screen.getByRole("button", { name: "Search for patient" }),
    );

    await waitFor(() => expect(setResponse).toHaveBeenCalledWith([]));
    expect(setUncertainMatchError).toHaveBeenCalledWith(false);
    expect(setMode).toHaveBeenLastCalledWith("patient-results");

    consoleError.mockRestore();
  });

  it("updates address and contact fields as the user types", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer="Default server"
          setFhirServer={jest.fn()}
          fhirServers={["Default server"]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        />
      </RootProviderMock>,
    );

    await user.type(
      screen.getByRole("textbox", { name: "First name" }),
      "Jane",
    );
    await user.type(screen.getByRole("textbox", { name: "Last name" }), "Doe");
    await user.type(
      screen.getByRole("textbox", { name: "Phone number" }),
      "5551234567",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Email address" }),
      "test@example.com",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Street address" }),
      "1 Main St",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Address line 2" }),
      "Suite 5",
    );
    await user.type(screen.getByRole("textbox", { name: "City" }), "Boston");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "State" }),
      "MA",
    );
    await user.type(screen.getByRole("textbox", { name: "Zip code" }), "02101");
    await user.type(
      screen.getByRole("textbox", { name: "Medical Record Number" }),
      "12345",
    );

    expect(screen.getByRole("textbox", { name: "First name" })).toHaveValue(
      "Jane",
    );
    expect(screen.getByRole("textbox", { name: "Last name" })).toHaveValue(
      "Doe",
    );
    expect(screen.getByRole("textbox", { name: "Phone number" })).toHaveValue(
      "5551234567",
    );
    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue(
      "test@example.com",
    );
    expect(screen.getByRole("textbox", { name: "Street address" })).toHaveValue(
      "1 Main St",
    );
    expect(screen.getByRole("textbox", { name: "Address line 2" })).toHaveValue(
      "Suite 5",
    );
    expect(screen.getByRole("textbox", { name: "City" })).toHaveValue("Boston");
    expect(screen.getByRole("combobox", { name: "State" })).toHaveValue("MA");
    expect(screen.getByRole("textbox", { name: "Zip code" })).toHaveValue(
      "02101",
    );
    expect(
      screen.getByRole("textbox", { name: "Medical Record Number" }),
    ).toHaveValue("12345");
  });

  it("changes the selected FHIR server from the advanced dropdown", async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(""));
    const setFhirServer = jest.fn();

    const { user } = renderWithUser(
      <RootProviderMock currentPage="/query">
        <SearchForm
          setMode={jest.fn()}
          setLoading={jest.fn()}
          setPatientDiscoveryQueryResponse={jest.fn()}
          selectedFhirServer="Server A"
          setFhirServer={setFhirServer}
          fhirServers={["Server A", "Server B"]}
          setUncertainMatchError={jest.fn()}
          setSearchFormValues={jest.fn()}
        />
      </RootProviderMock>,
    );

    await user.click(screen.getByRole("button", { name: "Advanced" }));
    await user.selectOptions(
      await screen.findByRole("combobox", {
        name: "Healthcare Organization (HCO)",
      }),
      "Server B",
    );

    expect(setFhirServer).toHaveBeenCalledWith("Server B");
  });
});
