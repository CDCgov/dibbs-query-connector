import { getERSD, getVSACValueSet } from "@/app/database-service";
import { Bundle, OperationOutcome } from "fhir/r4";

describe("getERSD", () => {
  it("should retrieve the eRSD for a valid version", async () => {
    const version = 2;
    const response = await getERSD(version);
    expect(response.resourceType).toBe("Bundle");
    const entries = (response as Bundle).entry || [];
    expect(entries[0].fullUrl).toBe(
      "http://ersd.aimsplatform.org/fhir/Library/SpecificationLibrary",
    );
  });

  it("should fail for invalid eRSD versions", async () => {
    const version = 100;
    const response = await getERSD(version);
    expect(response.resourceType).toBe("OperationOutcome");
    const issue = (response as OperationOutcome).issue[0];
    expect(issue).toEqual({
      severity: "error",
      code: "processing",
      diagnostics: "Failed to retrieve data from eRSD: 404 Not Found",
    });
  });
});

describe("getVsacValueSet", () => {
  it("should successfully query for valid value sets", async () => {
    const oidToQuery = "2.16.840.1.113883.11.20.9.46";
    const response = await getVSACValueSet(oidToQuery);
    expect(response.resourceType).toBe("ValueSet");
    expect(response.id).toBe(oidToQuery);
  });

  it("should fail with an operation outcome for an invalid value set", async () => {
    const badOID = "4";
    const response = await getVSACValueSet(badOID);
    expect(response.resourceType).toBe("OperationOutcome");
    const issue = (response as OperationOutcome).issue[0];
    expect(issue).toEqual({
      severity: "error",
      code: "processing",
      diagnostics: "404: HAPI-0971: Resource ValueSet/4 is not known",
    });
  });
});
