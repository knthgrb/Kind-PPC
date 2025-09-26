"use client";

import { useRouter } from "next/navigation";

export default function Forbidden() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/");
  };

  return (
    <main className="grid min-h-screen place-items-center px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-small font-semibold text-red-700">403</p>
        <h1 className="mt-xs text-heading-1 font-bold tracking-tight text-strong">
          Access forbidden
        </h1>
        <p className="mt-s text-tiny text-weak">
          You don&apos;t have permission to view this page.
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
