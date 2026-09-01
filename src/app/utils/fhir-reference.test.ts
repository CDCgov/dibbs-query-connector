import { referencedResourceId } from "./fhir-reference";

describe("referencedResourceId", () => {
  it("extracts the id from a relative reference of the requested type", () => {
    expect(referencedResourceId("Observation/abc", "Observation")).toBe("abc");
    expect(
      referencedResourceId("Observation/abc/_history/2", "Observation"),
    ).toBe("abc");
    expect(
      referencedResourceId(
        "Observation/eSoe91dRn5pTDcXUNbFuFBShhuDnd0MX5qxiuhLTw3-I3",
        "Observation",
      ),
    ).toBe("eSoe91dRn5pTDcXUNbFuFBShhuDnd0MX5qxiuhLTw3-I3");
  });

  it("rejects references that can't safely be read from the same server", () => {
    // Absolute URLs and urn: references carry a scheme.
    expect(
      referencedResourceId(
        "https://other.example.com/fhir/Observation/abc",
        "Observation",
      ),
    ).toBeUndefined();
    expect(
      referencedResourceId("urn:uuid:1234", "Observation"),
    ).toBeUndefined();
    // Contained resources resolve locally, not via a read.
    expect(referencedResourceId("#local", "Observation")).toBeUndefined();
  });

  it("rejects references to another type, bare ids, and missing references", () => {
    expect(
      referencedResourceId("Medication/abc", "Observation"),
    ).toBeUndefined();
    expect(referencedResourceId("abc", "Observation")).toBeUndefined();
    expect(referencedResourceId("", "Observation")).toBeUndefined();
    expect(referencedResourceId(undefined, "Observation")).toBeUndefined();
  });
});
