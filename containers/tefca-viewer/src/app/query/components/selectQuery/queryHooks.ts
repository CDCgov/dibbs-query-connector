import {
  FHIR_SERVERS,
  USE_CASES,
  UseCaseToQueryName,
  ValueSetItem,
} from "@/app/constants";
import {
  getSavedQueryByName,
  mapQueryRowsToValueSetItems,
} from "@/app/database-service";
import { UseCaseQuery, UseCaseQueryResponse } from "@/app/query-service";
import { Patient } from "fhir/r4";

type SetStateCallback<T> = React.Dispatch<React.SetStateAction<T>>;

/**
 * Query to grab valuesets based on use case
 * @param selectedQuery - Query use case that's been selected
 * @param valueSetStateCallback - state update function to set the valuesets
 * @param isSubscribed - state destructor hook to prevent race conditions
 */
export async function fetchUseCaseValueSets(
  selectedQuery: USE_CASES,
  valueSetStateCallback: SetStateCallback<ValueSetItem[]>,
  isSubscribed: boolean,
) {
  if (selectedQuery) {
    const queryName = UseCaseToQueryName[selectedQuery as USE_CASES];
    const queryResults = await getSavedQueryByName(queryName);
    const vsItems = await mapQueryRowsToValueSetItems(queryResults);

    // Only update if the fetch hasn't altered state yet
    if (isSubscribed) {
      valueSetStateCallback(vsItems);
    }
  }
}

/**
 * Query to apply for future view
 * @param patientForQuery - patient to do query against
 * @param selectedQuery - query use case
 * @param isSubscribed - state destructor hook to prevent race conditions
 * @param queryValueSets - valuesets to filter query from default usecase
 * @param queryResponseStateCallback - callback function to update state of the
 * query response
 * @param fhirServer - fhir server to do the querying against
 */
export async function fetchQueryResponse(
  patientForQuery: Patient | undefined,
  selectedQuery: USE_CASES,
  isSubscribed: boolean,
  queryValueSets: ValueSetItem[],
  queryResponseStateCallback: SetStateCallback<UseCaseQueryResponse>,
  fhirServer: FHIR_SERVERS,
) {
  if (patientForQuery && selectedQuery && isSubscribed) {
    const patientFirstName =
      getNthElementIfDefined(patientForQuery.name, -1)?.given?.join(" ") ??
      "Hyper";
    const patientLastName =
      getNthElementIfDefined(patientForQuery.name, -1)?.family ?? "Unlucky";

    const patientMRN =
      getNthElementIfDefined(patientForQuery.identifier)?.value ??
      HYPER_UNLUCKY_MRN;

    const newRequest = {
      first_name: patientFirstName as string,
      last_name: patientLastName as string,
      dob: patientForQuery.birthDate as string,
      mrn: patientMRN,
      fhir_server: fhirServer,
      use_case: selectedQuery,
    };

    const queryResponse = await UseCaseQuery(
      newRequest,
      queryValueSets.filter((item) => item.include),
      {
        Patient: [patientForQuery],
      },
    );

    queryResponseStateCallback(queryResponse);
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

const HYPER_UNLUCKY_MRN = "8692756";
