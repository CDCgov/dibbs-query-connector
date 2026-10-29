import {
  adminAccessCheck,
  authenticatedAccessCheck,
  superAdminAccessCheck,
} from "@/app/utils/auth";
import { UNAUTHORIZED_LITERAL } from "@/app/constants";

/**
 * Annotation to protect a super admin method
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - An error if the method isn't allowed, the result if it is
 */
export function superAdminRequired(
  _: Object,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]) {
    const methodAllowed = await superAdminAccessCheck();
    if (!methodAllowed) {
      throw Error(`Super admin permission check for ${key} failed`);
    }

    const result = method && (await method.apply(this, args));
    return result;
  };

  return descriptor;
}

/**
 * Annotation to protect a super admin method
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - An error if the method isn't allowed, the result if it is
 */
export function adminRequired(
  _: Object,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]) {
    const methodAllowed = await adminAccessCheck();
    if (!methodAllowed) {
      throw Error(`Admin permission check for ${key} failed`, {
        cause: UNAUTHORIZED_LITERAL,
      });
    }

    const result = method && (await method.apply(this, args));
    return result;
  };

  return descriptor;
}

/**
 * Annotation to protect a method that any signed-in user may call. Every
 * export of a "use server" module is reachable by direct POST, so actions
 * without a role requirement still need this.
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - An error if there is no signed-in user, the result if there is
 */
export function authenticationRequired(
  _: Object,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]) {
    const methodAllowed = await authenticatedAccessCheck();
    if (!methodAllowed) {
      throw Error(`Authentication check for ${key} failed`, {
        cause: UNAUTHORIZED_LITERAL,
      });
    }

    const result = method && (await method.apply(this, args));
    return result;
  };

  return descriptor;
}
