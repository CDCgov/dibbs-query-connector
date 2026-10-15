"use server";

import type {
  PatientDiscoveryRequest,
  PatientRecordsRequest,
} from "../../models/entities/query";
import { UNAUTHORIZED_LITERAL } from "../../constants";
import { authenticationRequired } from "../db/decorators";
import { getSavedQuerySummaries } from "../query-building/service";
import {
  patientDiscoveryQuery as runPatientDiscoveryQuery,
  patientRecordsQuery as runPatientRecordsQuery,
} from "./service";

export type {
  PatientDiscoveryResponse,
  PatientRecordsResponse,
} from "./service";

// Client-facing entry points for query execution. service.ts holds the
// implementation without access checks; the REST API, which authenticates
// with a service token rather than a session, calls it directly.
class QueryExecutionActions {
  /**
   * Runs a saved query for a patient. Callers may only run saved queries they
   * can see in getSavedQuerySummaries: admins see every query, and standard
   * users see the queries assigned to their user groups.
   * @param request - The saved query name, patient, and FHIR server to use
   * @returns The FHIR resources matching the saved query
   */
  @authenticationRequired
  static async patientRecordsQuery(request: PatientRecordsRequest) {
    const availableQueries = await getSavedQuerySummaries();
    if (!availableQueries.some((q) => q.queryName === request.queryName)) {
      throw Error(
        `Saved query ${request.queryName} is not available to the current user`,
        { cause: UNAUTHORIZED_LITERAL },
      );
    }
    return runPatientRecordsQuery(request);
  }

  /**
   * Searches a FHIR server for patients matching the given demographics.
   * @param request - The patient demographics and FHIR server to search
   * @returns The matching patients
   */
  @authenticationRequired
  static async patientDiscoveryQuery(request: PatientDiscoveryRequest) {
    return runPatientDiscoveryQuery(request);
  }
}

export const patientRecordsQuery = QueryExecutionActions.patientRecordsQuery;
export const patientDiscoveryQuery =
  QueryExecutionActions.patientDiscoveryQuery;
