"use client";
import React, { useState } from "react";

import { Fieldset, Label, TextInput } from "@trussworks/react-uswds";

import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./signinPage.module.scss";

/**
 * The sign-in page for Query Connector.
 * @returns The SigninPage component.
 */
export default function SigninPage() {
  const router = useRouter();

  const [_userName, setUserName] = useState<string>("");
  const [_password, setPassword] = useState<string>("");

  const handleSignin = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push(`/query`);
  };

  return (
    <div className="display-flex">
      <div className={`${styles[`column-left`]} ${styles.column}`}>
        <Image
          alt="Graphic illustrating what TEFCA is"
          className={styles.image}
          src="/tefca-viewer/tefca-graphic.svg"
          width={474}
          height={438}
          priority
        />
      </div>
      <div className={styles.column}>
        <div className={styles.card}>
          <form onSubmit={handleSignin} action="" method="">
            <div className={styles.formText}>
              <h3>Sign in to Query Connector</h3>
              <p>
                This workspace allows you to sign in with your organizational
                account.
              </p>
            </div>
            <Fieldset>
              <Label htmlFor="Username" className="margin-top-0-important">
                Username
              </Label>
              <TextInput
                id="Username"
                name="username"
                type="text"
                className={styles.formInput}
                onChange={(event) => {
                  setUserName(event.target.value);
                }}
              />
              <Label htmlFor="Password" className="margin-top-0-important">
                Password
              </Label>
              <TextInput
                id="Password"
                name="password"
                type="password"
                className={styles.formInput}
                onChange={(event) => {
                  setPassword(event.target.value);
                }}
              />
            </Fieldset>
            <button
              className={`usa-button ${styles[`signin-button`]}`}
              type="submit"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
