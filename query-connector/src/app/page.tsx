import LandingPage from "./(pages)/landingPage/landingPage";
import { isAuthDisabledServerCheck } from "@/app/utils/auth";

/**
 * The default landing page for the TEFCA Viewer.
 * @returns The RootPage component.
 */
export default function RootPage() {
  return <LandingPage authDisabled={isAuthDisabledServerCheck()} />;
}
