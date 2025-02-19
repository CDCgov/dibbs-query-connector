/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */
// __mocks__/next-auth/react.js
const useSession = jest.fn().mockReturnValue({ data: undefined });

/**
 *
 * @param root0
 * @param root0.children
 */
const SessionProvider = ({ children }) => <>{children}</>;

export { useSession, SessionProvider };
