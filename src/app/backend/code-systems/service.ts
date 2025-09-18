"use server";
import { Bundle, OperationOutcome, Parameters, ValueSet } from "fhir/r4";
import {
  ersdToDibbsConceptMap,
  MISSING_API_KEY_LITERAL,
} from "../../constants";
import { encode } from "base-64";
import { indexErsdByOid } from "../db-creation/lib";
import {} from "../db-creation/service";

export type ErsdOrVsacResponse = Bundle | Parameters | OperationOutcome;

type ersdCondition = {
  code: string;
  system: string;
  text: string;
  valueset_id: string;
};

export type OidData = {
  oids: Array<string>;
  oidToErsdType: Map<string, string>;
  conditions: Array<ersdCondition>;
};

/**
 * Performs eRSD querying and parsing to generate OIDs and extract clinical
 * concepts from the eRSD. First, a call is made to the eRSD, which is filtered
 * for valuesets. These valusets are used to create a mapping between OID and
 * clinical service code, as well as to actually compile the list of OIDs of all
 * valuesets in the pull-down. Then, these two entities are bundled together
 * as a data structure for future scripting.
 * @returns An OidData object containing the OIDs extracted as well as the
 * clinical service type associated with each.
 */
export async function getOidsFromErsd() {
  console.log("Fetching and parsing eRSD.");
  const ersd = await getERSD();
  const valuesets = (ersd as unknown as Bundle)["entry"]?.filter(
    (e) => e.resource?.resourceType === "ValueSet",
  );

  const { nonUmbrellaValueSets, oidToErsdType } = indexErsdByOid(valuesets);
  // Build up a mapping of OIDs to eRSD clinical types

  let conditionExtractor: Array<ersdCondition> = [];
  nonUmbrellaValueSets.reduce((acc: Array<ersdCondition>, vs: ValueSet) => {
    const conditionSchemes = vs.useContext?.filter(
      (context) =>
        !(context.valueCodeableConcept?.coding || [])[0].system?.includes(
          "us-ph-usage-context",
        ),
    );
    (conditionSchemes || []).forEach((usc) => {
      const ersdCond: ersdCondition = {
        code: (usc.valueCodeableConcept?.coding || [])[0].code || "",
        system: (usc.valueCodeableConcept?.coding || [])[0].system || "",
        text: usc.valueCodeableConcept?.text || "",
        valueset_id: vs.id || "",
      };
      conditionExtractor.push(ersdCond);
    });
    return conditionExtractor;
  }, conditionExtractor);

  // Make sure to take out the umbrella value sets from the ones we try to insert
  let oids = valuesets?.map((vs) => vs.resource?.id);
  oids = oids?.filter(
    (oid) => !Object.keys(ersdToDibbsConceptMap).includes(oid || ""),
  );
  return {
    oids: oids,
    oidToErsdType: oidToErsdType,
    conditions: conditionExtractor,
  } as OidData;
}

/**
 * Fetches the eRSD Specification from the eRSD API. This function requires an API key
 * to access the eRSD API. The API key can be obtained at https://ersd.aimsplatform.org/#/api-keys.
 * @param eRSDVersion - The version of the eRSD specification to retrieve. Defaults to v2.
 * @returns The eRSD Specification as a FHIR Bundle or an OperationOutcome if an error occurs.
 */
export async function getERSD(
  eRSDVersion: number = 3,
): Promise<ErsdOrVsacResponse> {
  const ERSD_API_KEY = process.env.ERSD_API_KEY;
  if (!ERSD_API_KEY) {
    throw Error(
      `ERSD API Key not set. Please refer to the documentation below to get your ERSD key to continue`,
      {
        cause: MISSING_API_KEY_LITERAL,
      },
    );
  }

  const eRSDUrl = `https://ersd.aimsplatform.org/api/ersd/v${eRSDVersion}specification?format=json&api-key=${ERSD_API_KEY}`;
  const response = await fetch(eRSDUrl);

  if (response.status === 200) {
    const data = (await response.json()) as Bundle;

    return data;
  } else {
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          diagnostics: `Failed to retrieve data from eRSD: ${response.status} ${response.statusText}`,
        },
      ],
    } as OperationOutcome;
  }
}

/**
 * Fetches the VSAC Value Sets and supporting code systems information for a given OID
 * as a FHIR bundle. This function requires a UMLS API Key which must be obtained as a
 * Metathesaurus License. See https://www.nlm.nih.gov/vsac/support/usingvsac/vsacfhirapi.html
 * for authentication instructions.
 * @param oid The OID whose value sets to retrieve.
 * @param searchStructType Optionally, a flag to identify what type of
 * search to perform, since VSAC can be used for value sets as well as conditions.
 * @param codeSystem Optional parameter for use with condition querying.
 * @returns The value sets as a FHIR bundle, or an Operation Outcome if there is an error.
 */
export async function getVSACValueSet(
  oid: string,
  searchStructType: string = "valueset",
  codeSystem?: string,
): Promise<ErsdOrVsacResponse> {
  const username: string = "apikey";
  const umlsKey = process.env.UMLS_API_KEY;

  if (!umlsKey) {
    throw Error(
      "UMLS API Key not set. Please refer to the documentation below on how to get your UMLS API key before continuing",
      {
        cause: MISSING_API_KEY_LITERAL,
      },
    );
  }

  const vsacUrl: string =
    searchStructType === "valueset"
      ? `https://cts.nlm.nih.gov/fhir/ValueSet/${oid}`
      : `https://cts.nlm.nih.gov/fhir/CodeSystem/$lookup?system=${codeSystem}&code=${oid}`;
  const response = await fetch(vsacUrl, {
    method: "get",
    headers: new Headers({
      Authorization: "Basic " + encode(username + ":" + umlsKey),
      "Content-Type": "application/fhir+json",
    }),
  });
  if (response.status === 200) {
    const data = (await response.json()) as Bundle;
    return data;
  } else {
    const diagnosticIssue = await response.json().then((r) => {
      try {
        return r?.issue[0]?.diagnostics;
      } catch {
        return r;
      }
    });
    return {
      resourceType: "OperationOutcome",
      issue: [
        {
          severity: "error",
          code: "processing",
          diagnostics: `${response.status}: ${diagnosticIssue}`,
        },
      ],
    } as OperationOutcome;
  }
}

/**
 * helper function to generate VSAC promises
 *
 * @param oidsToFetch - OIDs from the eRSD to query from VSAC
 * @returns Promises to resolve that will give you the requested VSAC valuesets
 */
export async function generateBatchVsacPromises(oidsToFetch: string[]) {
  const valueSetPromises = Promise.allSettled(
    oidsToFetch.map(async (oid) => {
      try {
        // First, we'll pull the value set from VSAC and map it to our representation
        const vs = await getVSACValueSet(oid);
        return { vs: vs, oid: oid };
      } catch (e) {
        let message = `Fetch for VSAC value set with oid ${oid} failed`;
        if (e instanceof Error) {
          message = message + ` with error message: ${e.message}`;
        }
        return Promise.reject(new Error(message));
      }
    }),
  );

  return valueSetPromises;
}
