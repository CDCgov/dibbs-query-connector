import React, { useCallback, useEffect, useState } from "react";
import {
  Fieldset,
  Label,
  TextInput,
  Select,
  Button,
} from "@trussworks/react-uswds";
import {
  USE_CASES,
  FHIR_SERVERS,
  demoData,
  stateOptions,
  Mode,
} from "../../../constants";
import { UseCaseQueryResponse, UseCaseQuery } from "../../../query-service";
import { fhirServers } from "../../../fhir-servers";
import styles from "./searchForm.module.css";

import { FormatPhoneAsDigits } from "@/app/format-service";

interface SearchFormProps {
  useCase: USE_CASES;
  setUseCase: (useCase: USE_CASES) => void;
  setPatientDiscoveryQueryResponse: (
    UseCaseQueryResponse: UseCaseQueryResponse,
  ) => void;
  setMode: (mode: Mode) => void;
  setLoading: (loading: boolean) => void;
  fhirServer: FHIR_SERVERS;
  setFhirServer: React.Dispatch<React.SetStateAction<FHIR_SERVERS>>;
}

/**
 * @param root0 - SearchFormProps
 * @param root0.useCase - The use case this query will cover.
 * @param root0.setUseCase - Update stateful use case.
 * @param root0.setMode - The function to set the mode.
 * @param root0.setLoading - The function to set the loading state.
 * @param root0.setPatientDiscoveryQueryResponse - callback function to set the
 * patient for use in future steps
 * @param root0.fhirServer - server to do the query against
 * @param root0.setFhirServer - callback function to update specified query
 * @returns - The SearchForm component.
 */
const SearchForm: React.FC<SearchFormProps> = ({
  useCase,
  setUseCase,
  setPatientDiscoveryQueryResponse,
  setMode,
  setLoading,
  fhirServer,
  setFhirServer,
}) => {
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
      const data = demoData["cancer"];
      if (data) {
        setFirstName(data.FirstName);
        setLastName(data.LastName);
        setDOB(data.DOB);
        setMRN(data.MRN);
        setPhone(data.Phone);
        setFhirServer(data.FhirServer as FHIR_SERVERS);
        setUseCase(data.UseCase as USE_CASES);
        setAutofilled(highlightAutofilled);
      }
    },
    [setUseCase],
  );

  async function HandleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!useCase || !fhirServer) {
      console.error("Use case and FHIR server are required.");
      return;
    }
    setLoading(true);

    const originalRequest = {
      first_name: firstName,
      last_name: lastName,
      dob: dob,
      mrn: mrn,
      fhir_server: fhirServer,
      use_case: useCase,
      phone: FormatPhoneAsDigits(phone),
    };
    const queryResponse = await UseCaseQuery(originalRequest, []);
    setPatientDiscoveryQueryResponse(queryResponse);

    setMode("patient-results");
    setLoading(false);
  }
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <form className="content-container-smaller-width" onSubmit={HandleSubmit}>
        <h1 className="font-sans-2xl text-bold margin-bottom-105">
          {STEP_ONE_PAGE_TITLE}
        </h1>
        <h2 className="font-sans-lg text-normal margin-top-0 margin-bottom-105">
          Enter patient information below to search for a patient. We will query
          the connected network to find matching records.{" "}
        </h2>
        {
          <div className={`usa-summary-box ${styles.demoQueryFiller}`}>
            <Label
              className="no-margin-top-important maxw-full font-sans text-normal"
              htmlFor="query"
            >
              The demo site uses synthetic data to provide examples of possible
              queries that you can make with the Query Connector. Select a query
              use case, a sample patient, and then click “fill fields” below.
            </Label>

            <div className={`${styles.searchCallToActionContainer}`}>
              <Button
                className={`usa-button usa-button--outline bg-white`}
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
                className="no-margin-top-important width-full"
              >
                FHIR Server (QHIN)
              </Label>
              <div className="grid-col-6">
                <div className="usa-combo-box">
                  <Select
                    id="fhir_server"
                    name="fhir_server"
                    value={fhirServer}
                    onChange={(event) => {
                      setFhirServer(event.target.value as FHIR_SERVERS);
                    }}
                    required
                  >
                    {Object.keys(fhirServers).map((fhirServer: string) => (
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
              <Label htmlFor="firstName" className="no-margin-top-important">
                First Name
              </Label>
              <TextInput
                id="firstName"
                name="first_name"
                type="text"
                pattern="^[A-Za-z ]+$"
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
              <Label htmlFor="lastName" className="no-margin-top-important">
                Last Name
              </Label>
              <TextInput
                id="lastName"
                name="last_name"
                type="text"
                pattern="^[A-Za-z ]+$"
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
              Phone Number
            </h3>
            <div className="grid-col-6">
              <Label htmlFor="phone" className="no-margin-top-important">
                Phone Number
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
              <Label htmlFor="dob" className="no-margin-top-important">
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
                className="no-margin-top-important"
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
                className="no-margin-top-important"
              >
                Address Line 2
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
              <Label htmlFor="city" className="no-margin-top-important">
                City
              </Label>
              <TextInput id="city" name="city" type="text" />
            </div>
            <div className="tablet:grid-col-3">
              <Label htmlFor="state" className="no-margin-top-important">
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
              <Label htmlFor="zip" className="no-margin-top-important">
                ZIP code
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
              <Label htmlFor="mrn" className="no-margin-top-important">
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
        <button className="usa-button patient-search-button" type="submit">
          Search for patient
        </button>
      </form>
    </>
  );
};

export default SearchForm;

const autofillColor = "#faf3d1";
export const STEP_ONE_PAGE_TITLE = "Step 1: Enter patient information";
