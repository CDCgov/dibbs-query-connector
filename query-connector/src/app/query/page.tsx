import React from "react";

import "react-toastify/dist/ReactToastify.min.css";

import { getFhirServerNames } from "../database-service";
import QueryClient from "./queryStepper";

/**
 * Server side component for the query page that renders everything in queryStepper as a client component.
 * @returns - The Query component.
 */
const Query: React.FC = async () => {
  const fhirServers = await getFhirServerNames(); //send FHIR server names to the client side, but not the configs
  return <QueryClient fhirServers={fhirServers} />;
};

export default Query;
