import ersdMock from "./fixtures/ersdFixtures.json";
import vsacFixtures from "./fixtures/vsacFixtures.json";
import { createDibbsDB } from "@/app/backend/db-creation/service";
import { insertValueSet } from "@/app/backend/seeding/service";
import { ValueSet } from "fhir/r4";

jest.mock("@/app/backend/seeding/service", () => {
  const actual = jest.requireActual("@/app/backend/seeding/service");

  return {
    __esModule: true,
    ...actual,
    checkDBForData: jest.fn().mockReturnValue(false),
    getERSD: jest.fn().mockResolvedValue(ersdMock),
    getVSACValueSet: jest.fn().mockImplementation((oid: string) => {
      const vs = (vsacFixtures as ValueSet[]).find((v) => v.id === oid);
      return Promise.resolve(vs);
    }),

    // skip the checking process since we're using partial mocks
    insertValueSet: jest.spyOn(actual.SeedingService, "insertValueSet"),
    checkValueSetInsertion: jest.fn().mockResolvedValue({
      missingValueSet: false,
      missingConcepts: [] as Array<string>,
      missingMappings: [] as Array<string>,
    }),
  };
});

const ERSD_FIXTURE_RESOURCE_LENGTH = ersdMock.entry.length;
// valuesets in the fixture that don't have associated concepts / marked as "retired"
const VSAC_FIXTURE_RETIRED_IDS = (vsacFixtures as ValueSet[]).filter((v) => {
  return v?.compose?.include[0]?.concept === undefined;
});

describe("runs the eRSD ingestion flow", () => {
  test(
    "stubs out the eRSD response",
    async () => {
      const infoSpy = jest.spyOn(console, "info").mockImplementation();
      const errorSpy = jest.spyOn(console, "error").mockImplementation();
      const insertSpy = insertValueSet;

      await createDibbsDB();

      expect(insertSpy).toHaveBeenCalledTimes(
        ERSD_FIXTURE_RESOURCE_LENGTH - VSAC_FIXTURE_RETIRED_IDS.length,
      );
    },
    70 * 1000,
  );
});
