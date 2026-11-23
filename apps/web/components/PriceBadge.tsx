import { npr } from "@/lib/format";

type Props = { isFree: boolean; min: number | null; max: number | null };

export function PriceBadge({ isFree, min, max }: Props) {
  if (isFree) {
    return <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">FREE</span>;
  }
  const label =
    min != null && max != null && max !== min ? `${npr(min)} – ${new Intl.NumberFormat("en-IN").format(max)}` : npr(min ?? max) || "Paid";
  return <span className="rounded-full bg-ticket/15 px-2.5 py-0.5 text-xs font-bold text-ticket">{label}</span>;
}
