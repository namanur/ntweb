"use client";

import { clsx } from "clsx";

export type IssueType = "VALIDATION" | "CONFIGURATION" | "RUNTIME";
export type IssueSeverity = "BLOCK" | "WARN" | "INFO";

export type Issue = {
    id: string;
    type: IssueType;
    severity: IssueSeverity;
    title: string;
    itemCode?: string; // If related to a specific item
    message: string;
    location?: string; // Where the issue originates (e.g., "ERP Field: standard_rate")
    resolution?: string; // Suggested fix
};

export type IssuesDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    issues: Issue[];
};

export function IssuesDrawer({ isOpen, onClose, issues }: IssuesDrawerProps) {
    const groupedIssues = {
        BLOCK: issues.filter(i => i.severity === "BLOCK"),
        WARN: issues.filter(i => i.severity === "WARN"),
        INFO: issues.filter(i => i.severity === "INFO"),
    };

    const SeverityBadge = ({ severity }: { severity: IssueSeverity }) => {
        const colors = {
            BLOCK: "bg-red-100 text-red-700 border-red-200",
            WARN: "bg-amber-100 text-amber-700 border-amber-200",
            INFO: "bg-blue-100 text-blue-700 border-blue-200",
        };
        return (
            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", colors[severity])}>
                {severity}
            </span>
        );
    };

    const TypeIcon = ({ type }: { type: IssueType }) => {
        const icons = {
            VALIDATION: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            CONFIGURATION: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            RUNTIME: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        };
        return icons[type];
    };

    return (
        <div
            className={clsx(
                "fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}
        >
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-lg text-gray-800">Issues Inspector</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {issues.length} {issues.length === 1 ? "issue" : "issues"} detected
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 transition-colors p-1 hover:bg-gray-200 rounded"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {issues.length === 0 && (
                    <div className="text-center py-20">
                        <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-gray-600 font-medium">No issues detected</p>
                        <p className="text-gray-400 text-sm mt-1">All systems operating normally</p>
                    </div>
                )}

                {/* BLOCK Issues */}
                {groupedIssues.BLOCK.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Blocking Issues ({groupedIssues.BLOCK.length})
                        </h4>
                        <div className="space-y-2">
                            {groupedIssues.BLOCK.map(issue => (
                                <IssueCard key={issue.id} issue={issue} />
                            ))}
                        </div>
                    </div>
                )}

                {/* WARN Issues */}
                {groupedIssues.WARN.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            Warnings ({groupedIssues.WARN.length})
                        </h4>
                        <div className="space-y-2">
                            {groupedIssues.WARN.map(issue => (
                                <IssueCard key={issue.id} issue={issue} />
                            ))}
                        </div>
                    </div>
                )}

                {/* INFO Issues */}
                {groupedIssues.INFO.length > 0 && (
                    <div>
                        <h4 className="text-sm font-bold text-blue-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Informational ({groupedIssues.INFO.length})
                        </h4>
                        <div className="space-y-2">
                            {groupedIssues.INFO.map(issue => (
                                <IssueCard key={issue.id} issue={issue} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function IssueCard({ issue }: { issue: Issue }) {
    const SeverityBadge = ({ severity }: { severity: IssueSeverity }) => {
        const colors = {
            BLOCK: "bg-red-100 text-red-700 border-red-200",
            WARN: "bg-amber-100 text-amber-700 border-amber-200",
            INFO: "bg-blue-100 text-blue-700 border-blue-200",
        };
        return (
            <span className={clsx("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", colors[severity])}>
                {severity}
            </span>
        );
    };

    const TypeIcon = ({ type }: { type: IssueType }) => {
        const icons = {
            VALIDATION: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            CONFIGURATION: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            RUNTIME: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        };
        return icons[type];
    };

    const borderColor = {
        BLOCK: "border-red-200 bg-red-50/50",
        WARN: "border-amber-200 bg-amber-50/50",
        INFO: "border-blue-200 bg-blue-50/50",
    }[issue.severity];

    return (
        <div className={clsx("border rounded-lg p-3 text-sm", borderColor)}>
            <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    <div className="text-gray-600">
                        <TypeIcon type={issue.type} />
                    </div>
                    <span className="font-semibold text-gray-900">{issue.title}</span>
                </div>
                <SeverityBadge severity={issue.severity} />
            </div>

            {issue.itemCode && (
                <div className="text-xs text-gray-600 mb-2">
                    <span className="font-medium">Item:</span> <span className="font-mono">{issue.itemCode}</span>
                </div>
            )}

            <p className="text-gray-700 text-xs mb-2">{issue.message}</p>

            {issue.location && (
                <div className="text-xs text-gray-600 mb-2">
                    <span className="font-medium">Location:</span> {issue.location}
                </div>
            )}

            {issue.resolution && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                        <span className="font-medium">Resolution:</span> {issue.resolution}
                    </p>
                </div>
            )}
        </div>
    );
}
