import { Bundle } from "fhir/r4";
import ersdMock from "./fixtures/ersdFixtures.json";
import vsacFixtures from "./fixtures/vsacFixtures.json";
import {
  fetchBatchValueSetsFromVsac,
  getOidsFromErsd,
  OidData,
} from "@/app/backend/db-creation/service";

jest.mock("@/app/backend/seeding/service", () => {
  return {
    __esModule: true,
    ...jest.requireActual("@/app/backend/seeding/service"),
    checkDBForData: jest.fn().mockReturnValue(true),
    generateBatchVsacPromises: jest
      .fn()
      .mockResolvedValue(vsacFixtures?.entries),
  };
});

describe("runs the eRSD ingestion flow", () => {
  test("stubs out the eRSD response", async () => {
    jest.spyOn(global, "fetch").mockResolvedValueOnce({
      json: () => Promise.resolve(ersdMock as Bundle),
      ok: true, // Simulate a successful response
      status: 200,
    });

    const ersdResponse = await getOidsFromErsd();
    const vsacResponse = await fetchBatchValueSetsFromVsac(
      ersdResponse as OidData,
    );

    console.log(vsacResponse);
  });
});
