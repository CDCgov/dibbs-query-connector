/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */
// __mocks__/tabbable.js

const lib = jest.requireActual("tabbable");

const tabbable = {
  ...lib,
  /**
   *
   * @param node
   * @param options
   */
  tabbable: (node, options) =>
    lib.tabbable(node, { ...options, displayCheck: "none" }),
  /**
   *
   * @param node
   * @param options
   */
  focusable: (node, options) =>
    lib.focusable(node, { ...options, displayCheck: "none" }),
  /**
   *
   * @param node
   * @param options
   */
  isFocusable: (node, options) =>
    lib.isFocusable(node, { ...options, displayCheck: "none" }),
  /**
   *
   * @param node
   * @param options
   */
  isTabbable: (node, options) =>
    lib.isTabbable(node, { ...options, displayCheck: "none" }),
};

module.exports = tabbable;
