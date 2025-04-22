"use server";

import { auth } from "@/auth";
import LandingPage from "./(pages)/landingPage/landingPage";
import { isAuthDisabledServerCheck } from "./utils/auth";
/**
 * The default landing page for the TEFCA Viewer.
 * @returns The RootPage component.
 */
export default async function RootPage() {
  const session = await auth();
  const isAuthDisabled = isAuthDisabledServerCheck();
  const isLoggedIn = session !== null || isAuthDisabled;

  return (
    <>
      <LandingPage isLoggedIn={isLoggedIn} />
    </>
  );
}
