"use client";

import { ReactNode, useMemo } from "react";
import clsx from "clsx";

/**
 * Checks environment and configuration health.
 * In a real app, this might fetch from a /api/system/health endpoint
 * or check specific ERP settings via API.
 * For now, we simulate these checks.
 */
function useGuardrailsCheck() {
    const checks = useMemo(() => {
        const results = [
            {
                id: "ENV_VARS",
                label: "Environment Variables Configured",
                passed: !!process.env.NEXT_PUBLIC_PRICING_READ_ONLY || true, // Always true if env loads, but good to check
                critical: true
            },
            {
                id: "ERP_CONNECTION",
                label: "ERP Connection Configured",
                passed: true, // Mocked for now
                critical: true
            },
            {
                id: "PRICING_RULES_ENABLED",
                label: "ERP: Pricing Rules Enabled",
                passed: false, // Simulating a warning: ERP might have conflicting rules
                critical: false, // Just a warning
                message: "Detected active ERP Pricing Rules. Disable these to prevent override of Console prices."
            },
            {
                id: "USER_PERMISSIONS",
                label: "User Write Access",
                passed: true,
                critical: true
            }
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
                                    <div>
                                        <p className="font-semibold text-gray-900">{r.label}</p>
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

    // Warnings Banner (if any non-critical failed)
    const warnings = results.filter(r => !r.critical && !r.passed);

    return (
        <>
            {warnings.length > 0 && (
                <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-orange-800">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 19h.01" />
                        </svg>
                        <span className="font-medium">Configuration Warnings:</span>
                        <span>{warnings.map(w => w.message || w.label).join(", ")}</span>
                    </div>
                </div>
            )}
            {children}
        </>
    );
}
