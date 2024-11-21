import "../styles/styles.scss";
import Header from "./query/components/header/header";
import Footer from "./query/components/footer/footer";
import { DataProvider } from "./utils";
import { SessionProvider } from "next-auth/react";

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
          <Header />
          <div className="main-body">
            <DataProvider>{children}</DataProvider>
          </div>
          <Footer />
        </body>
      </SessionProvider>
    </html>
  );
}
