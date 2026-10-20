const actual = jest.requireActual("../decorator");

export const auditDecoratorSpy = jest.fn().mockImplementation(
  (...args: unknown[]) =>
    (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) =>
      descriptor,
);

module.exports = {
  ...actual,
  auditable: auditDecoratorSpy,

  // Import the spy if it needs to be consumed in a test
  auditDecoratorSpy,
};
