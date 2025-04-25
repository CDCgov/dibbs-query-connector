import { getAllUsers } from "@/app/backend/user-management";

type AuditLogActionTypeFormatter = (
  logEntry: Record<string, unknown>,
) => string;

type RequestPayload = {
  queryName?: string;
  firstName?: string;
  lastName?: string;
  [key: string]: unknown;
};

type auditLogActionTypeMapping = {
  label: string;
  format: AuditLogActionTypeFormatter;
};

function parseRequest(log: Record<string, unknown>): RequestPayload {
  const msg = log.auditMessage;
  let raw: unknown;

  if (typeof msg === "object" && msg !== null && "request" in msg) {
    raw = (msg as Record<string, unknown>).request;
  } else {
    raw = msg;
  }

  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Object.keys(raw).length === 1
  ) {
    const onlyKey = Object.keys(raw)[0];
    raw = (raw as Record<string, unknown>)[onlyKey];
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
        const request = parseRequest(log);
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
        const request = parseRequest(log);
        return `Deleted FHIR server ${request.name ?? ""}`.trim();
      },
    },
    insertFhirServer: {
      label: "Insert FHIR server",
      format: (log) => {
        const request = parseRequest(log);
        return `Inserted FHIR server ${request.name ?? ""}`.trim();
      },
    },
    updateFhirServer: {
      label: "Update FHIR server",
      format: (log) => {
        const request = parseRequest(log);
        return `Updated FHIR server ${request.name ?? ""}`.trim();
      },
    },
    insertValueSet: {
      label: "Insert value set",
      format: (log) => {
        const request = parseRequest(log);
        return `Inserted value set ${
          request.valueSetName ?? request.valueSetId ?? ""
        }`.trim();
      },
    },
    executeCategoryUpdates: {
      label: "Execute category updates",
      format: (log) => {
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
