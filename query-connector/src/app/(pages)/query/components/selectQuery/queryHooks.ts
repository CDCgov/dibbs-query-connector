import { hyperUnluckyPatient } from "@/app/shared/constants";
import { getSavedQueryByName } from "@/app/shared/database-service";
import { unnestValueSetsFromQuery } from "@/app/shared/utils";
import {
  patientRecordsQuery,
  PatientRecordsResponse,
} from "@/app/backend/query-execution";
import { Patient } from "fhir/r4";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

type SetStateCallback<T> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Fetch to grab valuesets based the name of the query
 * @param queryName - name of the query to grab associated ValueSets for
 * @returns The valuesets from the specified query name
 */
export async function fetchQueryValueSets(queryName: string) {
  const queryResults = await getSavedQueryByName(queryName);
  if (queryResults === undefined) {
    console.error(
      `Query by name ${queryName} not found. Returning no value sets`,
    );
    return [];
  }

  const valueSets = unnestValueSetsFromQuery(queryResults);
  return valueSets;
}

/**
 * Query to apply for future view
 * @param p - object param for readability
 * @param p.queryName - name of the custom user query that we want to fetch
 * @param p.patientForQuery - patient to do query against
 * @param p.selectedQuery - selected query
 * @param p.queryResponseStateCallback - callback function to update state of the
 * query response
 * @param p.fhirServer - fhir server to do the querying against
 * @param p.setIsLoading - callback to update loading state
 * @param p.valueSetOverrides - list of overrides from the customize query flow
 * to not include in the final query execution
 */
export async function fetchQueryResponse(p: {
  queryName: string;
  patientForQuery: Patient | undefined;
  selectedQuery: string;
  fhirServer: string;
  queryResponseStateCallback: SetStateCallback<
    PatientRecordsResponse | undefined
  >;
  setIsLoading: (isLoading: boolean) => void;
  valueSetOverrides?: DibbsValueSet[];
}) {
  if (p.patientForQuery && p.selectedQuery) {
    const newRequest = {
      query_name: p.queryName,
      patient_id: p.patientForQuery.id ?? hyperUnluckyPatient.Id,
      fhir_server: p.fhirServer,
    };
    p.setIsLoading(true);
    const queryResponse = await patientRecordsQuery(
      newRequest,
      p.valueSetOverrides,
    );

    p.queryResponseStateCallback({
      Patient: [p.patientForQuery],
      ...queryResponse,
    });
    p.setIsLoading(false);
  }
}
