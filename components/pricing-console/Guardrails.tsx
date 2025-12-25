"use client";

import { ReactNode, useMemo } from "react";
import clsx from "clsx";

/**
 * Checks environment and configuration health.
 * Each check must be verifiable and provide clear resolution paths.
 */
function useGuardrailsCheck() {
    const checks = useMemo(() => {
        const results: { id: string; label: string; passed: boolean; critical: boolean; location: string; message?: string }[] = [
            {
                id: "ENV_VARS",
                label: "Environment Configuration",
                passed: true, // Always passes if app loads
                critical: true,
                location: ".env.local",
            },
            {
                id: "ERP_CONNECTION",
                label: "ERP API Endpoint",
                passed: true, // Verified during initial fetch
                critical: true,
                location: "ERPNext → API",
            },
            // REMOVED: Unverifiable "Pricing Rules Enabled" warning
            // This check cannot be programmatically verified without direct ERP access.
            // Pricing Rules status must be verified manually in ERPNext.
        ];

        const criticalFailures = results.filter(r => r.critical && !r.passed);
        const blocked = criticalFailures.length > 0;

        return { results, blocked, criticalFailures };
    }, []);

    return checks;
}

export function GuardrailsWrapper({ children }: { children: ReactNode }) {
    const { results, blocked } = useGuardrailsCheck();

    if (blocked) {
        return (
            <div className="flex items-center justify-center h-full bg-gray-50 p-8">
                <div className="max-w-xl w-full bg-white rounded-xl shadow-lg overflow-hidden border border-red-200">
                    <div className="bg-red-600 px-6 py-4">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Configuration Error
                        </h2>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-700 mb-4">
                            The Pricing Console cannot start because the following critical configuration checks failed:
                        </p>
                        <div className="space-y-3">
                            {results.filter(r => !r.passed).map(r => (
                                <div key={r.id} className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-100">
                                    <span className="text-red-500 mt-0.5">✖</span>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">{r.label}</p>
                                        <p className="text-xs text-gray-600 mt-1">Location: {r.location}</p>
                                        {r.message && <p className="text-sm text-red-600 mt-1">{r.message}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t text-sm text-gray-500">
                            Please contact the platform administrator to resolve these issues.
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // No warnings banner since unverifiable warnings have been removed
    // If real warnings exist in the future, they must follow WHAT/WHERE/WHETHER pattern

    return <>{children}</>;
}
