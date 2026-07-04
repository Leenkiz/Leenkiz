// Club-level payment settings. The MoMo number members send money to comes
// from .env so no real number is committed to git.
export const MEMBERSHIP_MONTHLY_UGX = 75000; // PRD §4.1

export function paymentInfo() {
  return {
    momo_number: process.env.CLUB_MOMO_NUMBER || '0700 000000',
    momo_name: process.env.CLUB_MOMO_NAME || 'Gems & Rackets',
    membership_monthly_ugx: MEMBERSHIP_MONTHLY_UGX,
  };
}

// Local timestamp ("YYYY-MM-DD HH:MM:SS") — the laptop runs on Kampala time,
// so money reports group into the right month.
export function nowLocal() {
  return new Date().toLocaleString('sv-SE');
}
