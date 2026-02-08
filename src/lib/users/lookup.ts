export type UserLookup = Map<string, string>;

type UserLookupSource = {
  email: string;
  firstName: string;
  lastName: string;
  alternativeNames?: string | null;
};

const normalizeName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, " ").trim();

const splitAltNames = (altNames?: string | null) =>
  altNames
    ? altNames
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean)
    : [];

export const buildUserLookup = (users: UserLookupSource[]): UserLookup => {
  const lookup: UserLookup = new Map();
  for (const user of users) {
    const fullName = `${user.firstName} ${user.lastName}`;
    const names = [fullName, ...splitAltNames(user.alternativeNames)];
    for (const name of names) {
      const key = normalizeName(name);
      if (!key) continue;
      if (!lookup.has(key)) {
        lookup.set(key, user.email);
      }
    }
  }
  return lookup;
};

export const findUserEmailForName = (
  name: string | null,
  lookup: UserLookup,
) => {
  if (!name) return null;
  return lookup.get(normalizeName(name)) ?? null;
};
