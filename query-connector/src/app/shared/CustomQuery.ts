import { QueryDataColumn } from "./queryBuilding/utils";

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
  fhirResourceQueries = {
    observation: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    diagnosticReport: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    condition: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    medicationRequest: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    socialHistory: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    encounter: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    encounterClass: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
    immunization: {
      basePath: "",
      params: {} as { [paramName: string]: string },
    },
  };

  /**
   * Creates a CustomQuery Object. The constructor accepts a JSONspec, a
   * DIBBs-defined JSON structure consisting of four keys corresponding to
   * the four types of codes this data class encompasses. These Specs are
   * currently located in the `customQueries` directory of the app.
   * @param savedQueryJson A entry from the query_data column of our query table
   * that has nested information about the conditions / valuesets / concepts
   * relevant to the query
   * @param patientId The ID of the patient to build into query strings.
   */
  constructor(savedQueryJson: QueryDataColumn, patientId: string) {
    try {
      this.patientId = patientId;
      this.initializeQueryConceptTypes(savedQueryJson);
      this.compileFhirResourceQueries(patientId);
    } catch (error) {
      console.error("Could not create CustomQuery Object: ", error);
    }
  }

  initializeQueryConceptTypes(queryData: QueryDataColumn) {
    Object.values(queryData).forEach((condition) => {
      Object.values(condition).forEach((valueSet) => {
        const conceptsToParse = valueSet.concepts.map((c) => c.code);
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
   */
  compileFhirResourceQueries(patientId: string): void {
    const labsFilter = this.labCodes.join(",");
    const medicationsFilter = this.medicationCodes.join(",");
    const conditionsFilter = this.conditionCodes.join(",");

    // TODO: Research / design ticket
    this.fhirResourceQueries["socialHistory"] = {
      basePath: `/Observation/_search`,
      params: {
        subject: `Patient/${patientId}`,
        category: "social-history",
      },
    };

    // this.fhirResourceQueries["immunization"] = {
    //   basePath: `/Immunization/_search`,
    //   params: {
    //     patient: patientId,
    //   },
    // };

    if (labsFilter !== "") {
      this.fhirResourceQueries["observation"] = {
        basePath: `/Observation/_search`,
        params: {
          subject: `Patient/${patientId}`,
          code: labsFilter,
        },
      };

      this.fhirResourceQueries["diagnosticReport"] = {
        basePath: `/DiagnosticReport/_search`,
        params: {
          subject: `Patient/${patientId}`,
          code: labsFilter,
        },
      };
    }

    if (conditionsFilter !== "") {
      this.fhirResourceQueries["encounter"] = {
        basePath: `/Encounter/_search`,
        params: {
          subject: `Patient/${patientId}`,
          "reason-code": conditionsFilter,
        },
      };
      this.fhirResourceQueries["condition"] = {
        basePath: `/Condition/_search`,
        params: {
          subject: `Patient/${patientId}`,
          code: conditionsFilter,
        },
      };
    }

    if (medicationsFilter !== "") {
      // Medications are floating representations of drugs. Sometimes we need the extra
      // info from the medication to display in the UI: that's what the ":medication" is doing
      // and similarly for revinclude for the request <> admin relationship

      this.fhirResourceQueries["medicationRequest"] = {
        basePath: `/MedicationRequest/_search`,
        params: {
          subject: `Patient/${patientId}`,
          code: medicationsFilter,
          _include: "MedicationRequest:medication",
          _revinclude: "MedicationAdministration:request",
        },
      };
    }
  }

  compilePostRequest(resource: {
    basePath: string;
    params: Record<string, string>;
  }) {
    return {
      path: resource.basePath,
      params: resource.params,
    };
  }

  compileAllPostRequests() {
    // return [this.compilePostRequest(this.fhirResourceQueries["condition"])];
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
    params: Record<string, string>;
  } {
    const availableKeys = Object.keys(this.fhirResourceQueries);
    if (!availableKeys.includes(desiredQuery)) {
      return { basePath: "", params: {} };
    }

    return this.fhirResourceQueries[
      desiredQuery as keyof typeof this.fhirResourceQueries
    ];
  }
}
