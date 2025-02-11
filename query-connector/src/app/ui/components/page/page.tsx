"use client";
import { useEffect, useContext } from "react";
import { ToastContainer, ToastPosition } from "react-toastify";
import { usePathname } from "next/navigation";
import { DataContext } from "@/app/shared/DataProvider";
import SiteAlert from "../../designSystem/SiteAlert";
import "react-toastify/dist/ReactToastify.css";
import "react-toastify/dist/ReactToastify.min.css";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
export type PageProps = {
  children: React.ReactNode;
  showSiteAlert: boolean;
};
import styles from "./page.module.scss";

export type ToastConfig = {
  position?: ToastPosition;
  stacked?: boolean;
  hideProgressBar?: boolean;
};

const toastDefault: ToastConfig = {
  position: "bottom-left",
  stacked: true,
  hideProgressBar: true,
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
      <ToastContainer
        position={toastDefault.position}
        stacked={toastDefault.stacked}
        hideProgressBar={toastDefault.hideProgressBar}
      />
      <div>
        <ProgressBar
          height="12px"
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
