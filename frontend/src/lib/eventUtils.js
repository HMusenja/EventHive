// src/utils/EventUtils.js

// ─── Small helpers ────────────────────────────────────────────────────────────
export function getInitials(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "SP"
  );
}

export function toISO(dtLocal) {
  return dtLocal ? new Date(dtLocal).toISOString() : null;
}

export function toNumOrNull(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function prune(obj) {
  if (obj == null) return undefined;

  if (Array.isArray(obj)) {
    const arr = obj.map(prune).filter((v) => v !== undefined);
    return arr.length ? arr : undefined;
  }

  if (typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const p = prune(v);
      if (p !== undefined && p !== "") out[k] = p;
    }
    return Object.keys(out).length ? out : undefined;
  }

  return obj;
}

// ─── Shape builders (UI form ⇄ Event schema) ─────────────────────────────────
export function buildSchemaFromForm(fd) {
  const agenda = (fd.agenda || [])
    .map((s) => ({
      title: (s.title || "").trim(),
      description: s.description || "",
      startAt: toISO(s.startDateTime),
      endAt: toISO(s.endDateTime),
      room: s.room || "",
      track: s.track || "",
      speakerNames:
        typeof s.speakerNames === "string"
          ? s.speakerNames
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : Array.isArray(s.speakerNames)
          ? s.speakerNames
          : [],
    }))
    .filter((s) => s.title && s.startAt && s.endAt);

  const speakers = (fd.speakers || [])
    .map((sp) => ({
      name: (sp.name || "").trim(),
      title: sp.title || "",
      company: sp.company || "",
      bio: sp.bio || "",
      avatarUrl: sp.avatarUrl || "",
    }))
    .filter((sp) => sp.name);

  return prune({
    slug: fd.slug || undefined,
    title: fd.title || "",
    subtitle: fd.subtitle || "",
    description: fd.description || "",
    coverImage: fd.coverImage || "",
    onboardingEnabled: !!fd.onboardingEnabled,
    startAt: toISO(fd.startDateTime),
    endAt: toISO(fd.endDateTime),
    timezone: fd.timezone || "Europe/Berlin",
    visibility: fd.visibility || "public",
    capacity: Number(fd.capacity) || 0,

    venue: {
      name: fd.venueName || "",
      address: fd.venueAddress || "",
      city: fd.venueCity || "",
      country: fd.venueCountry || "",
      lat: toNumOrNull(fd.venueLatitude),
      lng: toNumOrNull(fd.venueLongitude),
      mapEmbedUrl: fd.mapEmbedUrl || "",
    },

    organizerProfile: {
      name: fd.organizerName || "",
      website: fd.organizerWebsite || "",
      bio: fd.organizerBio || "",
      avatarUrl: fd.organizerAvatar || "",
      socials: {
        twitter: fd.organizerTwitter || "",
        linkedin: fd.organizerLinkedIn || "",
        github: fd.organizerGitHub || "",
        website: fd.organizerWebsiteUrl || "",
      },
    },

    speakers,
    agenda,
  });
}

export function schemaFromEvent(ev) {
  if (!ev) return {};
  return prune({
    slug: ev.slug,
    title: ev.title,
    subtitle: ev.subtitle,
    description: ev.description,
    coverImage: ev.coverImage,
    onboardingEnabled: !!ev.onboardingEnabled,
    startAt: ev.startAt ? new Date(ev.startAt).toISOString() : null,
    endAt: ev.endAt ? new Date(ev.endAt).toISOString() : null,
    timezone: ev.timezone || "Europe/Berlin",
    visibility: ev.visibility || "public",
    capacity: Number.isFinite(ev.capacity) ? ev.capacity : 0,

    venue: ev.venue
      ? {
          name: ev.venue.name || "",
          address: ev.venue.address || "",
          city: ev.venue.city || "",
          country: ev.venue.country || "",
          lat: ev.venue.lat ?? null,
          lng: ev.venue.lng ?? null,
          mapEmbedUrl: ev.venue.mapEmbedUrl || "",
        }
      : undefined,

    organizerProfile: ev.organizerProfile
      ? {
          name: ev.organizerProfile.name || "",
          website: ev.organizerProfile.website || "",
          bio: ev.organizerProfile.bio || "",
          avatarUrl: ev.organizerProfile.avatarUrl || "",
          socials: {
            twitter: ev.organizerProfile.socials?.twitter || "",
            linkedin: ev.organizerProfile.socials?.linkedin || "",
            github: ev.organizerProfile.socials?.github || "",
            website: ev.organizerProfile.socials?.website || "",
          },
        }
      : undefined,

    speakers: Array.isArray(ev.speakers) ? ev.speakers : [],
    agenda: Array.isArray(ev.agenda) ? ev.agenda : [],
  });
}

// ─── Diff & patch safety ─────────────────────────────────────────────────────
export function deepDiff(a, b) {
  if (a === b) return undefined;
  const isObj = (x) => x && typeof x === "object" && !Array.isArray(x);

  if (Array.isArray(a) || Array.isArray(b)) {
    const aArr = Array.isArray(a) ? a : [];
    const bArr = Array.isArray(b) ? b : [];
    const sameLen = aArr.length === bArr.length;
    const shallowSame =
      sameLen && aArr.every((v, i) => JSON.stringify(v) === JSON.stringify(bArr[i]));
    return shallowSame ? undefined : bArr;
  }

  if (isObj(a) && isObj(b)) {
    const out = {};
    const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
    for (const k of keys) {
      const d = deepDiff(a?.[k], b?.[k]);
      if (d !== undefined) out[k] = d;
    }
    return Object.keys(out).length ? out : undefined;
  }

  return b;
}

export function fixPatchForRequireds(patch, baseline) {
  if (!patch || typeof patch !== "object") return patch;
  const out = { ...patch };

  // If organizerProfile is present but missing 'name', fill with baseline (required by schema).
  if ("organizerProfile" in out) {
    const op = out.organizerProfile || {};
    const baseName = baseline?.organizerProfile?.name;
    const hasNameKey = Object.prototype.hasOwnProperty.call(op, "name");

    if (!hasNameKey && baseName) {
      out.organizerProfile = { ...op, name: baseName };
    }
    if (!hasNameKey && !baseName) {
      delete out.organizerProfile; // avoid sending an invalid subdoc
    }
  }

  return out;
}
