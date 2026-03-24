/**
 * Smart matching score (0–100).
 * Used to rank swipe feed candidates.
 *
 * Weights:
 *  - Shared interests : 40 pts
 *  - Age compatibility : 30 pts
 *  - Distance          : 30 pts
 */

/**
 * @param {Object} myProfile     – the current user's Profile doc
 * @param {Object} candidateProfile – a candidate's Profile doc
 * @returns {number} score 0–100
 */
const computeMatchScore = (myProfile, candidateProfile) => {
  let score = 0;

  // ── Shared interests (up to 40 pts) ──────────────────────────
  const mine   = new Set((myProfile.interests  || []).map(i => i.toLowerCase()));
  const theirs = new Set((candidateProfile.interests || []).map(i => i.toLowerCase()));
  const shared = [...mine].filter(i => theirs.has(i)).length;
  const maxInterests = Math.max(mine.size, 1);
  score += Math.min(40, Math.round((shared / maxInterests) * 40));

  // ── Age compatibility (up to 30 pts) ──────────────────────────
  if (myProfile.age && candidateProfile.age) {
    const ageDiff = Math.abs(myProfile.age - candidateProfile.age);
    // Full 30 pts if within 3 years, linear decay to 0 at 20 years
    const agePts = Math.max(0, 30 - Math.round((ageDiff / 20) * 30));
    score += agePts;
  }

  // ── Distance (up to 30 pts) — requires 2dsphere coords ────────
  if (
    myProfile.location?.coordinates &&
    candidateProfile.location?.coordinates
  ) {
    const distKm = haversineKm(
      myProfile.location.coordinates,
      candidateProfile.location.coordinates,
    );
    // Full 30 pts within 5 km, 0 pts at 200 km+
    const distPts = Math.max(0, 30 - Math.round((distKm / 200) * 30));
    score += distPts;
  }

  return Math.min(100, score);
};

/** Haversine distance in km between two [lng, lat] pairs */
const haversineKm = ([lng1, lat1], [lng2, lat2]) => {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const toRad = (deg) => (deg * Math.PI) / 180;

module.exports = { computeMatchScore, haversineKm };
