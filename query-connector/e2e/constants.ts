import { hyperUnluckyPatient } from "@/app/shared/constants";

export const TEST_PATIENT = hyperUnluckyPatient;
export const TEST_PATIENT_NAME =
  hyperUnluckyPatient.FirstName + " A. " + hyperUnluckyPatient.LastName;
export const showSiteAlert = process.env.DEMO_MODE;
