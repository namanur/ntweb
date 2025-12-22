import axios, { AxiosInstance, AxiosError } from 'axios';
/**
 * ERPNext API Contract
 * FROZEN: 2025-12-22
 * DO NOT MODIFY WITHOUT PLATFORM TEAM APPROVAL
 */
import { z } from "zod";
import 'dotenv/config';

// --- CONFIGURATION ---
const ERP_URL = process.env.ERP_NEXT_URL || "http://127.0.0.1:8080";
const API_KEY = process.env.ERP_API_KEY;
const API_SECRET = process.env.ERP_API_SECRET;

if (!API_KEY || !API_SECRET) {
    if (process.env.NODE_ENV !== 'test') {
        console.warn("⚠️ ERP_API_KEY or ERP_API_SECRET is missing. ERP calls will fail.");
    }
}

// --- ERROR TYPES ---
export class ERPError extends Error {
    constructor(message: string, public operation: string, public context?: any) {
        super(message);
        this.name = "ERPError";
    }
}

export class ERPAuthError extends ERPError {
    constructor(operation: string, context?: any) {
        super("ERP Authentication Failed (401/403)", operation, context);
        this.name = "ERPAuthError";
    }
}

export class ERPTimeoutError extends ERPError {
    constructor(operation: string, context?: any) {
        super("ERP Request Timed Out", operation, context);
        this.name = "ERPTimeoutError";
    }
}

export class ERPPartialDataError extends ERPError {
    constructor(message: string, operation: string, context?: any) {
        super(`ERP Data Error: ${message}`, operation, context);
        this.name = "ERPPartialDataError";
    }
}

export class ERPUnknownError extends ERPError {
    constructor(message: string, operation: string, context?: any) {
        super(`ERP Unknown Error: ${message}`, operation, context);
        this.name = "ERPUnknownError";
    }
}

// --- SINGLE AXIOS INSTANCE ---
const client: AxiosInstance = axios.create({
    baseURL: ERP_URL,
    headers: {
        'Authorization': `token ${API_KEY}:${API_SECRET}`,
        'Content-Type': 'application/json',
    },
    timeout: 10000, // Explicit 10s timeout
});

// --- HELPER TYPES ---
export interface ERPDoc {
    name: string;
    [key: string]: any;
}

// --- ERROR HANDLING HELPER ---
function handleERPError(error: any, operation: string, context: any): never {
    let finalError: ERPError;

    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const method = error.config?.method?.toUpperCase();
        const url = error.config?.url;

        console.error(`❌ [ERP Error] ${operation} | ${method} ${url} | Status: ${status || 'Unknown'}`);

        if (status === 401 || status === 403) {
            finalError = new ERPAuthError(operation, { status, url, ...context });
        } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
            finalError = new ERPTimeoutError(operation, { url, ...context });
        } else if (status && status >= 500) {
            finalError = new ERPUnknownError(`Server Error ${status}`, operation, { status, url, ...context });
        } else if (error.response?.data) {
            // Try to extract Frappe/ERPNext error messages
            const data = error.response.data;
            const msg = data.exception || data.message || JSON.stringify(data);
            finalError = new ERPUnknownError(msg, operation, { data, url, ...context });
        } else {
            finalError = new ERPUnknownError(error.message, operation, { url, ...context });
        }
    } else if (error instanceof ERPError) {
        throw error; // Re-throw known ERP errors
    } else {
        console.error(`❌ [ERP Unexpected] ${operation} | ${error.message}`);
        finalError = new ERPUnknownError(error.message || "Unknown", operation, context);
    }

    throw finalError;
}

// --- PUBLIC API ---

/**
 * Fetch a single document by name (ID).
 */
export async function fetchDoc<T = ERPDoc>(doctype: string, name: string): Promise<T | null> {
    const op = `fetchDoc(${doctype}, ${name})`;
    try {
        const res = await client.get(`/api/resource/${doctype}/${encodeURIComponent(name)}`);
        return res.data.data;
    } catch (error: any) {
        if (error.response?.status === 404) return null; // 404 is a valid result (not found)
        handleERPError(error, op, { doctype, name });
    }
}

/**
 * Search for documents with filters.
 */
export async function searchDocs<T = ERPDoc>(
    doctype: string,
    filters: any[][] = [],
    fields: string[] = ["name"],
    limit: number = 20
): Promise<T[]> {
    const op = `searchDocs(${doctype})`;
    try {
        const res = await client.get(`/api/resource/${doctype}`, {
            params: {
                filters: JSON.stringify(filters),
                fields: JSON.stringify(fields),
                limit_page_length: limit
            }
        });

        if (!res.data || !Array.isArray(res.data.data)) {
            throw new ERPPartialDataError("Response format invalid (missing data array)", op, { data: res.data });
        }

        return res.data.data;
    } catch (error: any) {
        handleERPError(error, op, { filters, fields });
    }
}

/**
 * Fetch ALL documents (handling pagination automatically).
 * Use with caution on large tables.
 */
export async function fetchAllDocs<T = ERPDoc>(
    doctype: string,
    fields: string[] = ["name"],
    filters: any[][] = []
): Promise<T[]> {
    const op = `fetchAllDocs(${doctype})`;
    let all: T[] = [];
    let start = 0;
    const limit = 500;

    console.log(`📡 [ERP] Fetching all ${doctype}...`);

    try {
        while (true) {
            const res = await client.get(`/api/resource/${doctype}`, {
                params: {
                    filters: JSON.stringify(filters),
                    fields: JSON.stringify(fields),
                    limit_start: start,
                    limit_page_length: limit
                }
            });

            if (!res.data || !Array.isArray(res.data.data)) {
                throw new ERPPartialDataError("Response format invalid during pagination", op, { start });
            }

            const batch = res.data.data || [];
            all = all.concat(batch);
            process.stdout.write(`\r   Items: ${all.length}`);

            if (batch.length < limit) break;
            start += limit;
        }
        process.stdout.write('\n');
        return all;
    } catch (error: any) {
        handleERPError(error, op, { start, count: all.length });
    }
}

/**
 * Create a new document.
 */
export async function createDoc<T = ERPDoc>(doctype: string, data: any): Promise<T> {
    const op = `createDoc(${doctype})`;
    try {
        const res = await client.post(`/api/resource/${doctype}`, data);
        return res.data.data;
    } catch (error: any) {
        handleERPError(error, op, { data });
    }
}

/**
 * Call a whitelisted method.
 */
export async function callMethod<T = any>(method: string, args: any = {}): Promise<T> {
    const op = `callMethod(${method})`;
    try {
        const res = await client.post(`/api/method/${method}`, args);
        return res.data.message || res.data;
    } catch (error: any) {
        handleERPError(error, op, { args });
    }
}

/**
 * Check if ERP is online.
 */
export async function checkConnection(): Promise<boolean> {
    try {
        await client.get('/api/method/ping');
        return true;
    } catch (e) {
        return false;
    }
}

export default {
    fetchDoc,
    searchDocs,
    fetchAllDocs,
    createDoc,
    callMethod,
    checkConnection,
    ERPError,
    ERPAuthError,
    ERPTimeoutError,
    ERPPartialDataError,
    ERPUnknownError
};
