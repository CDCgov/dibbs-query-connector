/**
 * Helper function to not display tables in results view where there are no
 * elements in a column to display. Allows for non-lengthwise properties
 * @param array - an array of items to display in a table
 * @param propertiesToCheck - the property that we want to conditionally display
 * in a table column if some element exists
 * @returns true or false for whether there is any element that exists for the
 * column to be rendered
 */
export function checkIfSomeElementWithPropertyExists<
  T extends object,
  K extends keyof T,
>(array: T[], propertiesToCheck: K[]): Record<K, boolean> {
  const result: Record<K, boolean> = propertiesToCheck.reduce(
    (accumulation, p) => {
      accumulation[p] = false;
      return accumulation;
    },
    {} as Record<K, boolean>
  );

  for (const resource of array) {
    for (const property of propertiesToCheck) {
      if (property in resource) {
        result[property] = true;
      }
    }
  }

  return result;
}
