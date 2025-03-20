/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */
// __mocks__/next-auth/react.js
const useSession = jest
  .fn()
  .mockReturnValue({ data: undefined, status: "loading" });

const signOut = jest.fn();
/**
 *
 * @param root0
 * @param root0.children
 */
const SessionProvider = ({ children }) => <>{children}</>;

export { useSession, signOut, SessionProvider };
