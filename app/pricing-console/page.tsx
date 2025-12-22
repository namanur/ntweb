import { PricingConsole } from "@/components/pricing-console/PricingConsole";

export default function PricingConsolePage() {
    return (
        <main className="container mx-auto p-4 h-screen flex flex-col">
            <h1 className="text-2xl font-bold mb-4">Pricing Console</h1>
            <PricingConsole />
            {/* TODO: Implement data fetching */}
        </main>
    );
}
