import "../styles/styles.scss";
import Header from "./query/components/header/header";
import Footer from "./query/components/footer/footer";
import { SessionProvider } from "next-auth/react";
import DataProvider from "./DataProvider";

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
            <Header />
            <DataProvider>{children}</DataProvider>
            <Footer />
          </div>
        </body>
      </SessionProvider>
    </html>
  );
}
