import { getAllUsers } from "@/app/backend/user-management";
import { Profile, Session } from "next-auth";

type AuditLogActionTypeFormatter = (
  logEntry: Record<string, unknown>,
) => string;

type auditLogActionTypeMapping = {
  label: string;
  format: AuditLogActionTypeFormatter;
};

function parseRequest(log: Record<string, unknown>) {
  const msg = log.auditMessage;
  let raw: unknown;

  if (typeof msg === "object" && msg !== null && "request" in msg) {
    raw = (msg as Record<string, unknown>).request;
  } else {
    raw = msg;
  }

  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return {};
    }
  }

  const dequoted: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw ?? {})) {
    if (typeof val === "string") {
      const trimmed = val.trim();
      try {
        if (
          (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
          (trimmed.startsWith("[") && trimmed.endsWith("]"))
        ) {
          dequoted[key] = JSON.parse(trimmed);
        } else {
          dequoted[key] = val.replace(/^"(.*)"$/, "$1");
        }
      } catch {
        dequoted[key] = val;
      }
    } else {
      dequoted[key] = val;
    }
  }
  return dequoted;
}

function resolveFullName(
  first?: string,
  last?: string,
  fallback?: string,
): string {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full !== "" ? full : fallback ?? "";
}

/**
 * Maps action types to their labels and formats.
 */
export const auditLogActionTypeMap: Record<string, auditLogActionTypeMapping> =
  {
    makePatientRecordsRequest: {
      label: "Patient records query",
      format: (log) => {
        const request = parseRequest(log);
        return `Viewed patient record for ${
          request.queryName ?? ""
        } query`.trim();
      },
    },
    makePatientDiscoveryRequest: {
      label: "Patient discovery query",
      format: (log) => {
        const request = parseRequest(log) as {
          firstName: string;
          lastName: string;
        };
        const fullName = resolveFullName(
          request.firstName,
          request.lastName,
          log.author as string,
        );
        return `Ran patient discovery query for ${fullName}`;
      },
    },
    deleteFhirServer: {
      label: "Delete FHIR server",
      format: (log) => {
        const request = parseRequest(log) as {
          name: string;
        };
        return `Deleted FHIR server ${request.name ?? ""}`.trim();
      },
    },
    insertFhirServer: {
      label: "Insert FHIR server",
      format: (log) => {
        const request = parseRequest(log) as {
          name: string;
        };
        return `Inserted FHIR server ${request.name ?? ""}`.trim();
      },
    },
    updateFhirServer: {
      label: "Update FHIR server",
      format: (log) => {
        const request = parseRequest(log) as {
          name: string;
        };
        return `Updated FHIR server ${request.name ?? ""}`.trim();
      },
    },
    insertValueSet: {
      label: "Insert value set",
      format: (log) => {
        const request = parseRequest(log) as {
          valueSetName: string;
          valueSetId: string;
        };
        return `Inserted value set ${
          request.valueSetName ?? request.valueSetId ?? ""
        }`.trim();
      },
    },
    executeCategoryUpdates: {
      label: "Execute category updates",
      format: () => {
        return `Executed category updates`;
      },
    },
    insertDBStructArray: {
      label: "Insert database table structure array",
      format: (log) => {
        const request = parseRequest(log);
        const table = request.undefined ?? "unknown";
        const length =
          Object.values(request).find((v) => Array.isArray(v))?.length ?? 0;
        return `Inserted ${length} database rows for ${table} table`;
      },
    },
    auditableSignOut: {
      label: "User sign out",
      format: (log) => {
        type SignOutJsonBlob = {
          sessionParams: {
            session: Session;
          };
        };

        const request = parseRequest(log) as SignOutJsonBlob;
        const userId = request?.sessionParams.session?.user?.id;
        return `Sign out of user with ID ${userId}`;
      },
    },
    auditableSignIn: {
      label: "User sign in",
      format: (log) => {
        const request = parseRequest(log) as { profile: Profile };
        const username = request?.profile?.preferredUsername;
        return `Sign in of user with username ${username}`;
      },
    },
    addUserIfNotExists: {
      label: "User configured",
      format: (log) => {
        const request = parseRequest(log);
        const username = (Object.values(request)[0] as { username: string })
          ?.username;
        return `User configured with username ${username}`;
      },
    },
    updateUserDetails: {
      label: "User details updated",
      format: (log) => {
        const request = parseRequest(log);
        const userId = Object.values(request)[0];
        return `User details updated for user with ID ${userId}`;
      },
    },
    updateUserRole: {
      label: "User role updated",
      format: (log) => {
        const request = parseRequest(log);
        const userId = Object.values(request)[0];
        const newRole = Object.values(request)[1];
        return `User role of user with userId ${userId} updated to new role ${newRole}`;
      },
    },
    createUserGroup: {
      label: "User group created",
      format: (log) => {
        const request = parseRequest(log);
        const groupName = Object.values(request)[0];
        return `Group created with name ${groupName}`;
      },
    },
    updateUserGroup: {
      label: "User group updated",
      format: (log) => {
        const request = parseRequest(log) as Profile;
        const id = Object.values(request)[0];
        const newName = Object.values(request)[1];
        return `Group with ID ${id} updated with new name ${newName}`;
      },
    },
    deleteUserGroup: {
      label: "User group deleted",
      format: (log) => {
        const request = parseRequest(log);
        const id = Object.values(request)[0];
        return `Group with ID ${id} deleted`;
      },
    },
    addUsersToGroup: {
      label: "Users added to user group",
      format: (log) => {
        const request = parseRequest(log);
        const groupId = Object.values(request)[0];
        const userId = (Object.values(request)[1] as string[]).join(", ");
        return `User with ID ${userId} added to group with ID ${groupId} `;
      },
    },
    removeUsersFromGroup: {
      label: "Users removed from user group",
      format: (log) => {
        const request = parseRequest(log);
        const groupId = Object.values(request)[0];
        const userId = Object.values(request)[1];
        return `User with ID ${userId} removed to group with ID ${groupId} `;
      },
    },
    addQueriesToGroup: {
      label: "Queries added to user group",
      format: (log) => {
        const request = parseRequest(log);
        const groupId = Object.values(request)[0];
        const queryId = Object.values(request)[1];
        return `Query with ID ${queryId} added to group ${groupId}`;
      },
    },
    removeQueriesFromGroup: {
      label: "Queries removed from user group",
      format: (log) => {
        const request = parseRequest(log);
        const groupId = Object.values(request)[0];
        const queryId = Object.values(request)[1];
        return `Query with ID ${queryId} removed from group ${groupId}`;
      },
    },
    deleteQueryById: {
      label: "Deleted query",
      format: (log) => {
        const request = parseRequest(log);
        const queryId = Object.values(request)[0];
        return `Query with ID ${queryId} deleted`;
      },
    },
    saveCustomQuery: {
      label: "Added a new query",
      format: (log) => {
        const request = parseRequest(log);
        const queryName = Object.values(request)[1];
        const queryId = Object.values(request)[3];
        const message = queryId
          ? `Query with name ${queryName} and id ${queryId} saved`
          : `Query with name ${queryName} saved`;

        return message;
      },
    },
    // Add more as needed
  };

export const labelToActionType = Object.entries(auditLogActionTypeMap).reduce(
  (acc, [actionType, config]) => {
    acc[config.label] = actionType;
    return acc;
  },
  {} as Record<string, string>,
);

let usernameToFullNameMap: Record<string, string> = {};

/**
 * Initializes the username to full name map for audit logs.
 * This function fetches all users and creates a mapping of usernames to their full names.
 */
export async function initializeAuditLogUserMap() {
  const response = await getAllUsers();
  usernameToFullNameMap = response.items.reduce(
    (acc, user) => {
      acc[user.username] = resolveFullName(
        user.firstName,
        user.lastName,
        user.username,
      );
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Retrieves the full name for a given username.
 * If the username is not found in the map, it returns the username itself.
 * @param username - The username to look up.
 * @returns The full name associated with the username, or the username itself if not found.
 */
export function auditLogUserMap(username: string): string {
  return usernameToFullNameMap[username] || username;
}
