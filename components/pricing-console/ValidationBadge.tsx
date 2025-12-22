import clsx from "clsx";
import { ValidationStatus } from "@/lib/pricing-validation";

type ValidationBadgeProps = {
    status: ValidationStatus;
    message?: string;
};

export function ValidationBadge({ status, message }: ValidationBadgeProps) {
    const colors = {
        PASS: "bg-green-100 text-green-800 border-green-200",
        WARN: "bg-yellow-100 text-yellow-800 border-yellow-200",
        BLOCK: "bg-red-100 text-red-800 border-red-200",
    };

    return (
        <span
            className={clsx(
                "px-2 py-0.5 text-xs font-semibold rounded border block w-fit",
                colors[status]
            )}
            title={message}
        >
            {status}
        </span>
    );
}
