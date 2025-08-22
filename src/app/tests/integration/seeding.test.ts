import ersdMock from "./fixtures/ersdFixtures.json";
import vsacFixtures from "./fixtures/vsacFixtures.json";

jest.mock("@/app/backend/seeding/service", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/seeding/service"),
    checkDBForData: jest.fn().mockReturnValue(false),
    generateBatchVsacPromises: jest.fn().mockResolvedValue(vsacFixtures),
    getERSD: jest.fn().mockResolvedValue(ersdMock),
  };
});

describe("runs the eRSD ingestion flow", () => {
  test("stubs out the eRSD response", async () => {});
});
