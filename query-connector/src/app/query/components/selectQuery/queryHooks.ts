import { hyperUnluckyPatient } from "@/app/constants";
import { getSavedQueryByName } from "@/app/database-service";
import { unnestValueSetsFromQuery } from "@/app/utils";
import { makeFhirQuery, FhirQueryResponse } from "@/app/query-service";
import { Patient } from "fhir/r4";

type SetStateCallback<T> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Fetch to grab valuesets based the name of the query
 * @param queryName - name of the query to grab associated ValueSets for
 * @returns The valuesets from the specified query name
 */
export async function fetchUseCaseValueSets(queryName: string) {
  const queryResults = await getSavedQueryByName(queryName);
  const valueSets = unnestValueSetsFromQuery(queryResults);

  return valueSets;
}

/**
 * Query to apply for future view
 * @param p - object param for readability
 * @param p.queryName - name of the custom user query that we want to fetch
 * @param p.patientForQuery - patient to do query against
 * @param p.selectedQuery - query use case
 * @param p.queryResponseStateCallback - callback function to update state of the
 * query response
 * @param p.fhirServer - fhir server to do the querying against
 * @param p.setIsLoading - callback to update loading state
 * @param p.queryValueSets
 */
export async function fetchQueryResponse(p: {
  queryName: string;
  patientForQuery: Patient | undefined;
  selectedQuery: string;
  fhirServer: string;
  queryResponseStateCallback: SetStateCallback<FhirQueryResponse>;
  setIsLoading: (isLoading: boolean) => void;
}) {
  if (p.patientForQuery && p.selectedQuery) {
    const patientFirstName =
      getNthElementIfDefined(p.patientForQuery.name, -1)?.given?.join(" ") ??
      hyperUnluckyPatient.FirstName;
    const patientLastName =
      getNthElementIfDefined(p.patientForQuery.name, -1)?.family ??
      hyperUnluckyPatient.LastName;

    const patientMRN =
      getNthElementIfDefined(p.patientForQuery.identifier)?.value ??
      hyperUnluckyPatient.MRN;

    const newRequest = {
      query_name: p.queryName,
      first_name: patientFirstName as string,
      last_name: patientLastName as string,
      dob: p.patientForQuery.birthDate as string,
      mrn: patientMRN,
      fhir_server: p.fhirServer,
      use_case: p.selectedQuery,
    };
    p.setIsLoading(true);
    const queryResponse = await makeFhirQuery(newRequest, {
      Patient: [p.patientForQuery],
    });

    p.queryResponseStateCallback(queryResponse);
    p.setIsLoading(false);
  }
}

function getNthElementIfDefined<T>(
  arr: T[] | undefined,
  n: number = 0,
): T | undefined {
  if (arr && arr.length > n) {
    const positionToCheck = n === -1 ? arr.length - 1 : n;
    return arr[positionToCheck];
  } else {
    return undefined;
  }
}
