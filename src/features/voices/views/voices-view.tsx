"use client";

import { Suspense } from "react";
import { useTRPC } from "@/trpc/client";
import { useQueryState } from "nuqs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { VoicesList } from "../components/voices-list";
import { voicesSearchParams } from "../lib/params";
import { VoicesToolbar } from "../components/voices-toolbar";

function VoicesContent() {
    const trpc = useTRPC();
    const [ query ] = useQueryState(
        "query",
        voicesSearchParams.query
    );
    const { data } = useSuspenseQuery(
        trpc.voices.getAll.queryOptions({ query })
    );

    return (
        <>
            <VoicesList title="Team Voices" voices={data.custom} />
            <VoicesList title="Built-in Voices" voices={data.system} />
        </>
    );
};

function VoicesLoadingFallback() {
    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
            <div className="space-y-3">
                <Skeleton className="h-6 w-32" />
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function VoicesView() {
    return (
        <div className="flex-1 space-y-10 overflow-y-auto p-3 lg:p-6">
            <VoicesToolbar />
            <Suspense fallback={<VoicesLoadingFallback />}>
                <VoicesContent />
            </Suspense>
        </div>
    );
};