import { nanoid } from "nanoid";

export const customSlug = (input: string) => {
  if (!input) return "";

  const truncatedTitle = input
    .slice(0, 60)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const id = nanoid();

  return `${truncatedTitle}-${id.slice(0, 30)}`;
};
