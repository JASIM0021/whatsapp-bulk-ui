import Link from 'next/link';

export const metadata = { title: 'Page not found | NexBotix' };

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-semibold text-green-400">404</p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">This page doesn&apos;t exist</h1>
      <p className="mt-3 text-gray-400 max-w-md">The link may be broken or the page may have moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="px-5 py-2.5 rounded-xl bg-green-500 text-gray-950 font-semibold">Go home</Link>
        <Link href="/blog" className="px-5 py-2.5 rounded-xl border border-gray-700 text-gray-200">Read the blog</Link>
      </div>
    </main>
  );
}
