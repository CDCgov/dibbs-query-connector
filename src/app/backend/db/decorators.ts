import { adminAccessCheck, superAdminAccessCheck } from "@/app/utils/auth";
import { internal_getDbClient } from "./config";
import { QueryResult } from "pg";
import { translateNestedObjectKeysIntoCamelCase } from "./util";
import { UNAUTHORIZED_LITERAL } from "@/app/constants";

/**
 * Annotation to make a db query into a transaction. Requires all return branches
 * to include {success: boolean}, which will control the rollback behavior,
 * in order to compile
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - Success information of the db transaction, as well as additional
 * error / db result types as specified in the function body
 */
export function transaction<T extends { success: boolean }>(
  _: Object,
  key: string,
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>,
) {
  const method = descriptor.value;
  const dbClient = internal_getDbClient();

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]): Promise<T> {
    try {
      await dbClient.query("BEGIN");
      const result = method && (await method.apply(this, args));
      if (result === undefined || result.success === false) {
        throw Error("Transaction failed");
      }
      await dbClient.query("COMMIT");

      return result;
    } catch (error) {
      await dbClient.query("ROLLBACK");
      console.error(`Database transaction ${key} failed`);

      type ErrorResult<T extends { success: boolean }> = T & {
        error?: string;
      };

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as ErrorResult<T>;
    }
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
 * Annotation that camelCases any column_names coming back from DB reads
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - objects from the database with the column names camel cased
 */
export function camelCaseDbColumnNames<T extends Record<string, unknown>>(
  _: Object,
  key: string,
  descriptor: TypedPropertyDescriptor<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (...args: any[]) => Promise<QueryResult<any>>
  >,
) {
  const method = descriptor.value;

  descriptor.value = async function (
    ...args: unknown[]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<QueryResult<any>> {
    try {
      const result = method && (await method.apply(this, args));

      if (result === undefined || result?.rows === undefined) {
        throw Error(
          "Database read in camel casing formatting function returned undefined",
        );
      }

      result.rows = result.rows.map((v) => {
        const val = translateNestedObjectKeysIntoCamelCase(v as object);
        return val as T;
      });

      return result;
    } catch (error) {
      console.error(error);

      return {
        command: "",
        rowCount: 0,
        oid: 0,
        rows: [] as T[],
        fields: [],
      };
    }
  };

  return descriptor;
}
