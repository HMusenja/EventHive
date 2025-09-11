export default function ProfileHeader({ title, subtitle }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
        {title}
      </h1>
      {subtitle ? <p className="text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
