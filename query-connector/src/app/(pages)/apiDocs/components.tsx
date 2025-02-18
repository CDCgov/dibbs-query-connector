"use client";

import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

type Props = {
  spec: object;
};

/**
 * React UI skeleton for Swagger docs
 * @param root0 - params
 * @param root0.spec - the spec to specify what components are valid for the
 * Swagger UI
 * @returns A rendered Swagger page
 */
function ReactSwagger({ spec }: Props) {
  return <SwaggerUI spec={spec} />;
}

export default ReactSwagger;
