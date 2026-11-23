import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-text">Not found</h1>
      <p className="text-muted">That show may have ended its run.</p>
      <Link href="/" className="text-primary hover:underline">
        Back to Mancha
      </Link>
    </div>
  );
}
