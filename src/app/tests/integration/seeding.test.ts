import { internal_getDbClient } from "@/app/backend/db/config";
import ersdMock from "./fixtures/ersdFixtures.json";
import vsacFixtures from "./fixtures/vsacFixtures.json";
import { createDibbsDB } from "@/app/backend/db-creation/service";
import { insertValueSet } from "@/app/backend/seeding/service";

jest.mock("@/app/backend/seeding/service", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/seeding/service"),
    checkDBForData: jest.fn().mockReturnValue(false),
    generateBatchVsacPromises: jest.fn().mockResolvedValue(vsacFixtures),
    getERSD: jest.fn().mockResolvedValue(ersdMock),
    // assume that the database interface functions do a simple insert correctly
    insertValueSet: jest.fn(),
    checkValueSetInsertion: jest.fn().mockResolvedValue({
      missingValueSet: false,
      missingConcepts: [] as Array<string>,
      missingMappings: [] as Array<string>,
    }),
  };
});

const ERSD_RESOURCE_LENGTH = ersdMock.entry.length;

describe("runs the eRSD ingestion flow", () => {
  test(
    "stubs out the eRSD response",
    async () => {
      const dbClient = internal_getDbClient();
      const infoSpy = jest.spyOn(console, "info").mockImplementation();
      const errorSpy = jest.spyOn(console, "error").mockImplementation();

      await createDibbsDB();

      expect(insertValueSet).toHaveBeenCalledTimes(ERSD_RESOURCE_LENGTH);
    },
    70 * 1000,
  );
});
