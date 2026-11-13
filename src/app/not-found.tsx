import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-3xl font-black">Page not found</h1>
      <p className="mt-2 text-zinc-600">The event or page you&apos;re looking for isn&apos;t here.</p>
      <Link href="/" className="btn-primary mt-6">See upcoming events</Link>
    </div>
  );
}
