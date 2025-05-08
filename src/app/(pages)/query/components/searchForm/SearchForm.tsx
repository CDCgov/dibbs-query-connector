import React, { useCallback, useEffect, useState } from "react";
import {
  Fieldset,
  Label,
  TextInput,
  Select,
  Button,
} from "@trussworks/react-uswds";
import {
  stateOptions,
  Mode,
  hyperUnluckyPatient,
} from "@/app/shared/constants";
import {
  patientDiscoveryQuery,
  PatientDiscoveryResponse,
} from "@/app/backend/query-execution";
import styles from "../searchForm/searchForm.module.scss";
import { FormatPhoneAsDigits } from "@/app/shared/format-service";
import TitleBox from "../stepIndicator/TitleBox";
import { PatientDiscoveryRequest } from "@/app/models/entities/query";

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

/**
 * @param root0 - SearchFormProps
 * @param root0.setMode - The function to set the mode.
 * @param root0.setLoading - The function to set the loading state.
 * @param root0.setPatientDiscoveryQueryResponse - callback function to set the
 * patient for use in future steps
 * @param root0.selectedFhirServer - server to do the query against
 * @param root0.setFhirServer - callback function to update specified query
 * @param root0.fhirServers - list of available FHIR servers to query against, from the DB & hardcoded (for now)
 * @returns - The SearchForm component.
 */
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
  const [dob, setDOB] = useState<string>("");
  const [mrn, setMRN] = useState<string>("");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autofilled, setAutofilled] = useState(false); // boolean indicating if the form was autofilled, changes color if true

  // Fills fields with sample data based on the selected
  const fillFields = useCallback(
    (highlightAutofilled = true) => {
      setFirstName(hyperUnluckyPatient.FirstName);
      setLastName(hyperUnluckyPatient.LastName);
      setDOB(hyperUnluckyPatient.DOB);
      setMRN(hyperUnluckyPatient.MRN);
      setPhone(hyperUnluckyPatient.Phone);
      setAutofilled(highlightAutofilled);
    },
    [fhirServers],
  );

  const nameRegex = "^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\\-'. ]+$";
  const nameRuleHint =
    "Enter a name using only letters, hyphens, apostrophes, spaces, or periods.";

  async function HandleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!fhirServer) {
      console.error("FHIR server is required.");
      return;
    }
    setLoading(true);
    setMode("patient-results");

    const patientDiscoveryRequest: PatientDiscoveryRequest = {
      firstName,
      lastName,
      dob,
      mrn,
      fhirServer,
      phone: FormatPhoneAsDigits(phone),
    };
    const queryResponse = await patientDiscoveryQuery(patientDiscoveryRequest);
    setPatientDiscoveryQueryResponse(queryResponse);
    setLoading(false);
  }
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <form onSubmit={HandleSubmit}>
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
                outline
                type="button"
                onClick={() => {
                  fillFields(false);
                }}
              >
                Fill fields
              </Button>
              <Button
                className={`usa-button--unstyled margin-left-auto`}
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
                    value={fhirServer}
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
                style={{
                  backgroundColor:
                    autofilled && firstName ? autofillColor : undefined,
                }}
              />
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
                style={{
                  backgroundColor:
                    autofilled && lastName ? autofillColor : undefined,
                }}
              />
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
                style={{
                  backgroundColor:
                    autofilled && phone ? autofillColor : undefined,
                }}
              />
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
                  style={{
                    backgroundColor:
                      autofilled && dob ? autofillColor : undefined,
                  }}
                />
              </div>
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
              />
            </div>
          </div>
          <div className="grid-row grid-gap margin-bottom-4">
            <div className="tablet:grid-col-5">
              <Label htmlFor="city" className="margin-top-0-important">
                City
              </Label>
              <TextInput id="city" name="city" type="text" />
            </div>
            <div className="tablet:grid-col-3">
              <Label htmlFor="state" className="margin-top-0-important">
                State
              </Label>
              <Select id="state" name="state" defaultValue="">
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
                style={{
                  backgroundColor:
                    autofilled && mrn ? autofillColor : undefined,
                }}
              />
            </div>
          </div>
        </Fieldset>
        <button className="usa-button margin-top-5" type="submit">
          Search for patient
        </button>
      </form>
    </>
  );
};

export default SearchForm;

const autofillColor = "#faf3d1";
export const STEP_ONE_PAGE_TITLE = "Step 1: Enter patient information";
