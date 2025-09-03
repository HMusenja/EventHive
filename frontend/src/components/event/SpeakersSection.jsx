// src/components/event/SpeakersSection.jsx
export default function SpeakersSection({ speakers = [] }) {
  return (
    <section className="container px-4 py-12">
      <h2 className="text-2xl font-semibold">Speakers</h2>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {speakers.map((s, i) => (
          <article key={i} className="border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <img src={s.avatarUrl || "https://via.placeholder.com/96"} alt={s.name} className="w-16 h-16 rounded-full object-cover" />
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{[s.title, s.company].filter(Boolean).join(" • ")}</div>
              </div>
            </div>
            {s.bio && <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{s.bio}</p>}
          </article>
        ))}
        {speakers.length === 0 && <p className="text-muted-foreground">Speakers will be announced soon.</p>}
      </div>
    </section>
  );
}
