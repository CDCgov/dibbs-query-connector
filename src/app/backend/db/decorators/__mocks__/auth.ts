// State to hold active test rules
let mockAccessAllowed = {
  auth: true,
  admin: true,
  super: true,
};

export const setMockAccessAllowed = (
  allowed: {
    auth: boolean;
    admin: boolean;
    super: boolean;
  } = { auth: true, admin: true, super: true },
) => {
  mockAccessAllowed = allowed;
};

export const resetAuthMockState = () => {
  setMockAccessAllowed({
    auth: true,
    admin: true,
    super: true,
  });
  jest.clearAllMocks();
};

export const authenticationRequired = jest.fn().mockImplementation(() => {
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
});

export const adminRequired = jest.fn().mockImplementation(() => {
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
});

export const superAdminRequired = jest.fn().mockImplementation(() => {
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
});
