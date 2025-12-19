"use client";
import { Card, CardBody, Skeleton } from "@heroui/react";

export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header Skeleton */}
            <div className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center px-4 justify-between">
                <Skeleton className="w-32 h-8 rounded-lg" />
                <div className="flex gap-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                </div>
            </div>

            <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8">

                {/* Action Bar Skeleton */}
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="w-40 h-8 rounded-lg" />
                            <Skeleton className="w-20 h-4 rounded-lg" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="w-24 h-10 rounded-xl" />
                            <Skeleton className="w-10 h-10 rounded-xl" />
                        </div>
                    </div>
                    {/* Pills Skeleton */}
                    <div className="flex gap-3 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Skeleton key={i} className="w-24 h-8 rounded-full shrink-0" />
                        ))}
                    </div>
                </div>

                {/* Hero Skeleton */}
                <Skeleton className="w-full h-[200px] md:h-[400px] rounded-3xl mb-12" />

                {/* Grid Skeleton */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                        <Card key={item} className="w-full space-y-5 p-4" radius="lg">
                            <Skeleton className="rounded-lg">
                                <div className="h-40 rounded-lg bg-default-300"></div>
                            </Skeleton>
                            <div className="space-y-3">
                                <Skeleton className="w-3/5 rounded-lg">
                                    <div className="h-3 w-3/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                                <Skeleton className="w-4/5 rounded-lg">
                                    <div className="h-3 w-4/5 rounded-lg bg-default-200"></div>
                                </Skeleton>
                                <Skeleton className="w-2/5 rounded-lg">
                                    <div className="h-3 w-2/5 rounded-lg bg-default-300"></div>
                                </Skeleton>
                            </div>
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
}
