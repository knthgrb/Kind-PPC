"use client";

import { useRouter } from "next/navigation";

export default function Custom404() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
  };

  return (
    <main className="grid min-h-screen place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-small font-semibold text-red-700">404</p>
        <h1 className="mt-xs text-heading-1 font-bold tracking-tight text-strong">
          Page not found
        </h1>
        <p className="mt-s text-tiny text-weak">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
        <div className="mt-m flex items-center justify-center gap-x-6">
          <button
            className="text-small font-semibold text-red-700 cursor-pointer"
            onClick={handleClick}
          >
            Go back home
          </button>
        </div>
      </div>
    </main>
  );
}
