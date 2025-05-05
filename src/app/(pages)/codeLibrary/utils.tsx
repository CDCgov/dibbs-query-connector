/**
 * Helper method to extract the source system display name from the url string.
 * Similar to DBServive.stripProtocolAndTLDFromSystemUrl, but builds in specific
 * checks for known string outliers
 * @param system the url string to format
 * @returns the display name of the system, stripped of url prefixes
 */
export const formatSystem = (system: string) => {
  const match = system.match(/https?:\/\/([^\.]+)/);
  let result = match?.[1];

  switch (result) {
    case "hl7":
      const hl7Arr = system.split("/");
      result = hl7Arr[hl7Arr.length - 1];
      if (result == "icd-10-cm") {
        result = result.slice(0, result.indexOf("-cm"));
      }
      return result.toLocaleUpperCase();

    case "www":
      const rxArr = system.split("/");
      return rxArr[rxArr?.length - 1].toLocaleUpperCase();

    default:
      return result?.toUpperCase();
  }
};
