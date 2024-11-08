"use client";
import React, { useState } from "react";

import { Fieldset, Icon, Label, TextInput } from "@trussworks/react-uswds";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./signinPage.module.scss";
import classNames from "classnames";

/**
 * The sign-in page for Query Connector.
 * @returns The SigninPage component.
 */
export default function SigninPage() {
  const router = useRouter();

  type Credentials = {
    username: string;
    password: string;
  };

  const [signinError, setSigninError] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<Credentials>({
    username: "",
    password: "",
  });

  const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
    event.preventDefault();

    const attribute = event.currentTarget.getAttribute("name") || "";
    const value = event.currentTarget.value;

    // clear error state when entering input text
    if (signinError && value != "") {
      setSigninError(false);
    }

    if (attribute != "") {
      setCredentials({ ...credentials, [attribute]: value });
    }
  };

  const handleSignin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (credentials.username == "" || credentials.password == "") {
      setSigninError(true);
      return;
    } else {
      setSigninError(false);
    }
    router.push(`/query`);
  };

  return (
    <div className={classNames("display-flex", styles.signInContainer)}>
      <div className={`${styles[`column-left`]} ${styles.column}`}>
        <Image
          alt="Graphic illustrating what TEFCA is"
          className={styles.image}
          src="/query-connector/tefca-graphic.svg"
          width={474}
          height={438}
          priority
        />
      </div>
      <div className={styles.column}>
        <div className={styles.card}>
          <form
            className={styles.formContainer}
            onSubmit={handleSignin}
            action=""
            method=""
          >
            <div className={styles.formContent}>
              <div className={styles.formHeader}>
                <h3>Sign in to Query Connector</h3>
                <p>
                  This workspace allows you to sign in with your organizational
                  account.
                </p>
              </div>
              <Fieldset className={styles.formFields}>
                <div className={styles.formInputGroup}>
                  <Label htmlFor="Username" className="margin-top-0-important">
                    Username
                  </Label>
                  <TextInput
                    id="Username"
                    name="username"
                    type="text"
                    className={
                      signinError
                        ? `${styles.formError}`
                        : `${styles.formInput}`
                    }
                    onChange={(event) => {
                      handleInput(event);
                    }}
                  />
                </div>
                <div className={styles.formInputGroup}>
                  <Label htmlFor="Password" className="margin-top-0-important">
                    Password
                  </Label>
                  <TextInput
                    id="Password"
                    name="password"
                    type="password"
                    className={
                      signinError
                        ? `${styles.formError}`
                        : `${styles.formInput}`
                    }
                    onChange={(event) => {
                      handleInput(event);
                    }}
                  />
                </div>
              </Fieldset>
            </div>
            <button
              className={`usa-button ${styles[`signin-button`]}`}
              type="submit"
            >
              Sign in
            </button>
          </form>
          <div
            className={
              signinError ? `${styles.inlineError}` : `${styles.hidden}`
            }
          >
            <Icon.Info
              className="usa-icon qc-info"
              size={3}
              color="#E41D3D"
              aria-label="Information icon indicating a form error"
              aria-hidden={!signinError}
            />
            <p>You have entered an invalid username and/or password</p>
          </div>
        </div>
      </div>
    </div>
  );
}
