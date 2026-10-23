import { resetAuthMockState } from "@/app/backend/db/decorators/__mocks__/auth";
import { resetFhirMockState } from "@/app/backend/fhir-servers/__mocks__/fhir-client";

export const resetMocksToDefault = () => {
  // fhir client mocks
  resetFhirMockState();

  // auth mocks
  resetAuthMockState;
};
