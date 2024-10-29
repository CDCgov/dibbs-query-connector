import {
  FHIR_SERVERS,
  FhirServers,
  USE_CASES,
  demoQueryOptions,
} from "@/app/constants";
import { Select, Button } from "@trussworks/react-uswds";
import Backlink from "../backLink/Backlink";
import styles from "./selectQuery.module.scss";
import { useState } from "react";
import {
  PAGE_TITLES,
  RETURN_LABEL,
} from "@/app/query/stepIndicator/StepIndicator";

type SelectSavedQueryProps = {
  selectedQuery: string;
  fhirServer: FHIR_SERVERS;
  loadingQueryValueSets: boolean;
  goBack: () => void;
  setSelectedQuery: (selectedQuery: USE_CASES) => void;
  setShowCustomizedQuery: (showCustomize: boolean) => void;
  handleSubmit: () => void;
  setFhirServer: React.Dispatch<React.SetStateAction<FHIR_SERVERS>>;
};

/**
 * Component to poulate pre-existing queries
 * @param root0 - params
 * @param root0.goBack - return function for the previous page
 * @param root0.selectedQuery - specified query for future customization /
 * application
 * @param root0.setSelectedQuery - callback function for specified query
 * @param root0.setShowCustomizedQuery - toggle to switch to customization
 * view
 * @param root0.handleSubmit - submit handler
 * @param root0.fhirServer - fhir server to apply a query against
 * @param root0.setFhirServer - function to update the fhir server
 * @param root0.loadingQueryValueSets - flag for whether the value sets are
 * still being fetched from the db
 * @returns SelectedSavedQuery component
 */
const SelectSavedQuery: React.FC<SelectSavedQueryProps> = ({
  selectedQuery,
  fhirServer,
  loadingQueryValueSets,
  goBack,
  setSelectedQuery,
  setShowCustomizedQuery,
  handleSubmit,
  setFhirServer,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <form>
      {/* Back button */}

      <Backlink onClick={goBack} label={RETURN_LABEL["select-query"]} />
      <h1 className="page-title">{PAGE_TITLES["select-query"]}</h1>
      <h2 className="page-explainer">
        We will request all data related to your selected patient and query. By
        only showing relevant data for your query, we decrease the burden on our
        systems and protect patient privacy. If you would like to customize the
        query response, click on the "customize query" button.
      </h2>
      <h3 className="margin-bottom-105">Query</h3>
      <div className={styles.queryRow}>
        {/* Select a query drop down */}
        <Select
          id="querySelect"
          name="query"
          value={selectedQuery}
          onChange={(e) => setSelectedQuery(e.target.value as USE_CASES)}
          className={`${styles.queryDropDown}`}
          required
        >
          <option value="" disabled>
            Select query
          </option>
          {demoQueryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        {/* Customize Query Button */}
        <Button
          type="button"
          className="usa-button--outline bg-white margin-left-205"
          onClick={() => setShowCustomizedQuery(true)}
          disabled={loadingQueryValueSets || !selectedQuery}
        >
          Customize query
        </Button>
      </div>

      {showAdvanced && (
        <div>
          <h3 className="margin-bottom-105">Health Care Organization (HCO)</h3>
          <Select
            id="fhir_server"
            name="fhir_server"
            value={fhirServer}
            onChange={(e) => setFhirServer(e.target.value as FHIR_SERVERS)}
            required
            className={`${styles.queryDropDown}`}
          >
            Select HCO
            {FhirServers.map((fhirServer: string) => (
              <option key={fhirServer} value={fhirServer}>
                {fhirServer}
              </option>
            ))}
          </Select>
        </div>
      )}

      {!showAdvanced && (
        <div>
          <Button
            className={`usa-button--unstyled margin-left-auto ${styles.searchCallToActionButton}`}
            type="button"
            onClick={() => setShowAdvanced(true)}
          >
            Advanced...
          </Button>
        </div>
      )}

      {/* Submit Button */}
      <div className="margin-top-5">
        <Button
          type="button"
          disabled={!selectedQuery || loadingQueryValueSets}
          className={
            selectedQuery && !loadingQueryValueSets
              ? "usa-button"
              : "usa-button disabled"
          }
          onClick={() => handleSubmit()}
        >
          Submit
        </Button>
      </div>
    </form>
  );
};

export default SelectSavedQuery;
