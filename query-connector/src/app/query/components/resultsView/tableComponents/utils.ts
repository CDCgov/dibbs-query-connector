type LengthWise = {
  length: number;
};

/**
 * Helper function to not display tables in results view where there are no
 * elements in a column to display
 * @param array - an array of items to display in a table
 * @param propertyToCheck - the property that we want to conditionally display
 * in a table column if some element exists
 * @returns true or false for whether there is any element that exists for the
 * column to be rendered
 */
export function checkIfSomeElementWithLengthPropertyExists<
  T extends Partial<Record<K, LengthWise | undefined>>,
  K extends keyof T,
>(array: T[], propertyToCheck: K): boolean {
  return array
    .map((e) => e[propertyToCheck])
    .some((prop) => prop != undefined && prop.length > 0);
}

/**
 * Helper function to not display tables in results view where there are no
 * elements in a column to display
 * @param array - an array of items to display in a table
 * @param propertyToCheck - the property that we want to conditionally display
 * in a table column if some element exists
 * @returns true or false for whether there is any element that exists for the
 * column to be rendered
 */
export function checkIfSomeElementWithPropertyExists<T, K extends keyof T>(
  array: T[],
  propertyToCheck: K,
): boolean {
  return array.map((e) => e[propertyToCheck]).some((prop) => prop != undefined);
}
