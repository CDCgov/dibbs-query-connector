"use client";
import { useEffect, useContext } from "react";
import { ToastContainer } from "react-toastify";
import { usePathname } from "next/navigation";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { DataContext } from "@/app/shared/DataProvider";
import SiteAlert from "../../designSystem/SiteAlert";
import { ToastConfigOptions } from "../../designSystem/toast/Toast";

export type PageProps = {
  children: React.ReactNode;
  showSiteAlert: boolean;
};
import styles from "./page.module.scss";

const toastDefault: ToastConfigOptions = {
  position: "bottom-left",
  stacked: false,
  hideProgressBar: false,
  icon: false,
};

/**
 * A wrapper component that makes certain styles, configs, and components available to all
 * pages in the app.
 * @param root0 - params
 * @param root0.children - The unique component(s) that render the page's content
 * @param root0.showSiteAlert - Whether to show the demo-mode PII disclaimer banner
 * @returns A Page wrapper component
 */
const Page: React.FC<PageProps> = ({ children, showSiteAlert }) => {
  const ctx = useContext(DataContext);
  const path = usePathname();

  // sets the current path/page in context accessible throughout the app
  useEffect(() => {
    ctx?.setCurrentPage(path);
  }, [path]);

  const templateString = `<div class="bar ${
    showSiteAlert ? styles.progressBar__alert : styles.progressBar
  }"role="bar"></div>`;
  return (
    <>
      {showSiteAlert && <SiteAlert page={ctx?.currentPage} />}
      <div className={styles.pageContainer}>
        <ToastContainer
          position={toastDefault.position}
          stacked={toastDefault.stacked}
          hideProgressBar={toastDefault.hideProgressBar}
          icon={false}
        />
        <ProgressBar
          height="8px"
          color="#005EA2"
          options={{
            easing: "ease-in-out",
            showSpinner: false,
            template: templateString,
          }}
          startPosition={0.15}
          shouldCompareComplexProps={true}
          disableSameURL={true}
        />
        {children}
      </div>
    </>
  );
};

export default Page;
