import { DEFAULT_ERSD_VERSION, ValueSet } from "@/app/constants";
import ExampleVsacValueSet from "../assets/VSACValueSet.json";
import { translateVSACToInternalValueSet } from "../../database-service";
import { ValueSet as FhirValueSet } from "fhir/r4";

const EXPECTED_INTERNAL_VALUESET: ValueSet = {
  valueSetId: ExampleVsacValueSet.id,
  valueSetVersion: DEFAULT_ERSD_VERSION,
  valueSetName: ExampleVsacValueSet.title,
  author: ExampleVsacValueSet.publisher,
  system: ExampleVsacValueSet.compose.include[0].system,
  ersdConceptType: "ostc",
  dibbsConceptType: "labs",
  includeValueSet: false,
  concepts: ExampleVsacValueSet.compose.include[0].concept.map((c) => {
    return { ...c, include: false };
  }),
};

describe("VSAC FHIR response to internal application type", () => {
  it("translate to expected fixture", async () => {
    const translationResult = await translateVSACToInternalValueSet(
      ExampleVsacValueSet as FhirValueSet,
      "ostc",
    );

    expect(translationResult).toEqual(EXPECTED_INTERNAL_VALUESET);
  });
});
