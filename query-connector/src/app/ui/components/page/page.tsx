"use client";
import { useEffect, useContext } from "react";
import { ToastContainer, ToastPosition } from "react-toastify";
import { usePathname } from "next/navigation";
import { DataContext } from "@/app/shared/DataProvider";
import SiteAlert from "../../designSystem/SiteAlert";
import "react-toastify/dist/ReactToastify.css";

export type PageProps = {
  children: React.ReactNode;
  showSiteAlert: boolean;
};

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

  // sets the current path/page in context accessible throughout the app;
  // primarily used by SiteAlert component so it can determine which content to display
  useEffect(() => {
    ctx?.setCurrentPage(path);
  }, [path]);

  return (
    <>
      {showSiteAlert && <SiteAlert page={ctx?.currentPage} />}
      <ToastContainer
        position={toastDefault.position}
        stacked={toastDefault.stacked}
        hideProgressBar={toastDefault.hideProgressBar}
      />
      <div>
        {ctx?.currentPage}
        {children}
      </div>
    </>
  );
};

export default Page;
