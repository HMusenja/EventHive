// src/components/event/AgendaSection.jsx
export default function AgendaSection({ agenda = [], speakers = [], timezone }) {
  const byName = Object.fromEntries(speakers.map(s => [s.name, s]));
  const fmt = d => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <section id="agenda" className="container px-4 py-12">
      <h2 className="text-2xl font-semibold">Agenda</h2>
      <div className="mt-6 grid gap-4">
        {agenda.map((s, i) => (
          <div key={i} className="border rounded-xl p-4">
            <div className="text-sm text-muted-foreground">{fmt(s.startAt)} – {fmt(s.endAt)} {timezone && `(${timezone})`}</div>
            <div className="font-medium mt-1">{s.title}</div>
            {s.description && <p className="mt-1 text-muted-foreground">{s.description}</p>}
            <div className="mt-3 flex flex-wrap gap-3">
              {s.speakerNames?.map(n => {
                const sp = byName[n];
                return (
                  <div key={n} className="flex items-center gap-2">
                    {sp?.avatarUrl && <img src={sp.avatarUrl} alt={sp.name} className="w-8 h-8 rounded-full object-cover" />}
                    <span className="text-sm">{n}{sp?.title ? ` — ${sp.title}` : ""}</span>
                  </div>
                );
              })}
            </div>
            {s.room && <div className="mt-2 text-sm text-muted-foreground">Room: {s.room}</div>}
          </div>
        ))}
        {agenda.length === 0 && <p className="text-muted-foreground">Agenda will be announced soon.</p>}
      </div>
    </section>
  );
}
