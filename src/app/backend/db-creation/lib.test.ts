// Importing "../db/service" runs `new DbService()` at module load, which throws
// `DATABASE_URL is not set`, and "./service" pulls in the audit log decorators.
// Neither is exercised by the eRSD indexing under test, so both are stubbed.
jest.mock("../db/service", () => ({
  __esModule: true,
  default: {},
  DbClient: class {},
}));
jest.mock("./service", () => ({ readJsonFromRelativePath: jest.fn() }));
jest.mock("../code-systems/service", () => ({
  getERSD: jest.fn(),
  getVSACValueSet: jest.fn(),
}));

import { Bundle, ValueSet } from "fhir/r4";
import { getERSD } from "../code-systems/service";
import { indexErsdResponseByOid } from "./lib";

const mockGetERSD = getERSD as unknown as jest.Mock;

const PH_CONTEXT = {
  code: {
    system: "http://hl7.org/fhir/us/ecr/CodeSystem/us-ph-usage-context-type",
    code: "priority",
  },
  valueCodeableConcept: {
    coding: [
      {
        system: "http://hl7.org/fhir/us/ecr/CodeSystem/us-ph-usage-context",
        code: "routine",
      },
    ],
  },
};

function conditionContext(code: string, text: string) {
  return {
    code: {
      system: "http://terminology.hl7.org/CodeSystem/usage-context-type",
      code: "focus",
    },
    valueCodeableConcept: {
      coding: [{ system: "http://snomed.info/sct", code }],
      text,
    },
  };
}

function umbrella(id: string, refs: string[]): ValueSet {
  return {
    resourceType: "ValueSet",
    id,
    status: "active",
    useContext: [PH_CONTEXT],
    compose: { include: refs.map((r) => ({ valueSet: [r] })) },
  };
}

const LAB_OID = "2.16.840.1.113762.1.4.1146.1";
const IZ_OID = "2.16.840.1.113762.1.4.1146.2";
const PROVISIONAL_ID = "hantavirus-provisional-codes-PROVISIONAL";

// Mirrors the shape of the eRSD v3 3.2.0 release: umbrellas we type (lrtc,
// iztc), umbrellas we don't (eltc, artc), and an APHL-authored provisional
// value set that has no VSAC counterpart.
const ERSD_BUNDLE: Bundle = {
  resourceType: "Bundle",
  type: "collection",
  entry: [
    { resource: { resourceType: "Library", id: "SpecificationLibrary" } },
    {
      resource: umbrella("lrtc-3.2.0", [
        `http://cts.nlm.nih.gov/fhir/ValueSet/${LAB_OID}|20240619`,
        "http://ersd.aimsplatform.org/fhir/ValueSet/hantavirus-provisional-codes",
      ]),
    },
    {
      resource: umbrella("iztc-3.2.0", [
        `http://cts.nlm.nih.gov/fhir/ValueSet/${IZ_OID}|20240619`,
      ]),
    },
    {
      resource: umbrella("eltc-3.2.0", [
        `http://cts.nlm.nih.gov/fhir/ValueSet/${LAB_OID}|20240619`,
      ]),
    },
    {
      resource: umbrella("artc-3.2.0", [
        `http://cts.nlm.nih.gov/fhir/ValueSet/${LAB_OID}|20240619`,
      ]),
    },
    {
      resource: {
        resourceType: "ValueSet",
        id: `${LAB_OID}-20240619`,
        status: "active",
        useContext: [conditionContext("359761005", "Hantavirus"), PH_CONTEXT],
      },
    },
    {
      resource: {
        resourceType: "ValueSet",
        id: `${IZ_OID}-20240619`,
        status: "active",
        useContext: [conditionContext("409498004", "Anthrax"), PH_CONTEXT],
      },
    },
    {
      resource: {
        resourceType: "ValueSet",
        id: PROVISIONAL_ID,
        status: "active",
        useContext: [conditionContext("359761005", "Hantavirus"), PH_CONTEXT],
      },
    },
  ] as Bundle["entry"],
};

describe("indexErsdResponseByOid", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    mockGetERSD.mockResolvedValue(ERSD_BUNDLE);
    jest.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("only queues OID-identified value sets for VSAC lookup", async () => {
    const { oids } = await indexErsdResponseByOid();

    expect(oids).toEqual([LAB_OID, IZ_OID]);
  });

  it("warns about the value sets it leaves out", async () => {
    await indexErsdResponseByOid();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    const message = warnSpy.mock.calls[0][0] as string;
    expect(message).toContain("eltc-3.2.0");
    expect(message).toContain("artc-3.2.0");
    expect(message).toContain(PROVISIONAL_ID);
    expect(message).not.toContain(LAB_OID);
  });

  it("only links conditions to value sets that will be fetched", async () => {
    const { conditions } = await indexErsdResponseByOid();

    expect(conditions).toEqual([
      {
        code: "359761005",
        system: "http://snomed.info/sct",
        text: "Hantavirus",
        valueset_id: LAB_OID,
      },
      {
        code: "409498004",
        system: "http://snomed.info/sct",
        text: "Anthrax",
        valueset_id: IZ_OID,
      },
    ]);
  });

  it("types immunization value sets so they land in a concept category", async () => {
    const { oidToErsdType } = await indexErsdResponseByOid();

    expect(oidToErsdType.get(LAB_OID)).toBe("lrtc");
    expect(oidToErsdType.get(IZ_OID)).toBe("iztc");
  });
});
