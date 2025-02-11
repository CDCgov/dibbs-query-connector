import { getApiDocs } from "../../swaggerSetup";
import ReactSwagger from "./components";

export default async function Index() {
  const spec = await getApiDocs();

  return (
    <section className="container">
      <ReactSwagger spec={spec} />
    </section>
  );
}
