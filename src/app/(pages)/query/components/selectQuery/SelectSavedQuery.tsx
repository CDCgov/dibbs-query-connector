import { Select, Button } from "@trussworks/react-uswds";
import Backlink from "../../../../ui/designSystem/backLink/Backlink";
import styles from "./selectQuery.module.scss";
import { useEffect, useState } from "react";
import { RETURN_LABEL } from "@/app/(pages)/query/components/stepIndicator/StepIndicator";
import TitleBox from "../stepIndicator/TitleBox";
import { showToastConfirmation } from "../../../../ui/designSystem/toast/Toast";
import { CustomUserQuery, QuerySummary } from "@/app/models/entities/query";
import { getSavedQuerySummaries } from "@/app/backend/query-building/service";
import { getRole } from "@/app/(pages)/userManagement/utils";
import NoQueriesDisplay from "./NoQueriesDisplay";
import QueryRedirectInfo from "./QueryRedirectDisplay";
import Skeleton from "react-loading-skeleton";

type SelectSavedQueryProps = {
  selectedQuery: CustomUserQuery;
  setSelectedQuery: React.Dispatch<React.SetStateAction<CustomUserQuery>>;
  fhirServer: string;
  fhirServers: string[];
  goBack: () => void;
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
 * @param root0.handleSubmit - submit handler
 * @param root0.fhirServer - fhir server to apply a query against
 * @param root0.fhirServers - list of available fhir server names
 * @param root0.setFhirServer - function to update the fhir server
 * @returns SelectedSavedQuery component
 */
const SelectSavedQuery: React.FC<SelectSavedQueryProps> = ({
  selectedQuery,
  fhirServer,
  fhirServers,
  goBack,
  setSelectedQuery,
  handleSubmit,
  setFhirServer,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [queryOptions, setQueryOptions] = useState<QuerySummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const userRole = getRole();

  // Retrieve the queries available to the logged-in user on page load
  useEffect(() => {
    const fetchPageData = async () => {
      try {
        const queries = await getSavedQuerySummaries();
        setQueryOptions(queries);
      } catch {
        showToastConfirmation({
          body: "An error occurred. Please try again later",
          variant: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPageData();
  }, []);

  function handleQuerySelection(queryName: string) {
    const selectedQuery = queryOptions.filter((q) => q.queryName === queryName);
    if (selectedQuery[0]) {
      setSelectedQuery({
        queryId: selectedQuery[0].queryId,
        queryName: selectedQuery[0].queryName,
        valuesets: [],
      });
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

      {queryOptions.length === 0 ? (
        loading ? (
          <>
            <Skeleton height={100} />
            <Skeleton className={`margin-top-2`} width={150} />
            <Skeleton className={styles.queryRow} height={50} width={300} />
            <Skeleton className={`margin-top-2`} width={150} />
            <Skeleton height={34} width={175} />
          </>
        ) : (
          <NoQueriesDisplay userRole={userRole} />
        )
      ) : (
        <>
          <QueryRedirectInfo userRole={userRole} />
          <div className={styles.queryRow}>
            <label className={styles.queryDropdownLabel} htmlFor="querySelect">
              Query
            </label>
            <Select
              id="querySelect"
              name="querySelect"
              value={selectedQuery.queryName}
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
                <option key={query.queryId} value={query.queryName}>
                  {query.queryName}
                </option>
              ))}
            </Select>
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
              disabled={!selectedQuery.queryName}
              className={selectedQuery ? "usa-button" : "usa-button disabled"}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

export default SelectSavedQuery;
