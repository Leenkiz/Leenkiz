// The member "session" for v1 is just her phone number kept on the device
// (decision: phone + name only, no passwords).
const PHONE_KEY = 'gr_member_phone';

export function getMemberPhone() {
  return localStorage.getItem(PHONE_KEY);
}

export function setMemberPhone(phone) {
  if (phone) localStorage.setItem(PHONE_KEY, phone);
  else localStorage.removeItem(PHONE_KEY);
}
