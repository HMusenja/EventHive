// src/components/event/SpeakersSection.jsx

import SafeAvatar from "@/shared/SafeAvatar";

export default function SpeakersSection({ speakers = [] }) {
  return (
     <section className="container py-10">
      <h2 className="text-2xl font-bold mb-6">Speakers</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {speakers.map((sp) => (
          <div key={sp._id || sp.name} className="p-4 rounded-xl border">
            <div className="flex items-center gap-4">
              <SafeAvatar src={sp.photo} name={sp.name} className="h-16 w-16" />
              <div>
                <div className="font-semibold">{sp.name}</div>
                {sp.title && <div className="text-sm text-muted-foreground">{sp.title}</div>}
                {sp.company && <div className="text-sm text-muted-foreground">{sp.company}</div>}
              </div>
            </div>
            {sp.bio && <p className="mt-3 text-sm">{sp.bio}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
