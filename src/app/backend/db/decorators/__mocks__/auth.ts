/* eslint-disable @typescript-eslint/no-explicit-any */
// State to hold active test rules
type AccessLevel = "auth" | "admin" | "super";
let mockAccessAllowed: Record<AccessLevel, boolean> = {
  auth: true,
  admin: true,
  super: true,
};

/**
 * Helper to set the access level returned by the decorator.
 * 
 * Use this by importing this module using jest.requireMock and then
 * setting the mockAccessAllowed return object before asserting on test output.
 * 
 * ex:
    const mockAuth = jest.requireMock<
    typeof import("@/app/backend/db/decorators/__mocks__/auth")
  >("@/app/backend/db/decorators/auth");  

    mockAuth.setMockAccessAllowed({
      auth: true,
      admin: true,
      super: false,
    });

    await functionThatNeedsAuthLevel() //should run;
    await functionThatNeedsAdminLevel() //should run;
    await functionThatNeedsSuperAdminLevel() //should fail;
 * @param allowed - A map between the access levels and whether they're allowed
    for the mock state until the next auth call.
 */
export const setMockAccessAllowed = (allowed: Record<AccessLevel, boolean>) => {
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
      return mockAccessDetermination(propertyKey, descriptor, "auth");
    },
  );

export const adminRequired = jest
  .fn()
  .mockImplementation(
    (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      return mockAccessDetermination(propertyKey, descriptor, "admin");
    },
  );

export const superAdminRequired = jest
  .fn()
  .mockImplementation(
    (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
      return mockAccessDetermination(propertyKey, descriptor, "super");
    },
  );

function mockAccessDetermination(
  propertyKey: string,
  descriptor: PropertyDescriptor,
  accessLevel: AccessLevel,
) {
  // Capture the original properties regardless of how @auditable modified them
  const originalValue = descriptor.value;
  const originalGet = descriptor.get;
  const originalInitializer = (descriptor as any).initializer;

  // Create our wrapper function
  const mockWrapper = function (this: any, ...args: unknown[]) {
    if (!mockAccessAllowed[accessLevel]) {
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
