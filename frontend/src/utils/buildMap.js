export function buildMapEmbedUrl({ lat, lng, venueName, venueAddress, venueCity, venueCountry }) {
  // Prefer lat/lng if both are present & valid
  const hasCoords =
    lat !== "" && lng !== "" && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  if (hasCoords) {
    const q = `${lat},${lng}`;
    // Google Maps embed by coordinates
    return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
  }

  // Otherwise fall back to a composed address
  const parts = [venueName, venueAddress, venueCity, venueCountry]
    .map((s) => (s || "").trim())
    .filter(Boolean);

  if (!parts.length) return "";

  const q = parts.join(", ");
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}