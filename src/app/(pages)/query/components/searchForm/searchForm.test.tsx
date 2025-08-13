import { renderWithUser, RootProviderMock } from "@/app/tests/unit/setup";
import { screen } from "@testing-library/react";
import SearchForm from "./SearchForm";
import { useSearchParams } from "next/navigation";
import { getFhirServerConfigs } from "@/app/backend/fhir-servers";

jest.mock("next/navigation");
jest.mock("@/app/backend/fhir-servers", () => ({
  getFhirServerConfigs: jest.fn(),
}));
jest.mock("@/app/backend/fhir-servers", () => ({
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
});
