/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */
// __mocks__/next-auth
const NextAuth = jest
  .fn()
  .mockReturnValue({
    handlers: undefined,
    signIn: jest.fn(),
    signOut: jest.fn(),
    auth: jest.fn().mockReturnValue({ user: {} }),
  });

export default NextAuth;
