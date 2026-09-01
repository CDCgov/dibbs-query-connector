/**
 * Extracts the logical id from a relative FHIR reference of the given type.
 *
 * Only scheme-less, relative references resolve: "Observation/abc" and
 * "Observation/abc/_history/2" both yield "abc". Contained references (#id),
 * references with a scheme (absolute URLs, urn:uuid:, urn:oid:), references to
 * a different resource type, and bare ids all yield undefined. A caller that
 * turns the id into a read request against the same server can therefore trust
 * that the id belongs to that server and that resource type.
 * @param reference - the Reference.reference string, if any
 * @param resourceType - the FHIR resource type the reference must point at
 * @returns the referenced resource's id, or undefined when it can't be
 * determined safely
 */
export function referencedResourceId(
  reference: string | undefined,
  resourceType: string,
): string | undefined {
  if (!reference || reference.startsWith("#") || reference.includes(":")) {
    return undefined;
  }
  const match = reference.match(new RegExp(`(?:^|/)${resourceType}/([^/?#]+)`));
  return match?.[1];
}
