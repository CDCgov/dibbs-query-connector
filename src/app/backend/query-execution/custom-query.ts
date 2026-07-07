import {
  MedicalRecordSections,
  QueryDataColumn,
  QueryTableResult,
  QueryTableTimebox,
  TimeWindow,
} from "../../(pages)/queryBuilding/utils";
import { QueryStrategy } from "../../(pages)/fhirServers/page";

// Epic-mode Condition and Encounter queries go out as GETs, so long code /
// reference lists are chunked across multiple requests to keep URLs well under
// common proxy limits. Overlapping results are safe: parseFhirSearch dedupes
// resources by id.
const EPIC_CONDITION_CODE_CHUNK_SIZE = 50;
const EPIC_ENCOUNTER_DIAGNOSIS_CHUNK_SIZE = 25;

// Epic-mode medication searches can't filter by code server-side, so they
// return every medication in the patient's record. We don't follow bundle
// next-links, so ask for a large page to avoid truncation (servers cap this
// at their own maximum per the FHIR spec).
const EPIC_MEDICATION_PAGE_SIZE = "1000";

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

function formatTimeFilter(timeWindow: TimeWindow | undefined) {
  if (!timeWindow) return undefined;
  const startString = timeWindow.timeWindowStart.substring(0, 10);
  const endString = timeWindow.timeWindowEnd.substring(0, 10);

  return {
    startDate: `ge${startString}`,
    endDate: `le${endString}`,
  };
}

/**
 * A Data Class designed to store and manipulate various code values used
 * to create a fully customized FHIR query. The class holds instance variables
 * for each of four types of input codes (lab LOINCs, SNOMED/conditions, RXNorm,
 * and Class/System-Type); the class uses these to automatically compile query
 * strings for each subtype of eCR query that can be built using those codes'
 * information.
 */
export class CustomQuery {
  patientId: string = "";
  queryStrategy: QueryStrategy = "default";
  private timeboxInfo?: QueryTableTimebox;

  // Store four types of input codes
  labCodes: string[] = [];
  medicationCodes: string[] = [];
  conditionCodes: string[] = [];
  classTypeCodes: string[] = [];

  // initialize the query struct
  fhirResourceQueries: {
    [key: string]: {
      basePath: string;
      params: URLSearchParams;
      // flag to filter out this resource from the final POST compilation, used
      // for the medical records sections
      excludeFromPost?: boolean;
    };
  } = {};

  /**
   * Creates a CustomQuery Object. The constructor accepts a JSONspec, a
   * DIBBs-defined JSON structure consisting of four keys corresponding to
   * the four types of codes this data class encompasses. These Specs are
   * currently located in the `customQueries` directory of the app.
   * @param savedQuery A entry from the query table
   * that has nested information about the conditions / valuesets / concepts
   * relevant to the query
   * @param patientId The ID of the patient to build into query strings.
   * @param queryStrategy How the target server supports search: "default"
   * uses spec-standard POST _search queries; "epic" adapts to Epic's
   * supported search parameters (see QueryStrategy).
   */
  constructor(
    savedQuery: QueryTableResult,
    patientId: string,
    queryStrategy: QueryStrategy = "default",
  ) {
    try {
      this.patientId = patientId;
      this.queryStrategy = queryStrategy;
      const queryData = savedQuery.queryData;
      const medicalRecordSection = savedQuery.medicalRecordSections;
      const timeboxInfo = savedQuery.timeboxWindows;
      this.timeboxInfo = timeboxInfo;

      this.initializeQueryConceptTypes(queryData);
      this.compileFhirResourceQueries(
        patientId,
        medicalRecordSection,
        timeboxInfo,
      );
    } catch (error) {
      console.error("Could not create CustomQuery Object: ", error);
    }
  }

  initializeQueryConceptTypes(queryData: QueryDataColumn) {
    Object.values(queryData).forEach((condition) => {
      Object.values(condition).forEach((valueSet) => {
        if (!valueSet.includeValueSet) {
          return;
        }
        const conceptsToParse = valueSet.concepts
          .filter((c) => c.include)
          .map((c) => c.code);

        switch (valueSet.dibbsConceptType) {
          case "labs":
            this.labCodes = this.labCodes.concat(conceptsToParse);
            break;
          case "conditions":
            this.conditionCodes = this.conditionCodes.concat(conceptsToParse);
            break;
          case "medications":
            this.medicationCodes = this.medicationCodes.concat(conceptsToParse);
            break;
          default:
            break;
        }
      });
    });
  }

  /**
   * Compile the stored code information and given patientID into all applicable
   * query strings for later use. If a particular code category has no values in
   * the provided spec (e.g. a Newborn Screening case will have no rxnorm codes),
   * any query built using those codes' filter will be left as the empty string.
   * @param patientId The ID of the patient to query for.
   * @param medicalRecordSections Object containing booleans for each section (e.g. immunization, socialDeterminants)
   * @param medicalRecordSections.immunization Boolean indicating if immunization section is included
   * @param medicalRecordSections.socialDeterminants Boolean indicating if socialDeterminants section is included
   * @param timeboxInfo Time filtering information
   */
  compileFhirResourceQueries(
    patientId: string,
    medicalRecordSections: MedicalRecordSections,
    timeboxInfo?: QueryTableTimebox,
  ): void {
    const labsFilter = this.labCodes.join(",");
    const medicationsFilter = this.medicationCodes.join(",");
    const conditionsFilter = this.conditionCodes.join(",");

    const labsTimeFilter = formatTimeFilter(timeboxInfo?.labs);
    const conditionsTimeFilter = formatTimeFilter(timeboxInfo?.conditions);
    const medicationsTimeFilter = formatTimeFilter(timeboxInfo?.medications);

    if (medicalRecordSections && medicalRecordSections.socialDeterminants) {
      const formattedParams = new URLSearchParams();
      formattedParams.append("subject", `Patient/${patientId}`);
      formattedParams.append("category", `social-history`);

      this.fhirResourceQueries["socialHistory"] = {
        basePath: `/Observation/_search`,
        params: formattedParams,
      };
    }

    if (medicalRecordSections && medicalRecordSections.immunizations) {
      const formattedParams = new URLSearchParams();
      // FHIR R4 Immunization has no "subject" search param; the patient-scoping
      // param is "patient". Using "subject" leaves the query unscoped and the IZ
      // Gateway rejects it ("must contain patient.identifier or name+birthDate").
      formattedParams.append("patient", `Patient/${patientId}`);

      this.fhirResourceQueries["immunization"] = {
        basePath: `/Immunization`,
        params: formattedParams,
        excludeFromPost: true,
      };
    }

    if (medicalRecordSections && medicalRecordSections.serviceRequests) {
      const formattedParams = new URLSearchParams();
      formattedParams.append("subject", `Patient/${patientId}`);
      formattedParams.append("_include", "ServiceRequest:requester");
      formattedParams.append("_include", "ServiceRequest:specimen");

      // todo: should we assume all the code related to service requests are labs?
      formattedParams.append("code", labsFilter);

      // todo: what's the date field that we should be filtering on?
      if (labsTimeFilter) {
        formattedParams.append("authored", labsTimeFilter.startDate);
        formattedParams.append("authored", labsTimeFilter.endDate);
      }

      this.fhirResourceQueries["serviceRequest"] = {
        basePath: `/ServiceRequest`,
        params: formattedParams,
        excludeFromPost: true,
      };
    }

    if (labsFilter !== "") {
      const formattedParams = new URLSearchParams();
      formattedParams.append("subject", `Patient/${patientId}`);
      formattedParams.append("code", labsFilter);

      if (labsTimeFilter) {
        formattedParams.append("date", labsTimeFilter.startDate);
        formattedParams.append("date", labsTimeFilter.endDate);
      }

      this.fhirResourceQueries["observation"] = {
        basePath: `/Observation/_search`,
        params: formattedParams,
      };

      this.fhirResourceQueries["diagnosticReport"] = {
        basePath: `/DiagnosticReport/_search`,
        params: formattedParams,
      };
    }

    if (conditionsFilter !== "" && this.queryStrategy !== "epic") {
      const encounterParams = new URLSearchParams();
      encounterParams.append("subject", `Patient/${patientId}`);
      encounterParams.append("reason-code", conditionsFilter);

      if (conditionsTimeFilter) {
        encounterParams.append("date", conditionsTimeFilter.startDate);
        encounterParams.append("date", conditionsTimeFilter.endDate);
      }

      this.fhirResourceQueries["encounter"] = {
        basePath: `/Encounter/_search`,
        params: encounterParams,
      };

      const conditionParams = new URLSearchParams();
      conditionParams.append("subject", `Patient/${patientId}`);
      conditionParams.append("code", conditionsFilter);
      if (conditionsTimeFilter) {
        conditionParams.append("onset-date", conditionsTimeFilter.startDate);
        conditionParams.append("onset-date", conditionsTimeFilter.endDate);
      }

      this.fhirResourceQueries["condition"] = {
        basePath: `/Condition/_search`,
        params: conditionParams,
      };
    }
    // In Epic mode, Condition and Encounter queries aren't compiled here.
    // Epic's Encounter reason-code search matches text (not SNOMED codes), so
    // Encounters are instead found via references to the patient's matching
    // Conditions — a two-step flow the service layer drives with
    // compileEpicConditionQueries() and compileEpicEncounterQueries().

    if (medicationsFilter !== "") {
      const isEpic = this.queryStrategy === "epic";

      // Medications are representations of drugs independent of patient resources.
      // Sometimes we need the extra info from the medication to display in the
      // UI: that's what the ":medication" is doing and similarly for revinclude
      // for the request <> admin relationship
      const formattedParams = new URLSearchParams();
      if (isEpic) {
        // Epic only supports GET searches for MedicationRequest with a fixed
        // parameter set (patient, category, status, authoredon, date, intent)
        // — no "code". Fetch all of the patient's medication requests; the
        // service layer filters them to the query's RxNorm codes client-side.
        formattedParams.append("patient", `Patient/${patientId}`);
        formattedParams.append("_count", EPIC_MEDICATION_PAGE_SIZE);
      } else {
        formattedParams.append("subject", `Patient/${patientId}`);
        formattedParams.append("code", medicationsFilter);
      }
      formattedParams.append("_include", "MedicationRequest:medication");
      if (!isEpic) {
        // Epic's MedicationRequest GET doesn't document _revinclude support
        // and unrecognized search parameters can fail the whole request, which
        // would lose every medication. Forgo MedicationAdministration in Epic
        // mode rather than risk that. The _include above is kept because the
        // client-side code filter needs the referenced Medications (and fails
        // open if the server ignores it).
        formattedParams.append(
          "_revinclude",
          "MedicationAdministration:request",
        );
      }

      if (medicationsTimeFilter) {
        formattedParams.append("authoredon", medicationsTimeFilter.startDate);
        formattedParams.append("authoredon", medicationsTimeFilter.endDate);
      }

      this.fhirResourceQueries["medicationRequest"] = {
        basePath: isEpic ? `/MedicationRequest` : `/MedicationRequest/_search`,
        params: formattedParams,
        excludeFromPost: isEpic,
      };

      // MedicationStatement is a separate resource recording medications a
      // patient is (or was) taking. Query it with the same RXNorm codes; its
      // date search param is "effective" (not "authoredon").
      const statementParams = new URLSearchParams();
      if (isEpic) {
        // Epic returns 404 for POST /MedicationStatement/_search and doesn't
        // support "code" filtering; GET by patient and filter client-side.
        statementParams.append("patient", `Patient/${patientId}`);
        statementParams.append("_count", EPIC_MEDICATION_PAGE_SIZE);
      } else {
        statementParams.append("subject", `Patient/${patientId}`);
        statementParams.append("code", medicationsFilter);
      }
      statementParams.append("_include", "MedicationStatement:medication");

      if (medicationsTimeFilter) {
        statementParams.append("effective", medicationsTimeFilter.startDate);
        statementParams.append("effective", medicationsTimeFilter.endDate);
      }

      this.fhirResourceQueries["medicationStatement"] = {
        basePath: isEpic
          ? `/MedicationStatement`
          : `/MedicationStatement/_search`,
        params: statementParams,
        excludeFromPost: isEpic,
      };
    }
  }

  /**
   * Epic-mode Condition GET queries. Epic's POST _search support is limited
   * to Observation/DiagnosticReport, so Conditions are searched via GET with
   * the query's condition codes, chunked to keep URLs bounded.
   * @returns One GET query spec per chunk of condition codes; empty when the
   * query has no condition codes.
   */
  compileEpicConditionQueries(): {
    basePath: string;
    params: URLSearchParams;
  }[] {
    const conditionsTimeFilter = formatTimeFilter(this.timeboxInfo?.conditions);

    return chunkArray(this.conditionCodes, EPIC_CONDITION_CODE_CHUNK_SIZE).map(
      (codes) => {
        const params = new URLSearchParams();
        params.append("patient", `Patient/${this.patientId}`);
        params.append("code", codes.join(","));
        if (conditionsTimeFilter) {
          params.append("onset-date", conditionsTimeFilter.startDate);
          params.append("onset-date", conditionsTimeFilter.endDate);
        }
        return { basePath: `/Condition`, params };
      },
    );
  }

  /**
   * Epic-mode Encounter GET queries, built from the ids of the patient's
   * Conditions that matched the query codes. Epic recommends searching
   * Encounters by diagnosis (Condition references) rather than reason-code,
   * whose Epic search semantics are text matching rather than code matching.
   * @param conditionIds ids of matching Condition resources returned by the
   * Epic-mode Condition queries
   * @returns One GET query spec per chunk of Condition references; empty when
   * no Condition ids are provided.
   */
  compileEpicEncounterQueries(
    conditionIds: string[],
  ): { basePath: string; params: URLSearchParams }[] {
    const conditionsTimeFilter = formatTimeFilter(this.timeboxInfo?.conditions);

    return chunkArray(conditionIds, EPIC_ENCOUNTER_DIAGNOSIS_CHUNK_SIZE).map(
      (ids) => {
        const params = new URLSearchParams();
        params.append("patient", `Patient/${this.patientId}`);
        params.append(
          "diagnosis",
          ids.map((id) => `Condition/${id}`).join(","),
        );
        if (conditionsTimeFilter) {
          params.append("date", conditionsTimeFilter.startDate);
          params.append("date", conditionsTimeFilter.endDate);
        }
        return { basePath: `/Encounter`, params };
      },
    );
  }

  compilePostRequest(resource: { basePath: string; params: URLSearchParams }) {
    return {
      path: resource.basePath,
      params: resource.params,
    };
  }

  compileAllPostRequests() {
    return Object.values(this.fhirResourceQueries)
      .map((q) => {
        return q.excludeFromPost
          ? { path: "", params: new URLSearchParams() }
          : this.compilePostRequest(q);
      })
      .filter((v) => v.path !== "");
  }

  /**
   * Sometimes, only a single query is desired rather than a full list. In
   * those cases, this function returns a single specified query string.
   * @param desiredQuery The type of query the user wants.
   * @returns The compiled query string for that type.
   */
  getQuery(desiredQuery: string): {
    basePath: string;
    params: URLSearchParams;
  } {
    const availableKeys = Object.keys(this.fhirResourceQueries);
    if (!availableKeys.includes(desiredQuery)) {
      return { basePath: "", params: new URLSearchParams() };
    }

    return this.fhirResourceQueries[
      desiredQuery as keyof typeof this.fhirResourceQueries
    ];
  }
}
