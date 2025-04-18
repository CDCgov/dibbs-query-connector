"use client";

import {
  ProcessList,
  ProcessListItem,
  ProcessListHeading,
} from "@trussworks/react-uswds";
import Link from "next/link";
import Image from "next/image";
import styles from "./landingPage.module.scss";
import { useSession } from "next-auth/react";
import { useRouter } from "next-nprogress-bar";

/**
 * The landing page for the TEFCA Viewer.
 * @returns The LandingPage component.
 */
export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();
  const isLoggedIn = status === "authenticated";
  // Redirect to the query page if the user is logged in
  if (isLoggedIn) {
    router.push("/query");
    return null;
  }
  return (
    <div className="main-body display-flex flex-column flex-justify-center">
      <div className="gradient-blue-background flex-1">
        <div className="container">
          <div className="text-holder">
            <h1 className={styles.pageSubtitle}>Data collection made easier</h1>
            <p className={styles.pageContent}>
              The Query Connector allows your jurisdiction to query a wide
              network of healthcare providers through your existing data use
              agreements, giving you access to more complete and timely data.
            </p>
            <Link
              className="usa-button next-button margin-bottom-2"
              id="next-button"
              href="/query"
            >
              Try it out
            </Link>
          </div>
          <Image
            alt="Graphic illustrating what TEFCA is"
            src="/tefca-graphic.svg"
            width={250}
            height={300}
            priority
          />
        </div>
      </div>
      <div className="home flex-1">
        <h3 className={styles.pageSubtitle} role="heading" aria-level={2}>
          What is it?
        </h3>
        <p className={styles.pageContent}>
          The Query Connector is a data collection tool that uses an intuitive
          querying process to help your staff quickly retrieve patient records
          and relevant case information from a wide range of healthcare
          providers — all without the need for a direct connection. It does this
          by leveraging your jurisdiction's existing data use agreements, like
          the Data Use and Reciprocal Support Agreement (DURSA), while also
          supporting innovative standards for data sharing, like the Trusted
          Exchange Framework and Common Agreement (TEFCA).
        </p>
        <h3 className={styles.pageSubtitle} role="heading" aria-level={2}>
          How does it work?
        </h3>
        <p className={styles.pageContent}>
          Public health staff can interact with the Query Connector manually by
          entering simple patient details — such as name, date of birth, or
          medical identifiers — along with a query, into the web-based portal.
          The Query Connector surfaces patient data relevant to the use case in
          an easily readable format, making data more usable for case
          investigation.
        </p>
        <ProcessList className="padding-top-4">
          <ProcessListItem>
            <ProcessListHeading type="h3">
              Search for a patient
            </ProcessListHeading>
            <p className="margin-top-05 font-sans-xs">
              Based on name, date of birth, and other demographic information
            </p>
          </ProcessListItem>
          <ProcessListItem>
            <ProcessListHeading type="h3">
              View information tied to your case investigation
            </ProcessListHeading>
            <p className="font-sans-xs">
              Easily gather additional patient information tied to your specific
              use case
            </p>
          </ProcessListItem>
        </ProcessList>
      </div>
    </div>
  );
}
