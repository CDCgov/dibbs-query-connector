import {
  translateSnakeStringToCamelCase,
  translateNestedObjectKeysIntoCamelCase,
} from "./util";

describe("translateSnakeStringToCamelCase", () => {
  it("camel-cases a snake_case string", () => {
    expect(translateSnakeStringToCamelCase("last_connection_attempt")).toBe(
      "lastConnectionAttempt",
    );
  });

  it("applies the valueset -> valueSet special case", () => {
    expect(translateSnakeStringToCamelCase("valueset_id")).toBe("valueSetId");
  });

  it("leaves an already-camel/plain string untouched", () => {
    expect(translateSnakeStringToCamelCase("name")).toBe("name");
  });
});

describe("translateNestedObjectKeysIntoCamelCase", () => {
  it("camel-cases top-level keys", () => {
    expect(
      translateNestedObjectKeysIntoCamelCase({
        first_name: "a",
        last_name: "b",
      }),
    ).toEqual({ firstName: "a", lastName: "b" });
  });

  it("recurses into nested objects", () => {
    expect(
      translateNestedObjectKeysIntoCamelCase({
        outer_key: { inner_key: 1 },
      }),
    ).toEqual({ outerKey: { innerKey: 1 } });
  });

  it("camel-cases the keys of a top-level array of objects", () => {
    expect(
      translateNestedObjectKeysIntoCamelCase([
        { item_id: 1 },
        { item_id: 2 },
      ] as unknown as object),
    ).toEqual([{ itemId: 1 }, { itemId: 2 }]);
  });

  it("leaves an array held as an object value untouched (only its key is camel-cased)", () => {
    // The entry loop only recurses into plain objects, not arrays held as values.
    expect(
      translateNestedObjectKeysIntoCamelCase({
        list_items: [{ item_id: 1 }],
      }),
    ).toEqual({ listItems: [{ item_id: 1 }] });
  });

  it("camel-cases keys inside embedded JSON strings", () => {
    const result = translateNestedObjectKeysIntoCamelCase({
      config_blob: JSON.stringify({ nested_key: "v" }),
    }) as Record<string, string>;
    expect(JSON.parse(result.configBlob)).toEqual({ nestedKey: "v" });
  });

  it("passes non-JSON strings through unchanged", () => {
    expect(
      translateNestedObjectKeysIntoCamelCase({ plain_text: "just a string" }),
    ).toEqual({ plainText: "just a string" });
  });

  it("returns primitives unchanged", () => {
    expect(translateNestedObjectKeysIntoCamelCase(5 as unknown as object)).toBe(
      5,
    );
    expect(
      translateNestedObjectKeysIntoCamelCase(null as unknown as object),
    ).toBeNull();
  });

  it("does not infinitely recurse on a circular reference", () => {
    const circular: Record<string, unknown> = { some_key: 1 };
    circular.self_ref = circular;
    const result = translateNestedObjectKeysIntoCamelCase(circular) as Record<
      string,
      unknown
    >;
    expect(result.someKey).toBe(1);
    // the circular branch is returned as-is rather than re-processed
    expect(result.selfRef).toBe(circular);
  });
});
