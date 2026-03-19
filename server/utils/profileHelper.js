export function getProfilePath(userId, profileUuid) {
  if (!profileUuid) return null;
  const partition = Math.ceil(userId / 1000);
  return `storage/profiles/${partition}/${profileUuid}.webp`;
}

export function getPartition(userId) {
  return Math.ceil(userId / 1000);
}
