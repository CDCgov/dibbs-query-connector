"use client";

import { useEffect, useRef, useState } from "react";
import { Modal, ModalButton } from "../../designSystem/Modal";
import { ModalRef, Button } from "@trussworks/react-uswds";
import styles from "./header.module.css";
import { metadata } from "@/app/constants";
import { useRouter, usePathname } from "next/navigation";
/**
 * Produces the header.
 * @returns The HeaderComponent component.
 */
export default function HeaderComponent() {
  const modalRef = useRef<ModalRef>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const router = useRouter();
  const path = usePathname();

  const handleClick = () => {
    router.push(`/signin`);
  };

  return (
    <>
      <header className="usa-header usa-header--basic bg-primary-darker">
        <div
          className="header-footer-content usa-nav-container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="usa-logo" style={{ marginLeft: "16px" }}>
              <em className="usa-logo__text text-base-lightest">
                <a
                  className="text-base-lightest font-sans-xl text-bold"
                  href={
                    process.env.NODE_ENV === "production"
                      ? "/tefca-viewer"
                      : "/"
                  }
                  title={metadata.title}
                >
                  {metadata.title}
                </a>
              </em>
            </div>
          </div>
          <div
            style={{
              whiteSpace: "nowrap",
              textAlign: "right",
              marginLeft: "auto",
            }}
          >
            {path != "/signin" && isClient && (
              <ModalButton
                modalRef={modalRef}
                title={"Data Usage Policy"}
                className={styles.dataUsagePolicyButton}
              />
            )}
            {/* TODO: Rework show/hide rules based on actual auth status */}
            {path != "/signin" && path != "/query" && (
              <Button
                className={styles.signinButton}
                type="button"
                id="signin-button"
                title={"Sign in button"}
                onClick={() => handleClick()}
              >
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      {isClient && (
        <Modal
          modalRef={modalRef}
          id="data-usage-policy"
          heading="How is my data stored?"
          description="It's not! Data inputted into the TEFCA Query Connector is not persisted or stored anywhere."
        ></Modal>
      )}
    </>
  );
}
