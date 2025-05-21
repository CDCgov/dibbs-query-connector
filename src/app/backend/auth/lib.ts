import { Account, Profile } from "next-auth";
import { UserToken } from "../user-management";
import { JWT } from "@auth/core/jwt";
import { decodeJwt } from "jose";
import { UserRole } from "@/app/models/entities/users";
import { isAuthDisabledServerCheck } from "@/app/utils/auth";

export interface AuthStrategy {
  parseIdpResponseForUserToken(account: Account, profile: Profile): UserToken;
}

const ROLE_TO_ENUM_MAP: Record<string, UserRole> = {
  standard: UserRole.STANDARD,
  "super-admin": UserRole.SUPER_ADMIN,
  admin: UserRole.ADMIN,
};

export class AuthContext {
  private authStrategy: AuthStrategy;

  constructor(authStrategy: AuthStrategy) {
    this.authStrategy = authStrategy;
  }

  public setStrategy(authStrategy: AuthStrategy) {
    this.authStrategy = authStrategy;
  }

  public extendTokenWithExpirationTime(token: JWT) {
    const now = Math.floor(Date.now() / 1000);

    if (token.exp) {
      token.expiresIn = token.exp - now;
    }

    // handle expired tokens
    if (token.expiresIn && token.expiresIn <= 0) {
      return null;
    }

    return token;
  }

  public extendTokenWithUserInfo(token: JWT, userToken: UserToken) {
    if (isAuthDisabledServerCheck()) {
      token.role = UserRole.SUPER_ADMIN;
    } else if (token.role) {
      token.role = userToken.role;
    }
    token = { ...token, ...userToken };
    return token;
  }

  public parseIdpResponseForUserToken(
    account: Account,
    profile: Profile,
  ): UserToken {
    return this.authStrategy.parseIdpResponseForUserToken(account, profile);
  }
}

export class KeycloakAuthStrategy implements AuthStrategy {
  public parseIdpResponseForUserToken(account: Account, profile: Profile) {
    let role = UserRole.STANDARD;
    if (account?.access_token) {
      let decodedToken = decodeJwt(account?.access_token);
      const keycloakRoles = (
        decodedToken?.realm_access as { ["roles"]: string[] }
      ).roles;

      console.log(keycloakRoles);

      const validRoles = Object.keys(ROLE_TO_ENUM_MAP);
      let roleFound = false;
      keycloakRoles.forEach((r) => {
        if (validRoles.includes(r)) {
          role = ROLE_TO_ENUM_MAP[r];
          roleFound = true;
        }
      });

      if (!roleFound) {
        console.error(
          "No role found in Keycloak assignments. Falling back to standard access",
        );
      }
    } else {
      console.error(
        "No ID token found in Keycloak response. Falling back to standard access",
      );
    }

    const userToken = {
      id: profile.sub || "",
      username: profile.preferred_username || profile.email || "",
      email: profile.email || "",
      firstName: profile.given_name || "",
      lastName: profile.family_name || "",
      role: role,
    };
    return userToken;
  }
}

export class MicrosoftEntraAuthStrategy implements AuthStrategy {
  public parseIdpResponseForUserToken(account: Account, profile: Profile) {
    const azureRoles = profile?.roles as string[];
    const userInfo = decodeJwt(account?.id_token as string);
    let role = ROLE_TO_ENUM_MAP[azureRoles[0]];

    const fullName = userInfo.name as string;
    const firstName = userInfo?.given_name ?? fullName.split(" ")[0];
    const lastName =
      userInfo?.last_name ?? fullName.split(" ").slice(1).join(" ");

    console.log("account");
    console.log(account);

    console.log("user info");
    console.log(userInfo);

    console.log("profile");
    console.log(profile);

    const userToken = {
      id: profile.oid as string,
      username: profile?.preferred_username as string,
      firstName: firstName as string,
      lastName: lastName as string,
      role: role,
    };

    console.log(userToken);

    return userToken;
  }
}
