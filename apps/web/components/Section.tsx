import Link from "next/link";

type Props = { title: string; href?: string; children: React.ReactNode; empty?: boolean; emptyText?: string };

export function Section({ title, href, children, empty, emptyText = "Nothing listed yet. Check back soon." }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between">
        <h2 className="text-xl font-bold text-text">{title}</h2>
        {href && (
          <Link href={href} className="text-sm text-primary hover:underline">
            See all →
          </Link>
        )}
      </div>
      {empty ? <p className="rounded-xl bg-card p-6 text-sm text-muted ring-1 ring-line">{emptyText}</p> : children}
    </section>
  );
}
