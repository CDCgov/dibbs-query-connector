import { Select, Button } from "@trussworks/react-uswds";
import Backlink from "../../../../ui/designSystem/backLink/Backlink";
import styles from "./selectQuery.module.scss";
import { useEffect, useState } from "react";
import { RETURN_LABEL } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";
import TitleBox from "../stepIndicator/TitleBox";
import LoadingView from "../../../../ui/designSystem/LoadingView";
import { showToastConfirmation } from "../../../../ui/designSystem/toast/Toast";
import { getFhirServerNames } from "@/app/backend/dbServices/fhir-servers";
import { CustomUserQuery } from "@/app/models/entities/query";
import { getCustomQueries } from "@/app/backend/query-building";

type SelectSavedQueryProps = {
  selectedQuery: CustomUserQuery;
  setSelectedQuery: React.Dispatch<React.SetStateAction<CustomUserQuery>>;
  fhirServer: string;
  loadingQueryValueSets: boolean;
  goBack: () => void;
  setShowCustomizedQuery: (showCustomize: boolean) => void;
  handleSubmit: () => void;
  setFhirServer: React.Dispatch<React.SetStateAction<string>>;
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
  const [fhirServers, setFhirServers] = useState<string[]>([]);
  const [queryOptions, setQueryOptions] = useState<CustomUserQuery[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function fetchFHIRServers() {
    const servers = await getFhirServerNames();
    setFhirServers(servers);
  }

  useEffect(() => {
    fetchFHIRServers();
  }, []);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const queries = await getCustomQueries();
        setQueryOptions(queries);
      } catch (error) {
        console.error("Failed to fetch queries:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueries();
    setLoading(false); // Data already exists, no need to fetch again
  }, []);

  function handleQuerySelection(queryName: string) {
    const selectedQuery = queryOptions.filter(
      (q) => q.query_name === queryName,
    );
    if (selectedQuery[0]) {
      setSelectedQuery(selectedQuery[0]);
    } else {
      showToastConfirmation({
        body: "Please try again, or contact us if the error persists",
        heading: "Something went wrong",
        variant: "error",
      });
    }
  }

  return (
    <form>
      {/* Back button */}

      <Backlink onClick={goBack} label={RETURN_LABEL["select-query"]} />
      <TitleBox step="select-query" />
      <h2 className="page-explainer">
        We will pull relevant data for your selected patient and query.
      </h2>
      <h3 className={styles.queryDropdownLabel}>Query</h3>
      <div className={styles.queryRow}>
        {loading ? (
          <LoadingView loading={true} />
        ) : (
          <Select
            id="querySelect"
            name="query"
            value={selectedQuery.query_name}
            onChange={(e) => {
              handleQuerySelection(e.target.value);
            }}
            className={`${styles.queryDropDown}`}
            required
          >
            <option value="" disabled>
              Select query
            </option>
            {queryOptions.map((query) => (
              <option key={query.query_id} value={query.query_name}>
                {query.query_name}
              </option>
            ))}
          </Select>
        )}

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
          <h3 className={styles.queryDropdownLabel}>
            Health Care Organization (HCO)
          </h3>
          <Select
            id="fhir_server"
            name="fhir_server"
            value={fhirServer}
            onChange={(e) => setFhirServer(e.target.value as string)}
            required
            className={`${styles.queryDropDown}`}
          >
            Select HCO
            {fhirServers.map((fhirServer: string) => (
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
