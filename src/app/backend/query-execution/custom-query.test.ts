import { CustomQuery } from "./custom-query";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  QueryDataColumn,
  QueryTableResult,
} from "../../(pages)/queryBuilding/utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

const PATIENT_ID = "patient-123";
const RXNORM_CODE = "1665005";

function buildMedicationQuery(
  timeboxWindows?: QueryTableResult["timeboxWindows"],
): CustomQuery {
  const medicationValueSet: DibbsValueSet = {
    valueSetId: "vs-meds",
    valueSetVersion: "1",
    valueSetName: "Test Medications",
    author: "test",
    system: "http://www.nlm.nih.gov/research/umls/rxnorm",
    dibbsConceptType: "medications",
    includeValueSet: true,
    concepts: [
      {
        code: RXNORM_CODE,
        display: "ceftriaxone 500 MG Injection",
        include: true,
      },
    ],
    userCreated: false,
  };

  const queryData: QueryDataColumn = {
    "condition-1": { "vs-meds": medicationValueSet },
  };

  const savedQuery: QueryTableResult = {
    queryName: "Test Medication Query",
    queryId: "query-1",
    queryData,
    conditionsList: [],
    medicalRecordSections: EMPTY_MEDICAL_RECORD_SECTIONS,
    timeboxWindows,
  };

  return new CustomQuery(savedQuery, PATIENT_ID);
}

describe("CustomQuery medication queries", () => {
  it("builds a MedicationStatement query alongside MedicationRequest", () => {
    const customQuery = buildMedicationQuery();

    const statement = customQuery.getQuery("medicationStatement");
    expect(statement.basePath).toBe("/MedicationStatement/_search");
    expect(statement.params.get("subject")).toBe(`Patient/${PATIENT_ID}`);
    expect(statement.params.get("code")).toBe(RXNORM_CODE);
    expect(statement.params.get("_include")).toBe(
      "MedicationStatement:medication",
    );

    // The existing MedicationRequest query should still be present
    const request = customQuery.getQuery("medicationRequest");
    expect(request.basePath).toBe("/MedicationRequest/_search");
  });

  it("applies the medication time filter to MedicationStatement via the effective param", () => {
    const customQuery = buildMedicationQuery({
      medications: {
        timeWindowStart: "2024-01-01T00:00:00Z",
        timeWindowEnd: "2024-12-31T00:00:00Z",
      },
    });

    const statement = customQuery.getQuery("medicationStatement");
    expect(statement.params.getAll("effective")).toEqual([
      "ge2024-01-01",
      "le2024-12-31",
    ]);
  });

  it("does not build a MedicationStatement query when no medication codes are present", () => {
    const savedQuery: QueryTableResult = {
      queryName: "Empty Query",
      queryId: "query-empty",
      queryData: {},
      conditionsList: [],
      medicalRecordSections: EMPTY_MEDICAL_RECORD_SECTIONS,
    };

    const customQuery = new CustomQuery(savedQuery, PATIENT_ID);
    expect(customQuery.getQuery("medicationStatement").basePath).toBe("");
  });
});

describe("CustomQuery immunization queries", () => {
  it("scopes Immunization with the FHIR R4 'patient' search param, not 'subject'", () => {
    const savedQuery: QueryTableResult = {
      queryName: "Immunization Query",
      queryId: "query-imm",
      queryData: {},
      conditionsList: [],
      medicalRecordSections: {
        ...EMPTY_MEDICAL_RECORD_SECTIONS,
        immunizations: true,
      },
    };

    const customQuery = new CustomQuery(savedQuery, PATIENT_ID);
    const immunization = customQuery.getQuery("immunization");

    expect(immunization.basePath).toBe("/Immunization");
    expect(immunization.params.get("patient")).toBe(`Patient/${PATIENT_ID}`);
    expect(immunization.params.get("subject")).toBeNull();
  });
});
