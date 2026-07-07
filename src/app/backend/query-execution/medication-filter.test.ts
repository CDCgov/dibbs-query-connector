import {
  Medication,
  MedicationAdministration,
  MedicationRequest,
  MedicationStatement,
} from "fhir/r4";
import { QueryResponse } from "@/app/models/entities/query";
import { filterMedicationResourcesByCode } from "./medication-filter";

const MATCHING_CODE = "1665005";
const OTHER_CODE = "999999";

function makeRequest(
  id: string,
  overrides: Partial<MedicationRequest> = {},
): MedicationRequest {
  return {
    resourceType: "MedicationRequest",
    id,
    status: "active",
    intent: "order",
    subject: { reference: "Patient/p1" },
    ...overrides,
  };
}

function makeStatement(
  id: string,
  overrides: Partial<MedicationStatement> = {},
): MedicationStatement {
  return {
    resourceType: "MedicationStatement",
    id,
    status: "active",
    subject: { reference: "Patient/p1" },
    ...overrides,
  };
}

function makeMedication(id: string, code: string): Medication {
  return {
    resourceType: "Medication",
    id,
    code: {
      coding: [{ system: "http://www.nlm.nih.gov/research/umls/rxnorm", code }],
    },
  };
}

describe("filterMedicationResourcesByCode", () => {
  it("keeps requests whose medicationCodeableConcept matches and drops others", () => {
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("match", {
          medicationCodeableConcept: {
            coding: [{ code: MATCHING_CODE }],
          },
        }),
        makeRequest("no-match", {
          medicationCodeableConcept: {
            coding: [{ code: OTHER_CODE }],
          },
        }),
      ],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationRequest?.map((r) => r.id)).toEqual(["match"]);
  });

  it("resolves medicationReference against returned Medication resources", () => {
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("match", {
          medicationReference: { reference: "Medication/med-1" },
        }),
        makeRequest("no-match", {
          medicationReference: { reference: "Medication/med-2" },
        }),
      ],
      Medication: [
        makeMedication("med-1", MATCHING_CODE),
        makeMedication("med-2", OTHER_CODE),
      ],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationRequest?.map((r) => r.id)).toEqual(["match"]);
    // Medication for the dropped request should be pruned too
    expect(filtered.Medication?.map((m) => m.id)).toEqual(["med-1"]);
  });

  it("resolves absolute-URL medication references", () => {
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("match", {
          medicationReference: {
            reference: "https://fhir.example.com/api/FHIR/R4/Medication/med-1",
          },
        }),
      ],
      Medication: [makeMedication("med-1", MATCHING_CODE)],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationRequest?.map((r) => r.id)).toEqual(["match"]);
  });

  it("resolves contained Medication resources via local references", () => {
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("match", {
          medicationReference: { reference: "#local-med" },
          contained: [
            {
              ...makeMedication("local-med", MATCHING_CODE),
            },
          ],
        }),
        makeRequest("no-match", {
          medicationReference: { reference: "#local-med" },
          contained: [
            {
              ...makeMedication("local-med", OTHER_CODE),
            },
          ],
        }),
      ],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationRequest?.map((r) => r.id)).toEqual(["match"]);
  });

  it("fails open for resources whose medication codes can't be determined", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("unresolvable-ref", {
          medicationReference: { reference: "Medication/not-returned" },
        }),
        makeRequest("no-medication-at-all"),
      ],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationRequest?.map((r) => r.id)).toEqual([
      "unresolvable-ref",
      "no-medication-at-all",
    ]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("filters MedicationStatements the same way", () => {
    const response: QueryResponse = {
      MedicationStatement: [
        makeStatement("match", {
          medicationCodeableConcept: { coding: [{ code: MATCHING_CODE }] },
        }),
        makeStatement("no-match", {
          medicationCodeableConcept: { coding: [{ code: OTHER_CODE }] },
        }),
      ],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationStatement?.map((s) => s.id)).toEqual(["match"]);
  });

  it("prunes MedicationAdministrations whose request was dropped", () => {
    const administrations: MedicationAdministration[] = [
      {
        resourceType: "MedicationAdministration",
        id: "admin-kept",
        status: "completed",
        subject: { reference: "Patient/p1" },
        medicationCodeableConcept: { coding: [{ code: MATCHING_CODE }] },
        effectiveDateTime: "2024-01-01",
        request: { reference: "MedicationRequest/match" },
      },
      {
        resourceType: "MedicationAdministration",
        id: "admin-dropped",
        status: "completed",
        subject: { reference: "Patient/p1" },
        medicationCodeableConcept: { coding: [{ code: OTHER_CODE }] },
        effectiveDateTime: "2024-01-01",
        request: { reference: "MedicationRequest/no-match" },
      },
    ];
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("match", {
          medicationCodeableConcept: { coding: [{ code: MATCHING_CODE }] },
        }),
        makeRequest("no-match", {
          medicationCodeableConcept: { coding: [{ code: OTHER_CODE }] },
        }),
      ],
      MedicationAdministration: administrations,
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationAdministration?.map((a) => a.id)).toEqual([
      "admin-kept",
    ]);
  });

  it("removes resource-type keys whose arrays become empty", () => {
    const response: QueryResponse = {
      MedicationRequest: [
        makeRequest("no-match", {
          medicationCodeableConcept: { coding: [{ code: OTHER_CODE }] },
        }),
      ],
      Medication: [makeMedication("med-1", OTHER_CODE)],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.MedicationRequest).toBeUndefined();
    expect(filtered.Medication).toBeUndefined();
  });

  it("leaves other resource types untouched", () => {
    const response: QueryResponse = {
      Patient: [{ resourceType: "Patient", id: "p1" }],
      MedicationRequest: [
        makeRequest("no-match", {
          medicationCodeableConcept: { coding: [{ code: OTHER_CODE }] },
        }),
      ],
    };

    const filtered = filterMedicationResourcesByCode(response, [MATCHING_CODE]);
    expect(filtered.Patient?.map((p) => p.id)).toEqual(["p1"]);
  });

  it("no-ops when the code list is empty", () => {
    const response: QueryResponse = {
      MedicationRequest: [makeRequest("kept")],
    };
    expect(filterMedicationResourcesByCode(response, [])).toBe(response);
  });
});
