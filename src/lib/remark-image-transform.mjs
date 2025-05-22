import { visit } from "unist-util-visit";

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
