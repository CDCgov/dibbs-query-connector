import { ApiReference } from "@scalar/nextjs-api-reference";
import content from "./openapi.json";

const config = {
  spec: {
    content: content,
  },
  authentication: {
    preferredSecurityScheme: "oauth2",
    securitySchemes: {
      oauth2: {
        flows: {
          clientCredentials: {
            "x-scalar-client-id": "api-docs-test-client",
            clientSecret: "eJOjhpZ2AQ3dSwbmfFpzVzF2S6nU8BuE",
            tokenUrl:
              "https://queryconnector.dev/keycloak/realms/master/protocol/openid-connect/token",
            selectedScopes: ["profile", "email"],
          },
        },
      },
    },
  },
  proxyUrl: "https://proxy.scalar.com",
  theme: "default" as const,
  darkMode: true,
  defaultOpenAllTags: true,
};
export const GET = ApiReference(config);
