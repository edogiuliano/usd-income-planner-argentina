"use client";

import Image from "next/image";
import { useState } from "react";
import { getProvider } from "@/lib/withdrawals/catalog";

export function ProviderIdentity({
  id,
  status,
  compact = false,
  iconOnly = false,
}: {
  id: string;
  status?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const provider = getProvider(id);
  const [failed, setFailed] = useState(false);
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        className={`grid shrink-0 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-600 dark:border-white/10 ${compact ? "size-7" : "size-9"}`}
        aria-hidden="true"
      >
        {provider.logo && !failed ? (
          <Image
            unoptimized
            src={provider.logo}
            alt=""
            width={881}
            height={483}
            className="h-auto max-h-5 w-auto max-w-7 object-contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className={compact ? "text-sm" : "text-base"}>🏦</span>
        )}
      </span>
      {!iconOnly && (
        <span className="min-w-0">
          <span className="block break-words text-sm font-semibold">
            {provider.name}
          </span>
          {status && (
            <span className="block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
              {status}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
