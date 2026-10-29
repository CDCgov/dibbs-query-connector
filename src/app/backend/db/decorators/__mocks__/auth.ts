/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const authenticationRequired = jest
  .fn()
  .mockImplementation(
    (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      return mockAccessDetermination(
        propertyKey,
        descriptor,
        mockAccessAllowed.auth,
      );
    },
  );

export const adminRequired = jest
  .fn()
  .mockImplementation(
    (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      return mockAccessDetermination(
        propertyKey,
        descriptor,
        mockAccessAllowed.admin,
      );
    },
  );

export const superAdminRequired = jest
  .fn()
  .mockImplementation(
    (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      return mockAccessDetermination(
        propertyKey,
        descriptor,
        mockAccessAllowed.super,
      );
    },
  );

function mockAccessDetermination(
  propertyKey: string,
  descriptor: PropertyDescriptor,
  accessLevel: boolean,
) {
  // Capture the original properties regardless of how @auditable modified them
  const originalValue = descriptor.value;
  const originalGet = descriptor.get;
  const originalInitializer = (descriptor as any).initializer;

  // Create our wrapper function
  const mockWrapper = function (this: any, ...args: unknown[]) {
    if (!accessLevel) {
      throw new Error("Higher access required");
    }

    let methodToCall;
    if (originalValue) {
      methodToCall = originalValue;
    } else if (originalGet) {
      methodToCall = originalGet.call(this);
    } else if (originalInitializer) {
      methodToCall = originalInitializer.call(this);
    }

    if (!methodToCall) {
      throw new Error(
        `Could not resolve original method for ${propertyKey}. Check decorator chain.`,
      );
    }

    return methodToCall.apply(this, args);
  };

  if (originalValue !== undefined) {
    descriptor.value = mockWrapper;
  } else if (originalGet !== undefined) {
    descriptor.get = () => mockWrapper;
  } else if (originalInitializer !== undefined) {
    (descriptor as any).initializer = () => mockWrapper;
  }

  return descriptor;
}
