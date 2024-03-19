"use client";
import { useEffect } from "react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-w-screen min-h-screen flex items-center justify-center">
      <h2 className="text-2xl text-center">Something went wrong!</h2>
    </div>
  );
}
