import {
  MedicalRecordSections,
  QueryDataColumn,
  QueryTableResult,
  QueryTableTimebox,
  TimeWindow,
} from "../../(pages)/queryBuilding/utils";

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
   */
  constructor(savedQuery: QueryTableResult, patientId: string) {
    try {
      this.patientId = patientId;
      const queryData = savedQuery.queryData;
      const medicalRecordSection = savedQuery.medicalRecordSections;
      const timeboxInfo = savedQuery.timeboxWindows;

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
      formattedParams.append("subject", `Patient/${patientId}`);

      this.fhirResourceQueries["immunization"] = {
        basePath: `/Immunization`,
        params: formattedParams,
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

    if (conditionsFilter !== "") {
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

    if (medicationsFilter !== "") {
      // Medications are representations of drugs independent of patient resources.
      // Sometimes we need the extra info from the medication to display in the
      // UI: that's what the ":medication" is doing and similarly for revinclude
      // for the request <> admin relationship
      const formattedParams = new URLSearchParams();
      formattedParams.append("subject", `Patient/${patientId}`);
      formattedParams.append("code", medicationsFilter);
      formattedParams.append("_include", "MedicationRequest:medication");
      formattedParams.append("_revinclude", "MedicationAdministration:request");

      if (medicationsTimeFilter) {
        formattedParams.append("authoredon", medicationsTimeFilter.startDate);
        formattedParams.append("authoredon", medicationsTimeFilter.endDate);
      }

      this.fhirResourceQueries["medicationRequest"] = {
        basePath: `/MedicationRequest/_search`,
        params: formattedParams,
      };
    }
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
        return this.compilePostRequest(q);
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
