import { CustomQuery, extractChainedPatientDemographics } from "./custom-query";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  QueryDataColumn,
  QueryTableResult,
} from "../../(pages)/queryBuilding/utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";
import { Patient } from "fhir/r4";

const PATIENT_ID = "patient-123";
const RXNORM_CODE = "1665005";
const SNOMED_CODE = "240589008";

function buildConditionQuery(
  queryStrategy: "default" | "epic" = "default",
  conditionCodes: string[] = [SNOMED_CODE],
  timeboxWindows?: QueryTableResult["timeboxWindows"],
): CustomQuery {
  const conditionValueSet: DibbsValueSet = {
    valueSetId: "vs-conditions",
    valueSetVersion: "1",
    valueSetName: "Test Conditions",
    author: "test",
    system: "http://snomed.info/sct",
    dibbsConceptType: "conditions",
    includeValueSet: true,
    concepts: conditionCodes.map((code) => ({
      code,
      display: `Condition ${code}`,
      include: true,
    })),
    userCreated: false,
  };

  const savedQuery: QueryTableResult = {
    queryName: "Test Condition Query",
    queryId: "query-2",
    queryData: { "condition-1": { "vs-conditions": conditionValueSet } },
    conditionsList: [],
    medicalRecordSections: EMPTY_MEDICAL_RECORD_SECTIONS,
    timeboxWindows,
  };

  return new CustomQuery(savedQuery, PATIENT_ID, queryStrategy);
}

function buildMedicationQuery(
  timeboxWindows?: QueryTableResult["timeboxWindows"],
  queryStrategy: "default" | "epic" = "default",
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

  return new CustomQuery(savedQuery, PATIENT_ID, queryStrategy);
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

describe("CustomQuery epic strategy", () => {
  it("keeps default-mode query shapes unchanged", () => {
    const customQuery = buildConditionQuery("default");

    const condition = customQuery.getQuery("condition");
    expect(condition.basePath).toBe("/Condition/_search");
    expect(condition.params.get("subject")).toBe(`Patient/${PATIENT_ID}`);
    expect(condition.params.get("code")).toBe(SNOMED_CODE);

    const encounter = customQuery.getQuery("encounter");
    expect(encounter.basePath).toBe("/Encounter/_search");
    expect(encounter.params.get("reason-code")).toBe(SNOMED_CODE);

    expect(customQuery.compileEpicConditionQueries()).toHaveLength(1);
  });

  it("builds a GET-based MedicationRequest query without a code filter", () => {
    const customQuery = buildMedicationQuery(undefined, "epic");

    const request = customQuery.getQuery("medicationRequest");
    expect(request.basePath).toBe("/MedicationRequest");
    // Epic's search expects a bare patient id, not a Patient/ reference.
    expect(request.params.get("patient")).toBe(PATIENT_ID);
    expect(request.params.get("subject")).toBeNull();
    expect(request.params.get("code")).toBeNull();
    expect(request.params.get("_include")).toBe("MedicationRequest:medication");
    // No _revinclude in epic mode: Epic doesn't document support for it on
    // MedicationRequest GETs and an unrecognized param could fail the search.
    expect(request.params.get("_revinclude")).toBeNull();

    const defaultRequest = buildMedicationQuery(undefined, "default").getQuery(
      "medicationRequest",
    );
    expect(defaultRequest.params.get("_revinclude")).toBe(
      "MedicationAdministration:request",
    );
  });

  it("does not compile a MedicationStatement query (Epic has no R4 endpoint)", () => {
    const customQuery = buildMedicationQuery(undefined, "epic");
    expect(customQuery.getQuery("medicationStatement").basePath).toBe("");

    const defaultStatement = buildMedicationQuery(
      undefined,
      "default",
    ).getQuery("medicationStatement");
    expect(defaultStatement.basePath).toBe("/MedicationStatement/_search");
    expect(defaultStatement.params.get("subject")).toBe(
      `Patient/${PATIENT_ID}`,
    );
  });

  it("excludes medication queries from the POST batch in epic mode", () => {
    const customQuery = buildMedicationQuery(undefined, "epic");
    const postPaths = customQuery.compileAllPostRequests().map((q) => q.path);
    expect(postPaths).not.toContain("/MedicationRequest");
    expect(postPaths).not.toContain("/MedicationStatement");

    const defaultQuery = buildMedicationQuery(undefined, "default");
    const defaultPaths = defaultQuery
      .compileAllPostRequests()
      .map((q) => q.path);
    expect(defaultPaths).toContain("/MedicationRequest/_search");
    expect(defaultPaths).toContain("/MedicationStatement/_search");
  });

  it("keeps medication time filters in epic mode", () => {
    const customQuery = buildMedicationQuery(
      {
        medications: {
          timeWindowStart: "2024-01-01T00:00:00Z",
          timeWindowEnd: "2024-12-31T00:00:00Z",
        },
      },
      "epic",
    );

    expect(
      customQuery.getQuery("medicationRequest").params.getAll("authoredon"),
    ).toEqual(["ge2024-01-01", "le2024-12-31"]);
  });

  it("does not compile condition or encounter queries into the resource dictionary", () => {
    const customQuery = buildConditionQuery("epic");
    expect(customQuery.getQuery("condition").basePath).toBe("");
    expect(customQuery.getQuery("encounter").basePath).toBe("");
    const postPaths = customQuery.compileAllPostRequests().map((q) => q.path);
    expect(postPaths).not.toContain("/Condition/_search");
    expect(postPaths).not.toContain("/Encounter/_search");
  });

  it("compiles GET-based Condition queries with the query codes", () => {
    const customQuery = buildConditionQuery("epic");
    const conditionQueries = customQuery.compileEpicConditionQueries();

    expect(conditionQueries).toHaveLength(1);
    expect(conditionQueries[0].basePath).toBe("/Condition");
    // Epic's search expects a bare patient id, not a Patient/ reference.
    expect(conditionQueries[0].params.get("patient")).toBe(PATIENT_ID);
    expect(conditionQueries[0].params.get("code")).toBe(SNOMED_CODE);
  });

  it("chunks long condition code lists across multiple GET queries", () => {
    const manyCodes = Array.from({ length: 120 }, (_, i) => `code-${i}`);
    const customQuery = buildConditionQuery("epic", manyCodes);
    const conditionQueries = customQuery.compileEpicConditionQueries();

    expect(conditionQueries).toHaveLength(3);
    const allCodes = conditionQueries.flatMap((q) =>
      (q.params.get("code") ?? "").split(","),
    );
    expect(allCodes).toEqual(manyCodes);
  });

  it("compiles Encounter queries from Condition ids, chunked", () => {
    const customQuery = buildConditionQuery("epic", [SNOMED_CODE], {
      conditions: {
        timeWindowStart: "2024-01-01T00:00:00Z",
        timeWindowEnd: "2024-12-31T00:00:00Z",
      },
    });

    const encounterQueries = customQuery.compileEpicEncounterQueries([
      "cond-1",
      "cond-2",
    ]);
    expect(encounterQueries).toHaveLength(1);
    expect(encounterQueries[0].basePath).toBe("/Encounter");
    // Epic's search expects a bare patient id, not a Patient/ reference.
    expect(encounterQueries[0].params.get("patient")).toBe(PATIENT_ID);
    expect(encounterQueries[0].params.get("diagnosis")).toBe(
      "Condition/cond-1,Condition/cond-2",
    );
    expect(encounterQueries[0].params.getAll("date")).toEqual([
      "ge2024-01-01",
      "le2024-12-31",
    ]);

    const manyIds = Array.from({ length: 60 }, (_, i) => `cond-${i}`);
    expect(customQuery.compileEpicEncounterQueries(manyIds)).toHaveLength(3);
    expect(customQuery.compileEpicEncounterQueries([])).toHaveLength(0);
  });
});

describe("CustomQuery immunization queries", () => {
  const immunizationSavedQuery: QueryTableResult = {
    queryName: "Immunization Query",
    queryId: "query-imm",
    queryData: {},
    conditionsList: [],
    medicalRecordSections: {
      ...EMPTY_MEDICAL_RECORD_SECTIONS,
      immunizations: true,
    },
  };
  const DEMOGRAPHICS = {
    given: "WayneTWOIZG",
    family: "WatersSNHDIZGTWO",
    birthDate: "2018-02-19",
  };

  it("scopes Immunization with the FHIR R4 'patient' search param, not 'subject'", () => {
    const customQuery = new CustomQuery(immunizationSavedQuery, PATIENT_ID);
    const immunization = customQuery.getQuery("immunization");

    expect(immunization.basePath).toBe("/Immunization");
    expect(immunization.params.get("patient")).toBe(`Patient/${PATIENT_ID}`);
    expect(immunization.params.get("subject")).toBeNull();

    // Epic's search expects a bare patient id, not a Patient/ reference.
    const epicImmunization = new CustomQuery(
      immunizationSavedQuery,
      PATIENT_ID,
      "epic",
    ).getQuery("immunization");
    expect(epicImmunization.params.get("patient")).toBe(PATIENT_ID);
  });

  it("uses chained demographic params for immunization endpoints", () => {
    const immunization = new CustomQuery(
      immunizationSavedQuery,
      PATIENT_ID,
      "default",
      { endpointType: "immunization", patientDemographics: DEMOGRAPHICS },
    ).getQuery("immunization");

    expect(immunization.basePath).toBe("/Immunization");
    expect(immunization.params.get("patient.given")).toBe("WayneTWOIZG");
    expect(immunization.params.get("patient.family")).toBe("WatersSNHDIZGTWO");
    expect(immunization.params.get("patient.birthdate")).toBe("2018-02-19");
    expect(immunization.params.get("patient")).toBeNull();

    // Still a GET-only query.
    const postPaths = new CustomQuery(
      immunizationSavedQuery,
      PATIENT_ID,
      "default",
      { endpointType: "immunization", patientDemographics: DEMOGRAPHICS },
    )
      .compileAllPostRequests()
      .map((r) => r.path);
    expect(postPaths).not.toContain("/Immunization");
  });

  it("falls back to the patient param on immunization endpoints without demographics", () => {
    const immunization = new CustomQuery(
      immunizationSavedQuery,
      PATIENT_ID,
      "default",
      { endpointType: "immunization" },
    ).getQuery("immunization");
    expect(immunization.params.get("patient")).toBe(`Patient/${PATIENT_ID}`);
    expect(immunization.params.get("patient.given")).toBeNull();

    const epicImmunization = new CustomQuery(
      immunizationSavedQuery,
      PATIENT_ID,
      "epic",
      { endpointType: "immunization" },
    ).getQuery("immunization");
    expect(epicImmunization.params.get("patient")).toBe(PATIENT_ID);
  });

  it("ignores demographics on standard endpoints", () => {
    const immunization = new CustomQuery(
      immunizationSavedQuery,
      PATIENT_ID,
      "default",
      { endpointType: "standard", patientDemographics: DEMOGRAPHICS },
    ).getQuery("immunization");
    expect(immunization.params.get("patient")).toBe(`Patient/${PATIENT_ID}`);
    expect(immunization.params.get("patient.given")).toBeNull();
  });
});

describe("extractChainedPatientDemographics", () => {
  const basePatient: Patient = {
    resourceType: "Patient",
    id: "patient-123",
    name: [{ given: ["Wayne", "Bruce"], family: "Waters" }],
    birthDate: "2018-02-19",
  };

  it("uses the first given name, the family name, and the birth date", () => {
    expect(extractChainedPatientDemographics(basePatient)).toEqual({
      given: "Wayne",
      family: "Waters",
      birthDate: "2018-02-19",
    });
  });

  it("prefers the official name over other name entries", () => {
    const patient: Patient = {
      ...basePatient,
      name: [
        { use: "nickname", given: ["Bats"], family: "Man" },
        { use: "official", given: ["Wayne"], family: "Waters" },
      ],
    };
    expect(extractChainedPatientDemographics(patient)).toEqual({
      given: "Wayne",
      family: "Waters",
      birthDate: "2018-02-19",
    });
  });

  it("falls back to the first usable name when none is official", () => {
    const patient: Patient = {
      ...basePatient,
      name: [
        { use: "official", family: "TextOnly" }, // no given name — not usable
        { given: ["Wayne"], family: "Waters" },
      ],
    };
    expect(extractChainedPatientDemographics(patient)).toEqual({
      given: "Wayne",
      family: "Waters",
      birthDate: "2018-02-19",
    });
  });

  it.each([
    ["missing name", { ...basePatient, name: undefined }],
    ["empty name list", { ...basePatient, name: [] }],
    ["name without family", { ...basePatient, name: [{ given: ["Wayne"] }] }],
    ["name without given", { ...basePatient, name: [{ family: "Waters" }] }],
    ["missing birthDate", { ...basePatient, birthDate: undefined }],
    ["year-only birthDate", { ...basePatient, birthDate: "2018" }],
    ["year-month birthDate", { ...basePatient, birthDate: "2018-02" }],
  ] as [string, Patient][])("returns undefined for %s", (_label, patient) => {
    expect(extractChainedPatientDemographics(patient)).toBeUndefined();
  });
});
