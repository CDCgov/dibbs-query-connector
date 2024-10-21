import { InternalValueSet } from "@/app/constants";
import ExampleVsacValueSet from "../assets/VSACValueSet.json";
import { translateVSACToInternalValueSet } from "../../database-service";
import { ValueSet } from "fhir/r4";

const EXPECTED_INTERNAL_VALUESET: InternalValueSet = {
  valueset_id: ExampleVsacValueSet.id,
  valueset_version: ExampleVsacValueSet.version,
  valueset_name: ExampleVsacValueSet.title,
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
  it("translate to expected fixture", () => {
    const translationResult = translateVSACToInternalValueSet(
      ExampleVsacValueSet as ValueSet,
      "ostc",
    );

    expect(translationResult).toEqual(EXPECTED_INTERNAL_VALUESET);
  });
});
