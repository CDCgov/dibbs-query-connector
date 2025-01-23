import "../styles/styles.scss";
import Header from "./designSystem/header/header";
import Footer from "./designSystem/footer/footer";
import { SessionProvider } from "next-auth/react";
import DataProvider from "./DataProvider";
import { Metadata } from "next";

/**
 * Establishes the layout for the application.
 * @param props - Props for the component.
 * @param props.children - The children to render.
 * @returns - The root layout component.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <SessionProvider>
        <body>
          <div className="application-container">
            <Header authDisabled={process.env.AUTH_DISABLED === "true"} />
            <DataProvider>{children}</DataProvider>
            <Footer />
          </div>
        </body>
      </SessionProvider>
    </html>
  );
}

export const metadata: Metadata = {
  title: "Query Connector",
  description: "Data collection made easier",
};
