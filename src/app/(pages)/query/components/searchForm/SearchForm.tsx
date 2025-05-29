import React, { useCallback, useEffect, useState } from "react";
import {
  Fieldset,
  Label,
  TextInput,
  Select,
  Button,
  Icon,
} from "@trussworks/react-uswds";
import { useSearchParams } from "next/navigation";
import {
  stateOptions,
  Mode,
  hyperUnluckyPatient,
  INSUFFICIENT_PATIENT_IDENTIFIERS,
} from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  PatientDiscoveryResponse,
} from "@/app/backend/query-execution";
import styles from "../searchForm/searchForm.module.scss";
import { FormatPhoneAsDigits } from "@/app/shared/format-service";
import TitleBox from "../stepIndicator/TitleBox";
import {
  PatientDiscoveryRequest,
  validatedPatientSearch,
} from "@/app/models/entities/query";

interface SearchFormProps {
  setPatientDiscoveryQueryResponse: (
    patientDiscoveryResponse: PatientDiscoveryResponse,
  ) => void;
  setMode: (mode: Mode) => void;
  setLoading: (loading: boolean) => void;
  fhirServers: string[];
  selectedFhirServer: string;
  setFhirServer: React.Dispatch<React.SetStateAction<string>>;
}

const SearchForm: React.FC<SearchFormProps> = function SearchForm({
  setPatientDiscoveryQueryResponse,
  setMode,
  setLoading,
  fhirServers,
  selectedFhirServer: fhirServer,
  setFhirServer,
}) {
  //Set the patient options based on the demoOption
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [dob, setDOB] = useState<string>("");
  const [mrn, setMRN] = useState<string>("");
  const [address, setAddress] = useState<{
    street1: string;
    street2: string;
    city: string;
    state: string;
    zip: string;
  }>({ street1: "", street2: "", city: "", state: "", zip: "" });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const params = useSearchParams();

  const prefillFromQueryParams = () => {
    if (params?.size <= 0) {
      return;
    }

    // set the fhir server only if it matches one from the list;
    // otherwise, use default
    const server = params?.get("server");
    setFhirServer(server && fhirServers.includes(server) ? server : fhirServer);
    setFirstName(params?.get("first") || "");
    setLastName(params?.get("last") || "");
    setPhone(params?.get("phone") || "");
    setDOB(params?.get("dob") || "");
    setMRN(params?.get("mrn") || "");

    const zipAddr = params?.get("zip");
    const stateAddr = params?.get("state") || "";

    const stateMatch =
      !!stateAddr &&
      stateOptions?.filter((state) => state.value == stateAddr)[0]?.value;
    setAddress({
      ...address,
      street1: params?.get("street") || "",
      street2: params?.get("street2") || "",
      city: params?.get("city") || "",
      state: stateMatch || "",
      zip: zipAddr?.match(/^\d{5}(?:[-\s]\d{4})?$/) ? zipAddr : "",
    });
  };

  const [formTouched, setFormTouched] = useState(false);
  const [_formError, setFormError] = useState(false);

  const fillFields = useCallback(() => {
    setFirstName(hyperUnluckyPatient.FirstName);
    setLastName(hyperUnluckyPatient.LastName);
    setDOB(hyperUnluckyPatient.DOB);
    setMRN(hyperUnluckyPatient.MRN);
    setPhone(hyperUnluckyPatient.Phone);
    setEmail(hyperUnluckyPatient.Email);
  }, [fhirServers]);

  const nameRegex = "^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\\-'. ]+$";
  const nameRuleHint =
    "Enter a name using only letters, hyphens, apostrophes, spaces, or periods.";

  function getPatientDiscoveryRequest(): PatientDiscoveryRequest {
    return {
      firstName,
      lastName,
      dob,
      mrn,
      fhirServer,
      phone: FormatPhoneAsDigits(phone),
      email,
      address: {
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
      },
    };
  }

  function isValid() {
    return validatedPatientSearch(getPatientDiscoveryRequest());
  }

  function getErrorMessage() {
    if (!formTouched) return null;
    return !isValid() ? INSUFFICIENT_PATIENT_IDENTIFIERS : null;
  }

  function renderFieldError(field: string) {
    return (
      formTouched &&
      !field && (
        <div className={styles.errorMessage}>
          <Icon.Error
            aria-label="warning icon indicating an error is present"
            className={styles.errorMessage}
          />
          Field is required.
        </div>
      )
    );
  }

  async function HandleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormTouched(true);
    if (!isValid()) {
      setFormError(true);
      return;
    }
    setFormError(false);

    if (!fhirServer) {
      console.error("FHIR server is required.");
      return;
    }
    setLoading(true);
    setMode("patient-results");

    const patientDiscoveryRequest = getPatientDiscoveryRequest();
    const queryResponse = await patientDiscoveryQuery(patientDiscoveryRequest);
    setPatientDiscoveryQueryResponse(queryResponse);
    setLoading(false);
  }

  useEffect(() => {
    window.scrollTo(0, 0);
    prefillFromQueryParams();
  }, []);

  return (
    <>
      <form onSubmit={HandleSubmit} onChange={() => {}}>
        <TitleBox step="search" />
        <h2 className="page-explainer">
          Enter patient information below to search for a patient. We will query
          the connected network to find matching records.{" "}
        </h2>
        {
          <div className={`usa-summary-box ${styles.demoQueryFiller}`}>
            <Label
              className="margin-top-0-important maxw-full font-sans text-normal"
              htmlFor="query"
            >
              The demo site uses synthetic data to provide examples of possible
              queries that you can make with the Query Connector. To proceed,
              click “fill fields” below.
            </Label>

            <div className={`${styles.searchCallToActionContainer}`}>
              <Button
                secondary
                type="button"
                onClick={() => {
                  fillFields();
                }}
              >
                Fill fields
              </Button>
              <Button
                unstyled
                className={`margin-left-auto`}
                type="button"
                onClick={() => {
                  setShowAdvanced(!showAdvanced);
                }}
              >
                Advanced
              </Button>
            </div>
          </div>
        }
        <Fieldset className={`${styles.searchFormContainer} bg-white`}>
          {showAdvanced && (
            <div className="grid-row grid-gap margin-bottom-4">
              <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
                Advanced
              </h3>
              <Label
                htmlFor="fhir_server"
                className="margin-top-0-important width-full"
              >
                Healthcare Organization (HCO)
              </Label>
              <div className="grid-col-6">
                <div className="usa-combo-box">
                  <Select
                    id="fhir_server"
                    name="fhir_server"
                    value={params?.get("server") || fhirServer}
                    onChange={(event) => {
                      setFhirServer(event.target.value as string);
                    }}
                    required
                  >
                    {fhirServers.map((fhirServer: string) => (
                      <option key={fhirServer} value={fhirServer}>
                        {fhirServer}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
          )}

          <div className="grid-row grid-gap margin-bottom-4">
            <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
              Name
            </h3>
            <div className="tablet:grid-col-6">
              <Label htmlFor="firstName" className="margin-top-0-important">
                First name
              </Label>
              <TextInput
                id="firstName"
                title={nameRuleHint}
                name="first_name"
                type="text"
                pattern={nameRegex}
                value={firstName}
                onChange={(event) => {
                  setFirstName(event.target.value);
                }}
              />
              {renderFieldError(firstName)}
            </div>
            <div className="tablet:grid-col-6">
              <Label htmlFor="lastName" className="margin-top-0-important">
                Last name
              </Label>
              <TextInput
                id="lastName"
                title={nameRuleHint}
                name="last_name"
                type="text"
                pattern={nameRegex}
                value={lastName}
                onChange={(event) => {
                  setLastName(event.target.value);
                }}
              />
              {renderFieldError(lastName)}
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
              Date of Birth
            </h3>
            <div className="grid-col-6">
              <Label htmlFor="dob" className="margin-top-0-important">
                Date of Birth
              </Label>
              <div className="usa-date-picker">
                <input
                  className="usa-input"
                  name="dob"
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(event) => {
                    setDOB(event.target.value);
                  }}
                />
              </div>
              {renderFieldError(dob)}
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
              Phone number
            </h3>
            <div className="grid-col-6">
              <Label htmlFor="phone" className="margin-top-0-important">
                Phone number
              </Label>
              <TextInput
                id="phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                }}
              />
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
              Email address
            </h3>
            <div className="grid-col-6">
              <Label htmlFor="email" className="margin-top-0-important">
                Email address
              </Label>
              <TextInput
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                }}
              />
              {renderFieldError(email)}
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
              Address
            </h3>
            <div className="grid-col">
              <Label
                htmlFor="street_address_1"
                className="margin-top-0-important"
              >
                Street address
              </Label>
              <TextInput
                id="street_address_1"
                name="street_address_1"
                type="tel"
                value={address.street1}
                onChange={(event) => {
                  setAddress({ ...address, street1: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <div className="grid-col">
              <Label
                htmlFor="street_address_2"
                className="margin-top-0-important"
              >
                Address line 2
              </Label>
              <TextInput
                id="street_address_2"
                name="street_address_2"
                type="text"
                value={address.street2}
                onChange={(event) => {
                  setAddress({ ...address, street2: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <div className="tablet:grid-col-5">
              <Label htmlFor="city" className="margin-top-0-important">
                City
              </Label>
              <TextInput
                id="city"
                name="city"
                type="text"
                value={address.city}
                onChange={(event) => {
                  setAddress({ ...address, city: event.target.value });
                }}
              />
            </div>
            <div className="tablet:grid-col-3">
              <Label htmlFor="state" className="margin-top-0-important">
                State
              </Label>
              <Select
                id="state"
                name="state"
                value={address.state}
                onChange={(event) => {
                  setAddress({ ...address, state: event.target.value });
                }}
              >
                <option value="" disabled>
                  Select a state
                </option>
                {stateOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="tablet:grid-col-4">
              <Label htmlFor="zip" className="margin-top-0-important">
                Zip code
              </Label>
              <TextInput
                className="usa-input usa-input--medium"
                id="zip"
                name="zip"
                type="text"
                pattern="[\d]{5}(-[\d]{4})?"
                value={address.zip}
                onChange={(event) => {
                  setAddress({ ...address, zip: event.target.value });
                }}
              />
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <h3 className={`"font-sans-md" ${styles.searchFormSectionLabel}`}>
              Medical Record Number (MRN)
            </h3>
            <div className="grid-col-6">
              <Label htmlFor="mrn" className="margin-top-0-important">
                Medical Record Number
              </Label>
              <TextInput
                id="mrn"
                name="mrn"
                type="text"
                value={mrn}
                onChange={(event) => {
                  setMRN(event.target.value);
                }}
              />
            </div>
          </div>
        </Fieldset>
        <button className="usa-button margin-top-5" type="submit">
          Search for patient
        </button>
        {getErrorMessage() && (
          <div className={styles.errorMessage}>
            <Icon.Error
              aria-label="warning icon indicating an error is present"
              className={styles.errorMessage}
            />
            {getErrorMessage()}
          </div>
        )}
      </form>
    </>
  );
};

export default SearchForm;

export const STEP_ONE_PAGE_TITLE = "Step 1: Enter patient information";
