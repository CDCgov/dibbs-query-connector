// State to hold active test rules
let mockAccessAllowed = {
  auth: true,
  admin: true,
  super: true,
};

module.exports = {
  __setMockAccessAllowed: (
    allowed: {
      auth: boolean;
      admin: boolean;
      super: boolean;
    } = { auth: true, admin: true, super: true },
  ) => {
    mockAccessAllowed = allowed;
  },

  authenticationRequired: jest.fn().mockImplementation(() => {
    return (
      _target: unknown,
      _propertyKey: string,
      descriptor: PropertyDescriptor,
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: unknown[]) {
        if (!mockAccessAllowed.auth) {
          throw new Error("Unauthorized");
        }
        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }),

  adminRequired: jest.fn().mockImplementation(() => {
    return (
      _target: unknown,
      _propertyKey: string,
      descriptor: PropertyDescriptor,
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: unknown[]) {
        if (!mockAccessAllowed.admin) {
          throw new Error("Admin access required");
        }
        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }),

  superAdminRequired: jest.fn().mockImplementation(() => {
    return (
      _target: unknown,
      _propertyKey: string,
      descriptor: PropertyDescriptor,
    ) => {
      const originalMethod = descriptor.value;

      descriptor.value = function (...args: unknown[]) {
        if (!mockAccessAllowed.super) {
          throw new Error("Super admin access required");
        }
        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }),
};
