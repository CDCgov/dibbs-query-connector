import { DibbsValueSet } from "@/app/models/entities/valuesets";
import ExampleVsacValueSet from "../../tests/assets/VSACValueSet.json";
import { ValueSet as FhirValueSet } from "fhir/r4";
import { translateVSACToInternalValueSet } from "./utils";

const EXPECTED_INTERNAL_VALUESET: DibbsValueSet = {
  valueSetId: `${ExampleVsacValueSet.id}_${ExampleVsacValueSet.version}`,
  valueSetVersion: ExampleVsacValueSet.version,
  valueSetName: ExampleVsacValueSet.title,
  valueSetExternalId: ExampleVsacValueSet.id,
  author: ExampleVsacValueSet.publisher,
  system: ExampleVsacValueSet.compose.include[0].system,
  ersdConceptType: "ostc",
  dibbsConceptType: "labs",
  includeValueSet: false,
  userCreated: false,
  concepts: ExampleVsacValueSet.compose.include[0].concept.map((c) => {
    return { ...c, include: false };
  }),
};

describe("VSAC FHIR response to internal application type", () => {
  it("translate to expected fixture", () => {
    const translationResult = translateVSACToInternalValueSet(
      ExampleVsacValueSet as FhirValueSet,
      "ostc",
    );

    expect(translationResult).toEqual(EXPECTED_INTERNAL_VALUESET);
  });
});
