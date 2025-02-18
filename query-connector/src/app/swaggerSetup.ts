import { createSwaggerSpec } from "next-swagger-doc";

/**
 * Helper function to get the docs
 * @returns The API docs
 */
export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: `src/app/api`,
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Query Connector API",
        version: "1.0",
      },
      components: {
        // TODO: THIS NEEDS TO BE SET UP BEFORE WE SHIP ANYTHING. OTHERWISE
        // TODO: YOU'LL BE ABLE TO GET ACCESS TO THE DB WITHOUT AUTH
        // securitySchemes: {
        //   BearerAuth: {
        //     type: "http",
        //     scheme: "bearer",
        //     bearerFormat: "JWT",
        //   },
        // },
      },
      security: [],
    },
  });
  return spec;
};
