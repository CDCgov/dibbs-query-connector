import {
  CodeableConcept,
  FhirResource,
  Medication,
  MedicationAdministration,
  MedicationRequest,
  MedicationStatement,
} from "fhir/r4";
import { QueryResponse } from "@/app/models/entities/query";

/**
 * Client-side medication code filtering for servers whose search API can't
 * filter medications by code (Epic supports only patient/category/status/date
 * parameters on MedicationRequest and MedicationStatement searches, so those
 * queries return every medication in the patient's record).
 *
 * Filtering fails open: a MedicationRequest/MedicationStatement whose
 * medication codes can't be determined (e.g. a medicationReference pointing at
 * a Medication resource the server didn't return because it ignored our
 * _include) is kept rather than dropped, since over-inclusion is safer for
 * case investigation than silently discarding records.
 */

type MedicationOrder = MedicationRequest | MedicationStatement;

/**
 * Builds an id → Medication lookup for resolving medication references.
 * @param medications Medication resources returned with the query
 * @returns the Medications indexed by id
 */
export function buildMedicationIndex(
  medications: Medication[],
): Map<string, Medication> {
  const index = new Map<string, Medication>();
  medications.forEach((medication) => {
    if (medication.id) {
      index.set(medication.id, medication);
    }
  });
  return index;
}

/**
 * Resolves the Medication a request/statement refers to, checking contained
 * resources for local (#id) references and the fetched Medication resources
 * otherwise. Handles relative (Medication/{id}) and absolute URL references.
 * @param resource the medication order to resolve
 * @param medicationIndex fetched Medication resources indexed by id
 * @returns the referenced Medication, or undefined if it can't be resolved
 */
function resolveMedication(
  resource: MedicationOrder,
  medicationIndex: Map<string, Medication>,
): Medication | undefined {
  const reference = resource.medicationReference?.reference;
  if (!reference) return undefined;

  if (reference.startsWith("#")) {
    const localId = reference.slice(1);
    return resource.contained?.find(
      (contained): contained is Medication =>
        (contained as FhirResource).resourceType === "Medication" &&
        contained.id === localId,
    );
  }

  const id = referencedMedicationKey(resource);
  return id ? medicationIndex.get(id) : undefined;
}

/**
 * Determines whether a medication order matches the filter codes, or null when
 * its codes can't be determined at all (unresolvable reference / no coding).
 * @param resource the medication order to check
 * @param codeSet the query's medication codes
 * @param medicationIndex fetched Medication resources indexed by id
 * @returns true/false when a match could be evaluated, null when it couldn't
 */
function medicationOrderMatches(
  resource: MedicationOrder,
  codeSet: Set<string>,
  medicationIndex: Map<string, Medication>,
): boolean | null {
  // The default query path's server-side `code=` filter is also system-less,
  // so matching on bare coding values keeps behavior consistent across paths.
  const inlineCodings = resource.medicationCodeableConcept?.coding;
  if (inlineCodings && inlineCodings.length > 0) {
    return inlineCodings.some(
      (c) => c.code !== undefined && codeSet.has(c.code),
    );
  }

  const medication = resolveMedication(resource, medicationIndex);
  const medicationCodings = medication?.code?.coding;
  if (medicationCodings && medicationCodings.length > 0) {
    return medicationCodings.some(
      (c) => c.code !== undefined && codeSet.has(c.code),
    );
  }

  return null;
}

function conceptHasName(concept: CodeableConcept | undefined): boolean {
  return !!(concept?.text || concept?.coding?.some((c) => c.display));
}

function conceptHasContent(concept: CodeableConcept | undefined): boolean {
  return !!(concept?.text || concept?.coding?.length);
}

/**
 * Resolves the CodeableConcept naming a medication order's drug, for display.
 * Candidates are considered in order — the inline medicationCodeableConcept,
 * the referenced or contained Medication's code, then the reference's display
 * text (Epic populates the drug name there even though its searches don't
 * return the Medication resources) — preferring the first with a
 * human-readable name over one carrying only bare codes.
 * @param order the MedicationRequest or MedicationStatement to name
 * @param medicationIndex Medication resources returned with the query,
 * indexed by id (see buildMedicationIndex)
 * @returns a CodeableConcept for display, or undefined when nothing in the
 * order names the drug
 */
export function resolveMedicationConcept(
  order: MedicationOrder,
  medicationIndex: Map<string, Medication>,
): CodeableConcept | undefined {
  const display = order.medicationReference?.display;
  const candidates = [
    order.medicationCodeableConcept,
    resolveMedication(order, medicationIndex)?.code,
    display ? { text: display } : undefined,
  ];

  return candidates.find(conceptHasName) ?? candidates.find(conceptHasContent);
}

/**
 * Extracts the id of the Medication an order references, for non-contained
 * references. Handles relative (Medication/{id}), absolute-URL, and bare-id
 * reference forms; contained (#id) references return undefined.
 * @param resource the medication order whose reference to parse
 * @returns the referenced Medication id, or undefined when there is none
 */
export function referencedMedicationKey(
  resource: MedicationOrder,
): string | undefined {
  const reference = resource.medicationReference?.reference;
  if (!reference || reference.startsWith("#")) return undefined;
  const idMatch = reference.match(/(?:^|\/)Medication\/([^/?]+)/);
  return idMatch ? idMatch[1] : reference;
}

/**
 * Filters the MedicationRequest and MedicationStatement resources in a query
 * response down to those matching the given medication (RxNorm) codes, and
 * prunes Medication / MedicationAdministration resources that were only
 * present in support of dropped orders. Resources whose medication codes
 * can't be determined are kept (fail open). Resource-type keys whose arrays
 * become empty are removed, matching how absent resource types are
 * represented elsewhere.
 * @param queryResponse parsed query response to filter
 * @param medicationCodes the query's medication codes
 * @returns a new QueryResponse with non-matching medication resources removed
 */
export function filterMedicationResourcesByCode(
  queryResponse: QueryResponse,
  medicationCodes: string[],
): QueryResponse {
  if (medicationCodes.length === 0) return queryResponse;

  const codeSet = new Set(medicationCodes);
  const medicationIndex = buildMedicationIndex(queryResponse.Medication ?? []);

  let unresolvableCount = 0;
  const filterOrders = <T extends MedicationOrder>(orders: T[]): T[] =>
    orders.filter((order) => {
      const matches = medicationOrderMatches(order, codeSet, medicationIndex);
      if (matches === null) {
        unresolvableCount += 1;
        return true;
      }
      return matches;
    });

  const keptRequests = filterOrders(queryResponse.MedicationRequest ?? []);
  const keptStatements = filterOrders(queryResponse.MedicationStatement ?? []);

  if (unresolvableCount > 0) {
    console.warn(
      "Medication code filtering kept %s medication resource(s) whose codes could not be determined (unresolvable or missing medication reference)",
      unresolvableCount,
    );
  }

  // Keep a Medication only when a kept order still references it.
  const referencedMedicationIds = new Set(
    [...keptRequests, ...keptStatements]
      .map(referencedMedicationKey)
      .filter((id): id is string => id !== undefined),
  );
  const keptMedications = (queryResponse.Medication ?? []).filter(
    (medication) =>
      medication.id !== undefined && referencedMedicationIds.has(medication.id),
  );

  // MedicationAdministrations arrive via _revinclude on their request; keep
  // them only when that request was kept. Fail open for any without a
  // resolvable request reference.
  const keptRequestIds = new Set(
    keptRequests
      .map((request) => request.id)
      .filter((id): id is string => id !== undefined),
  );
  const keptAdministrations = (
    queryResponse.MedicationAdministration ?? []
  ).filter((administration: MedicationAdministration) => {
    const requestRef = administration.request?.reference;
    if (!requestRef) return true;
    const idMatch = requestRef.match(/(?:^|\/)MedicationRequest\/([^/?]+)/);
    if (!idMatch) return true;
    return keptRequestIds.has(idMatch[1]);
  });

  const filtered: QueryResponse = { ...queryResponse };
  if (keptRequests.length > 0) filtered.MedicationRequest = keptRequests;
  else delete filtered.MedicationRequest;
  if (keptStatements.length > 0) filtered.MedicationStatement = keptStatements;
  else delete filtered.MedicationStatement;
  if (keptMedications.length > 0) filtered.Medication = keptMedications;
  else delete filtered.Medication;
  if (keptAdministrations.length > 0)
    filtered.MedicationAdministration = keptAdministrations;
  else delete filtered.MedicationAdministration;

  return filtered;
}
