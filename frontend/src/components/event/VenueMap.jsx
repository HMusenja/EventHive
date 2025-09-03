// src/components/event/VenueMap.jsx
export default function VenueMap({ venue }) {
  if (!venue) return null;
  const { name, address, city, country, lat, lng, mapEmbedUrl } = venue;
  const osm = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <section className="container px-4 py-12">
      <h2 className="text-2xl font-semibold">Venue</h2>
      <p className="mt-2 text-muted-foreground">{name} — {address}, {city}, {country}</p>
      <div className="mt-4 aspect-[16/9] w-full overflow-hidden rounded-xl border">
        {mapEmbedUrl ? (
          <iframe title="Map" className="w-full h-full" src={mapEmbedUrl} loading="lazy" />
        ) : osm ? (
          <iframe title="Map" className="w-full h-full" src={osm} loading="lazy" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">Map unavailable</div>
        )}
      </div>
      {(lat && lng) && (
        <a
          className="inline-block mt-3 underline text-sm"
          href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`}
          target="_blank" rel="noreferrer"
        >
          Open in Maps
        </a>
      )}
    </section>
  );
}

