export const auditable = jest.fn(
  (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) => {
    return descriptor;
  },
);
