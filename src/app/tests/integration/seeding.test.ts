import ersdMock from "./fixtures/ersdFixtures.json";
import vsacFixtures from "./fixtures/vsacFixtures.json";
import { createDibbsDB } from "@/app/backend/db-creation/service";
import { ValueSet } from "fhir/r4";
import { suppressConsoleLogs } from "./fixtures";
import { insertValueSet } from "@/app/backend/db-creation/lib";

jest.mock("@/app/backend/code-systems/service", () => {
  const actual = jest.requireActual("@/app/backend/code-systems/service");

  return {
    __esModule: true,
    ...actual,
    getERSD: jest.fn().mockImplementation(() => ersdMock),
    getVSACValueSet: jest.fn().mockImplementation((oid: string) => {
      const vs = (vsacFixtures as ValueSet[]).find((v) => v.id === oid);
      return Promise.resolve(vs);
    }),
  };
});

jest.mock("@/app/backend/db-creation/lib", () => {
  const actual = jest.requireActual("@/app/backend/db-creation/lib");

  return {
    __esModule: true,
    ...actual,
    checkDBForData: jest.fn().mockResolvedValue(false),
    // put the passthrough into the mock implementation so we can spy
    insertValueSet: jest.fn().mockImplementation(actual.insertValueSet),
    // skip the checking process since we're using partial mocks
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

const TWENTY_SECONDS_IN_MILLI = 20 * 1000;
describe("runs the eRSD ingestion flow", () => {
  beforeAll(() => {
    suppressConsoleLogs();
  });
  test(
    "Inserts the number of valuesets we'd expect from the eRSD fixtures",
    async () => {
      const insertSpy = insertValueSet;
      await createDibbsDB();

      expect(insertSpy).toHaveBeenCalledTimes(
        ERSD_FIXTURE_RESOURCE_LENGTH - VSAC_FIXTURE_RETIRED_IDS.length,
      );
    },
    TWENTY_SECONDS_IN_MILLI,
  );
});
