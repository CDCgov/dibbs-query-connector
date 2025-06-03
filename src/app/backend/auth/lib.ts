import { Account, Profile } from "next-auth";
import { UserToken } from "../user-management";
import { JWT } from "@auth/core/jwt";
import { decodeJwt } from "jose";
import { UserRole } from "@/app/models/entities/users";
import { isAuthDisabledServerCheck } from "@/app/utils/auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { Provider } from "@auth/core/providers";

export interface AuthStrategy {
  parseIdpResponseForUserToken(
    token: JWT,
    account: Account,
    profile: Profile,
  ): UserToken;
  setUpNextAuthProvider(): Provider;
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
      token.role = userToken.qcRole;
    }
    token = { ...token, ...userToken };
    return token;
  }

  public parseIdpResponseForUserToken(
    token: JWT,
    account: Account,
    profile: Profile,
  ): UserToken {
    return this.authStrategy.parseIdpResponseForUserToken(
      token,
      account,
      profile,
    );
  }
}

const CLIENT_ID_NAME = process.env.AUTH_CLIENT_ID as string;
export class KeycloakAuthStrategy implements AuthStrategy {
  public parseIdpResponseForUserToken(
    token: JWT,
    account: Account,
    profile: Profile,
  ) {
    let role: UserRole = UserRole.STANDARD;

    if (account?.access_token) {
      let decodedToken = decodeJwt(account?.access_token);

      const keycloakRoles = decodedToken?.resource_access as {
        [CLIENT_ID_NAME]: {
          ["roles"]: string[];
        };
      };
      const userRoles = keycloakRoles && keycloakRoles[CLIENT_ID_NAME]?.roles;

      if (userRoles && userRoles[0] && ROLE_TO_ENUM_MAP[userRoles[0]]) {
        role = ROLE_TO_ENUM_MAP[userRoles[0]];
      } else {
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
      username: profile.preferred_username || "",
      email: profile.email || "",
      firstName: profile.given_name || "",
      lastName: profile.family_name || "",
      qcRole: role,
    };
    return userToken;
  }

  public setUpNextAuthProvider() {
    let { NAMED_KEYCLOAK, LOCAL_KEYCLOAK } = process.env;
    if (!NAMED_KEYCLOAK || !LOCAL_KEYCLOAK) {
      const KEYCLOAK_URL =
        process.env.AUTH_ISSUER || "http://localhost:8080/realms/master";
      NAMED_KEYCLOAK = KEYCLOAK_URL;
      LOCAL_KEYCLOAK = KEYCLOAK_URL;
    }

    return KeycloakProvider({
      jwks_endpoint: `${NAMED_KEYCLOAK}/protocol/openid-connect/certs`,
      wellKnown: undefined,
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      issuer: `${LOCAL_KEYCLOAK}`,
      authorization: {
        params: {
          scope: "openid email profile",
        },
        url: `${LOCAL_KEYCLOAK}/protocol/openid-connect/auth`,
      },
      token: `${NAMED_KEYCLOAK}/protocol/openid-connect/token`,
      userinfo: `${NAMED_KEYCLOAK}/protocol/openid-connect/userinfo`,
    });
  }
}

export class MicrosoftEntraAuthStrategy implements AuthStrategy {
  public parseIdpResponseForUserToken(
    token: JWT,
    account: Account,
    profile: Profile,
  ) {
    const azureRoles = profile?.roles as string[];
    const userInfo = decodeJwt(account?.id_token as string);
    let role = ROLE_TO_ENUM_MAP[azureRoles[0]];

    const fullName = userInfo.name as string;
    const firstName = token.given_name ?? fullName.split(" ")[0];
    const lastName = token.last_name ?? fullName.split(" ").slice(1).join(" ");

    const userToken = {
      id: profile.oid as string,
      username: profile?.preferred_username as string,
      firstName: firstName as string,
      lastName: lastName as string,
      qcRole: role,
    };

    return userToken;
  }

  public setUpNextAuthProvider() {
    return MicrosoftEntraID({
      clientId: process.env.AUTH_CLIENT_ID,
      clientSecret: process.env.AUTH_CLIENT_SECRET,
      issuer: process.env.AUTH_ISSUER,
      authorization: {
        params: {
          scope: "openid email profile",
          claims: {
            id_token: {
              roles: { essential: true },
            },
          },
        },
      },
    });
  }
}
