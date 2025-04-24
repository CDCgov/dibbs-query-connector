const lib = jest.requireActual("tabbable");

const tabbable = {
  ...lib,
  /**
   *
   * @param node - node
   * @param options - options
   * @returns - Array
   */
  tabbable: (node, options) =>
    lib.tabbable(node, { ...options, displayCheck: "none" }),
  /**
   *
   * @param node - node
   * @param options - options
   * @returns - Array
   */
  focusable: (node, options) =>
    lib.focusable(node, { ...options, displayCheck: "none" }),
  /**
   *
   * @param node - node
   * @param options - options
   * @returns - Array
   */
  isFocusable: (node, options) =>
    lib.isFocusable(node, { ...options, displayCheck: "none" }),
  /**
   *
   * @param node - node
   * @param options - options
   * @returns - Array
   */
  isTabbable: (node, options) =>
    lib.isTabbable(node, { ...options, displayCheck: "none" }),
};

module.exports = tabbable;
