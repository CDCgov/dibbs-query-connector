import "./ui/styles/styles.scss";
import "react-toastify/dist/ReactToastify.css";
import Header from "./ui/components/header/header";
import Footer from "./ui/components/footer/footer";
import DataProvider from "./shared/DataProvider";
import { Metadata } from "next";
import Page from "./ui/components/page/page";
import { auth } from "@/auth";
import SessionTimeout, {
  IDLE_TIMEOUT_MSEC,
  PROMPT_TIMEOUT_MSEC,
} from "./ui/components/sessionTimeout/sessionTimeout";

/**
 * Establishes the layout for the application.
 * @param props - Props for the component.
 * @param props.children - The children to render.
 * @returns - The root layout component.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initializes user session on server side for the first load
  // if session does not exists then session object remains null
  const session = await auth();

  const runtimeConfig = {
    AUTH_DISABLED: process.env.AUTH_DISABLED || "false",
  };

  return (
    <html lang="en">
      <body>
        <main className="application-container">
          <DataProvider runtimeConfig={runtimeConfig} session={session}>
            <SessionTimeout
              idleTimeMsec={IDLE_TIMEOUT_MSEC}
              promptTimeMsec={PROMPT_TIMEOUT_MSEC}
            />
            <Header session={session} />
            <Page showSiteAlert={process.env.DEMO_MODE === "true"}>
              {children}
            </Page>
            <Footer />
          </DataProvider>
        </main>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "Query Connector",
  description: "Data collection made easier",
};
