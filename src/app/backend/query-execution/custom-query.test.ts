import { CustomQuery } from "./custom-query";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  QueryDataColumn,
  QueryTableResult,
} from "../../(pages)/queryBuilding/utils";
import { DibbsValueSet } from "@/app/models/entities/valuesets";

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

  it("builds GET-based medication queries without code filters", () => {
    const customQuery = buildMedicationQuery(undefined, "epic");

    const request = customQuery.getQuery("medicationRequest");
    expect(request.basePath).toBe("/MedicationRequest");
    expect(request.params.get("patient")).toBe(`Patient/${PATIENT_ID}`);
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

    const statement = customQuery.getQuery("medicationStatement");
    expect(statement.basePath).toBe("/MedicationStatement");
    expect(statement.params.get("patient")).toBe(`Patient/${PATIENT_ID}`);
    expect(statement.params.get("code")).toBeNull();
    expect(statement.params.get("_include")).toBe(
      "MedicationStatement:medication",
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
    expect(
      customQuery.getQuery("medicationStatement").params.getAll("effective"),
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
    expect(conditionQueries[0].params.get("patient")).toBe(
      `Patient/${PATIENT_ID}`,
    );
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
    expect(encounterQueries[0].params.get("patient")).toBe(
      `Patient/${PATIENT_ID}`,
    );
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
