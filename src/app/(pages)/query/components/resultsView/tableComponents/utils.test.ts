import { checkIfSomeElementWithPropertyExists } from "./utils";

describe("checkIfSomeElementWithPropertyExists", () => {
  it("reports every checked property as false for an empty array", () => {
    expect(
      checkIfSomeElementWithPropertyExists<
        { a?: number; b?: number },
        "a" | "b"
      >([], ["a", "b"]),
    ).toEqual({ a: false, b: false });
  });

  it("flags a property true when at least one element has it", () => {
    const array = [{ a: 1 }, { b: 2 }] as { a?: number; b?: number }[];
    expect(checkIfSomeElementWithPropertyExists(array, ["a", "b"])).toEqual({
      a: true,
      b: true,
    });
  });

  it("keeps a property false when no element has it", () => {
    const array = [{ a: 1 }] as { a?: number; b?: number }[];
    expect(checkIfSomeElementWithPropertyExists(array, ["a", "b"])).toEqual({
      a: true,
      b: false,
    });
  });
});
