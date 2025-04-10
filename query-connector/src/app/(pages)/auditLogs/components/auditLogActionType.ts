type AuditLogFormatter = (logEntry: Record<string, unknown>) => string;

type RequestPayload = {
  query_name?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

type ActionTypeMapping = {
  label: string;
  format: AuditLogFormatter;
};

function parseRequest(log: Record<string, unknown>): RequestPayload {
  const raw = log?.auditMessage as { request?: unknown };

  if (!raw?.request) return {};
  if (typeof raw.request === "string") {
    try {
      return JSON.parse(raw.request as string) as RequestPayload;
    } catch {
      return {};
    }
  }
  return raw.request as RequestPayload;
}

export const actionTypeMap: Record<string, ActionTypeMapping> = {
  patientRecordsQuery: {
    label: "Patient Records Query",
    format: (log) => {
      const request = parseRequest(log);
      return `Viewed patient record for ${request.query_name ?? "unknown"} query`;
    },
  },
  patientDiscoveryQuery: {
    label: "Patient Discovery Query",
    format: (log) => {
      const request = parseRequest(log);
      const fullName =
        `${request.first_name ?? ""} ${request.last_name ?? ""}`.trim();
      return `Ran patient discovery query for ${fullName}`;
    },
  },
  // Add more as needed
};

export const labelToActionType = Object.entries(actionTypeMap).reduce(
  (acc, [actionType, config]) => {
    acc[config.label] = actionType;
    return acc;
  },
  {} as Record<string, string>,
);
