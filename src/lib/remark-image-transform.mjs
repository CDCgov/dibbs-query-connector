import { visit } from "unist-util-visit";

/**
 * A remark plugin to transform image URLs in Markdown files.
 * This plugin modifies the URLs of images in Markdown files to be compatible with Next.js.
 * It specifically looks for image URLs that start with "../../public/"
 * and transforms them to start with "/".
 * @returns {function} A function that takes a Markdown AST and modifies it in place.
 */
export const remarkImageTransform = () => {
  return (tree) => {
    visit(tree, "image", (node) => {
      if (node.url.startsWith("../../public/")) {
        // Transform GitHub-compatible path to Next.js path
        node.url = node.url.replace("../../public/", "/");
      }
    });
  };
};
