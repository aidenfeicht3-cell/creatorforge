import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5 text-center">
      <div>
        <div className="text-7xl font-semibold text-gradient">404</div>
        <h1 className="mt-4 text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-muted">
          That page doesn't exist — let's get you back on track.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className={buttonClasses("primary", "md")}>
            Back home
          </Link>
          <Link href="/dashboard" className={buttonClasses("secondary", "md")}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
