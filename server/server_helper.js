export function hasChanges(existing, changes) {
  return Object.keys(changes).some((key) => {
    return changes[key] !== undefined && existing[key] !== changes[key];
  });
}
