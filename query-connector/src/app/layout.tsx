import "./ui/styles/styles.scss";
import "react-toastify/dist/ReactToastify.css";
import Header from "./ui/components/header/header";
import Footer from "./ui/components/footer/footer";
import { SessionProvider } from "next-auth/react";
import DataProvider from "./shared/DataProvider";
import { Metadata } from "next";
import { ToastContainer } from "react-toastify";

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
          <ToastContainer
            position="bottom-left"
            icon={false}
            stacked
            hideProgressBar
          />
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
