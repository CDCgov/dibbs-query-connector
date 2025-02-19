import { ApiReference } from "@scalar/nextjs-api-reference";
import content from "./openapi.json";

const config = {
  spec: {
    content: content,
  },
};
export const GET = ApiReference(config);
