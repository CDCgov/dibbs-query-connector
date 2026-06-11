import { CustomQuery } from "./custom-query";
import {
  DEFAULT_MEDICAL_RECORD_SECTIONS,
  MedicalRecordSections,
  normalizeMedicalRecordSections,
  QueryDataColumn,
  QueryTableResult,
} from "../../(pages)/queryBuilding/utils";
import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";

const PATIENT_ID = "patient-123";
const RXNORM_CODE = "1665005";
const LOINC_CODE = "24115-8";
const SNOMED_CODE = "15628003";

function buildValueSet(
  conceptType: DibbsConceptType,
  code: string,
): DibbsValueSet {
  return {
    valueSetId: `vs-${conceptType}`,
    valueSetVersion: "1",
    valueSetName: `Test ${conceptType}`,
    author: "test",
    system: "http://example.com/codesystem",
    dibbsConceptType: conceptType,
    includeValueSet: true,
    concepts: [{ code, display: `Test ${conceptType} concept`, include: true }],
    userCreated: false,
  };
}

const FULL_QUERY_DATA: QueryDataColumn = {
  "condition-1": {
    "vs-labs": buildValueSet("labs", LOINC_CODE),
    "vs-conditions": buildValueSet("conditions", SNOMED_CODE),
    "vs-medications": buildValueSet("medications", RXNORM_CODE),
  },
};

function buildQuery(
  queryData: QueryDataColumn,
  medicalRecordSections: MedicalRecordSections = DEFAULT_MEDICAL_RECORD_SECTIONS,
  timeboxWindows?: QueryTableResult["timeboxWindows"],
): CustomQuery {
  const savedQuery: QueryTableResult = {
    queryName: "Test Query",
    queryId: "query-1",
    queryData,
    conditionsList: [],
    medicalRecordSections,
    timeboxWindows,
  };

  return new CustomQuery(savedQuery, PATIENT_ID);
}

function buildMedicationQuery(
  timeboxWindows?: QueryTableResult["timeboxWindows"],
): CustomQuery {
  const queryData: QueryDataColumn = {
    "condition-1": { "vs-meds": buildValueSet("medications", RXNORM_CODE) },
  };
  return buildQuery(queryData, DEFAULT_MEDICAL_RECORD_SECTIONS, timeboxWindows);
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
    const customQuery = buildQuery({});
    expect(customQuery.getQuery("medicationStatement").basePath).toBe("");
  });
});

describe("CustomQuery medical record section gating", () => {
  it("builds all code-driven queries when all core sections are enabled", () => {
    const customQuery = buildQuery(FULL_QUERY_DATA);

    expect(customQuery.getQuery("observation").basePath).toBe(
      "/Observation/_search",
    );
    expect(customQuery.getQuery("diagnosticReport").basePath).toBe(
      "/DiagnosticReport/_search",
    );
    expect(customQuery.getQuery("encounter").basePath).toBe(
      "/Encounter/_search",
    );
    expect(customQuery.getQuery("condition").basePath).toBe(
      "/Condition/_search",
    );
    expect(customQuery.getQuery("medicationRequest").basePath).toBe(
      "/MedicationRequest/_search",
    );
    expect(customQuery.getQuery("medicationStatement").basePath).toBe(
      "/MedicationStatement/_search",
    );
  });

  it("skips Observation and DiagnosticReport when labs is disabled, but still builds ServiceRequest", () => {
    const customQuery = buildQuery(FULL_QUERY_DATA, {
      ...DEFAULT_MEDICAL_RECORD_SECTIONS,
      labs: false,
      serviceRequests: true,
    });

    expect(customQuery.getQuery("observation").basePath).toBe("");
    expect(customQuery.getQuery("diagnosticReport").basePath).toBe("");
    // serviceRequests is independent of labs even though it reuses lab codes
    expect(customQuery.getQuery("serviceRequest").basePath).toBe(
      "/ServiceRequest",
    );
  });

  it("skips Encounter but keeps Condition when only encounters is disabled", () => {
    const customQuery = buildQuery(FULL_QUERY_DATA, {
      ...DEFAULT_MEDICAL_RECORD_SECTIONS,
      encounters: false,
    });

    expect(customQuery.getQuery("encounter").basePath).toBe("");
    expect(customQuery.getQuery("condition").basePath).toBe(
      "/Condition/_search",
    );
  });

  it("skips Condition but keeps Encounter when only conditions is disabled", () => {
    const customQuery = buildQuery(FULL_QUERY_DATA, {
      ...DEFAULT_MEDICAL_RECORD_SECTIONS,
      conditions: false,
    });

    expect(customQuery.getQuery("condition").basePath).toBe("");
    expect(customQuery.getQuery("encounter").basePath).toBe(
      "/Encounter/_search",
    );
  });

  it("skips both medication queries when medications is disabled", () => {
    const customQuery = buildQuery(FULL_QUERY_DATA, {
      ...DEFAULT_MEDICAL_RECORD_SECTIONS,
      medications: false,
    });

    expect(customQuery.getQuery("medicationRequest").basePath).toBe("");
    expect(customQuery.getQuery("medicationStatement").basePath).toBe("");
  });

  it("treats legacy saved sections (without core keys) as all core sections enabled", () => {
    const legacySections: Partial<MedicalRecordSections> = {
      immunizations: true,
      socialDeterminants: false,
      serviceRequests: false,
    };
    const customQuery = buildQuery(
      FULL_QUERY_DATA,
      legacySections as MedicalRecordSections,
    );

    expect(customQuery.getQuery("observation").basePath).toBe(
      "/Observation/_search",
    );
    expect(customQuery.getQuery("encounter").basePath).toBe(
      "/Encounter/_search",
    );
    expect(customQuery.getQuery("condition").basePath).toBe(
      "/Condition/_search",
    );
    expect(customQuery.getQuery("medicationRequest").basePath).toBe(
      "/MedicationRequest/_search",
    );
    expect(customQuery.getQuery("immunization").basePath).toBe("/Immunization");
  });
});

describe("normalizeMedicalRecordSections", () => {
  it("returns defaults for null or undefined input", () => {
    expect(normalizeMedicalRecordSections(null)).toEqual(
      DEFAULT_MEDICAL_RECORD_SECTIONS,
    );
    expect(normalizeMedicalRecordSections(undefined)).toEqual(
      DEFAULT_MEDICAL_RECORD_SECTIONS,
    );
  });

  it("fills missing keys with defaults but preserves explicit values", () => {
    const normalized = normalizeMedicalRecordSections({
      labs: false,
      immunizations: true,
    });

    expect(normalized.labs).toBe(false);
    expect(normalized.immunizations).toBe(true);
    expect(normalized.encounters).toBe(true);
    expect(normalized.conditions).toBe(true);
    expect(normalized.medications).toBe(true);
    expect(normalized.socialDeterminants).toBe(false);
    expect(normalized.serviceRequests).toBe(false);
  });
});
