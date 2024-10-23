import {
  insertValueSet,
  translateVSACToInternalValueSet,
} from "./database-service";
import ExampleVsacValueSet from "../app/tests/assets/VSACValueSet.json";
import { ValueSet as FhirValueSet } from "fhir/r4";

export async function testInsertion() {
  console.log("starting insertion");
  const translationResult = await translateVSACToInternalValueSet(
    ExampleVsacValueSet as FhirValueSet,
    "ostc",
  );
  console.log("translation done");

  const result = await insertValueSet(translationResult);
  console.log("insertion done");
}
