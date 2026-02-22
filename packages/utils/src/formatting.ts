export const getInitials = (name: string): string => {
  if (!name.trim()) {
    return "";
  }

  const nameParts = name.trim().split(/\s+/);
  const initials = nameParts.map((part) => part[0].toUpperCase()).slice(0, 2);
  return initials.join("");
};

export const toTitleCase = (value: string | null | undefined): string => {
  if (!value) return "";

  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const toKeyCase = (value: string | null | undefined): string => {
  if (!value) return "";

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const fromKeyCase = (value: string | null | undefined): string => {
  if (!value) return "";

  return value
    .trim()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
