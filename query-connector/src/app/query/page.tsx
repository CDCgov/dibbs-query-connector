import React from "react";

import "react-toastify/dist/ReactToastify.min.css";

import { getFhirServerNames } from "../database-service";
import QueryClient from "./queryStepper";

/**
 * Parent component for the query page. Based on the mode, it will display the search
 * form, the results of the query, or the multiple patients view.
 * @returns - The Query component.
 */
const Query: React.FC = async () => {
  const fhirServers = await getFhirServerNames(); //send FHIR server names to the client side, but not the configs
  return <QueryClient fhirServers={fhirServers} />;
};

export default Query;
