export const auditable = jest
  .fn()
  .mockImplementation(
    () =>
      (
        _target: unknown,
        _propertyKey: string,
        descriptor: PropertyDescriptor,
      ) => {
        return descriptor;
      },
  );
