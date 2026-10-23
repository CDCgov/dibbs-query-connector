import { isFhirResource } from "./constants";

describe("isFhirResource", () => {
  it("accepts an object with a resourceType field", () => {
    expect(isFhirResource({ resourceType: "Patient" })).toBe(true);
  });

  it("rejects null and undefined", () => {
    expect(isFhirResource(null)).toBe(false);
    expect(isFhirResource(undefined)).toBe(false);
  });

  it("rejects primitives", () => {
    expect(isFhirResource("Patient")).toBe(false);
    expect(isFhirResource(42)).toBe(false);
  });

  it("rejects an object without a resourceType field", () => {
    expect(isFhirResource({ id: "123" })).toBe(false);
  });
});
