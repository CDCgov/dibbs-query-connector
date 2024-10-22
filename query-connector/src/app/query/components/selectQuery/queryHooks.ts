import {
  FHIR_SERVERS,
  USE_CASES,
  UseCaseToQueryName,
  ValueSet,
  hyperUnluckyPatient,
} from "@/app/constants";
import {
  getSavedQueryByName,
  mapQueryRowsToConceptValueSets,
} from "@/app/database-service";
import { UseCaseQuery, UseCaseQueryResponse } from "@/app/query-service";
import { Patient } from "fhir/r4";

type SetStateCallback<T> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Query to grab valuesets based on use case
 * @param selectedQuery - Query use case that's been selected
 * @param valueSetStateCallback - state update function to set the valuesets
 * @param isSubscribed - state destructor hook to prevent race conditions
 * @param setIsLoading - update function to control loading UI
 */
export async function fetchUseCaseValueSets(
  selectedQuery: USE_CASES,
  valueSetStateCallback: SetStateCallback<ValueSet[]>,
  isSubscribed: boolean,
  setIsLoading: (isLoading: boolean) => void,
) {
  if (selectedQuery) {
    const queryName = UseCaseToQueryName[selectedQuery as USE_CASES];

    setIsLoading(true);
    const queryResults = await getSavedQueryByName(queryName);
    const valueSets = await mapQueryRowsToConceptValueSets(queryResults);

    // Only update if the fetch hasn't altered state yet
    if (isSubscribed) {
      valueSetStateCallback(valueSets);
    }
    setIsLoading(false);
  }
}

/**
 * Query to apply for future view
 * @param p - object param for readability
 * @param p.patientForQuery - patient to do query against
 * @param p.selectedQuery - query use case
 * @param p.queryValueSets - valuesets to filter query from default usecase
 * @param p.queryResponseStateCallback - callback function to update state of the
 * query response
 * @param p.fhirServer - fhir server to do the querying against
 * @param p.setIsLoading - callback to update loading state
 */
export async function fetchQueryResponse(p: {
  patientForQuery: Patient | undefined;
  selectedQuery: USE_CASES;
  queryValueSets: ValueSet[];
  fhirServer: FHIR_SERVERS;
  queryResponseStateCallback: SetStateCallback<UseCaseQueryResponse>;
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
      first_name: patientFirstName as string,
      last_name: patientLastName as string,
      dob: p.patientForQuery.birthDate as string,
      mrn: patientMRN,
      fhir_server: p.fhirServer,
      use_case: p.selectedQuery,
    };

    p.setIsLoading(true);
    const queryResponse = await UseCaseQuery(
      newRequest,
      p.queryValueSets.filter((item) => item.includeValueSet),
      {
        Patient: [p.patientForQuery],
      },
    );
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
