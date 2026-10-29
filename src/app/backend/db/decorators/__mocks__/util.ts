export const transaction = jest.fn().mockImplementation(
  <T extends { success: boolean; error?: string }>(
    _: Object,
    _key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>,
  ) => descriptor,
);

const actualDecorators = jest.requireActual("../util");

// export the actual version of this one so that the underlying database reads have the right shape
export const camelCaseDbColumnNames = actualDecorators.camelCaseDbColumnNames;
