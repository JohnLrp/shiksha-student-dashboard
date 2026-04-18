const PUBLIC_KEY = "shiksha_public_profile";
const PRIVATE_KEY = "shiksha_private_details";

export function getPublicProfile() {
  try {
    return JSON.parse(localStorage.getItem(PUBLIC_KEY)) || {};
  } catch {
    return {};
  }
}

export function savePublicProfile(data) {
  const existing = getPublicProfile();
  localStorage.setItem(PUBLIC_KEY, JSON.stringify({ ...existing, ...data }));
}

export function getPrivateDetails() {
  try {
    return JSON.parse(localStorage.getItem(PRIVATE_KEY)) || {};
  } catch {
    return {};
  }
}

export function savePrivateDetails(data) {
  const existing = getPrivateDetails();
  localStorage.setItem(PRIVATE_KEY, JSON.stringify({ ...existing, ...data }));
}
