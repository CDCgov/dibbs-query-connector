type Lengthwise = {
  length: number;
};

function isLengthwise(thing: unknown): thing is Lengthwise {
  return typeof thing === "object" && thing !== null && "length" in thing;
}

/**
 * Helper function to not display tables in results view where there are no
 * elements in a column to display. Allows for non-lengthwise properties
 * @param array - an array of items to display in a table
 * @param propertyToCheck - the property that we want to conditionally display
 * in a table column if some element exists
 * @returns true or false for whether there is any element that exists for the
 * column to be rendered
 */
export function checkIfSomeElementWithPropertyExists<T, K extends keyof T>(
  array: T[],
  propertyToCheck: K
): boolean {
  return array
    .map((e) => e[propertyToCheck])
    .some((prop) => {
      return prop != undefined && isLengthwise(prop) ? prop.length > 0 : true;
    });
}
