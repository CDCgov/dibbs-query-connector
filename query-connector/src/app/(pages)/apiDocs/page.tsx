import { getApiDocs } from "../../swaggerSetup";
import ReactSwagger from "./components";

/**
 * @returns The React page
 */
export default async function Index() {
  const spec = await getApiDocs();

  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}
