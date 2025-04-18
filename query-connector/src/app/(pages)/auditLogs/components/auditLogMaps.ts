import { getAllUsers } from "@/app/backend/user-management";

type AuditLogActionTypeFormatter = (
  logEntry: Record<string, unknown>,
) => string;

type RequestPayload = {
  query_name?: string;
  first_name?: string;
  last_name?: string;
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
      dequoted[key] = val.replace(/^"(.*)"$/, "$1");
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
  return full !== "" ? full : (fallback ?? "");
}

/**
 * Maps action types to their labels and formats.
 */
export const auditLogActionTypeMap: Record<string, auditLogActionTypeMapping> =
  {
    patientRecordsQuery: {
      label: "Patient Records Query",
      format: (log) => {
        const request = parseRequest(log);
        return `Viewed patient record for ${request.query_name ?? ""} query`.trim();
      },
    },
    patientDiscoveryQuery: {
      label: "Patient Discovery Query",
      format: (log) => {
        const request = parseRequest(log);
        const fullName = resolveFullName(
          request.first_name,
          request.last_name,
          log.author as string,
        );
        return `Ran patient discovery query for ${fullName}`;
      },
    },
    deleteFhirServer: {
      label: "Delete FHIR Server",
      format: (log) => {
        const request = parseRequest(log);
        return `Deleted FHIR server ${request.name ?? ""}`.trim();
      },
    },
    insertFhirServer: {
      label: "Insert FHIR Server",
      format: (log) => {
        const request = parseRequest(log);
        return `Inserted FHIR server ${request.name ?? ""}`.trim();
      },
    },
    updateFhirServer: {
      label: "Update FHIR Server",
      format: (log) => {
        const request = parseRequest(log);
        return `Updated FHIR server ${request.name ?? ""}`.trim();
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
        user.first_name,
        user.last_name,
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
