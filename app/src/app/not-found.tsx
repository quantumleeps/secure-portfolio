import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="space-y-4 text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-lg text-muted-foreground">
          This page could not be found.
        </p>
        <p>
          <Link
            href="/"
            className="text-sm text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            Go home
          </Link>
        </p>
      </div>
    </div>
  );
}
