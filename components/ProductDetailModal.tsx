import { X, Check, Minus, Plus, ArrowRight } from "lucide-react";
import Image from "next/image";
import { Product } from "@/lib/erp";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface ProductDetailModalProps {
    product: Product | null;
    isOpen: boolean;
    onClose: () => void;
    onAdd: (product: Product, qty: number) => void;
    qtyInCart: number;
}

export default function ProductDetailModal({ product, isOpen, onClose, onAdd, qtyInCart }: ProductDetailModalProps) {
    const [activeImgSrc, setActiveImgSrc] = useState("");

    useEffect(() => {
        if (product) {
            const baseSrc = product.imageVersion ? `/images/${product.item_code}.jpg?v=${product.imageVersion}` : `/images/${product.item_code}.jpg`;
            setActiveImgSrc(baseSrc);
        }
    }, [product]);

    if (!isOpen || !product) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}>
            <div
                className="bg-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative aspect-square bg-white flex items-center justify-center p-8">
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors z-10">
                        <X size={20} className="text-black" />
                    </button>
                    {product.brand && <span className="absolute top-4 left-4 text-xs font-bold bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">{product.brand}</span>}
                    <Image
                        src={activeImgSrc || `/images/${product.item_code}.jpg`}
                        alt={product.item_name}
                        fill
                        className="object-contain mix-blend-multiply"
                        onError={() => setActiveImgSrc("https://placehold.co/600x600/png?text=Coming+Soon")}
                    />
                </div>

                {/* Content */}
                <div className="p-6 flex-1 overflow-y-auto bg-background">
                    <h2 className="text-xl font-bold leading-tight mb-2">{product.item_name}</h2>
                    <p className="text-sm text-muted-foreground mb-6 uppercase tracking-wider font-bold text-xs">{product.item_code}</p>

                    {/* Description / Attributes (Mocked for now if real data missing) */}
                    <div className="space-y-3 mb-8">
                        <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Category</span>
                            <span className="text-sm font-medium">{product.item_group || "General"}</span>
                        </div>
                        {product.stock_uom && (
                            <div className="flex justify-between py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">Unit</span>
                                <span className="text-sm font-medium">{product.stock_uom}</span>
                            </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted-foreground">Bulk Deal</span>
                            <span className="text-sm font-bold text-green-600">Available (24+ pcs)</span>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="flex items-center justify-between gap-4 mt-auto">
                        <div>
                            <p className="text-xs text-muted-foreground font-bold uppercase">Price</p>
                            <p className="text-2xl font-black">₹{product.standard_rate}</p>
                        </div>

                        <div className="flex-1 max-w-[200px]">
                            {qtyInCart > 0 ? (
                                <div className="flex items-center justify-between bg-zinc-900 text-white rounded-xl p-2 h-12 shadow-lg">
                                    <span className="text-sm font-bold px-4">In Cart: {qtyInCart}</span>
                                    <div className="bg-white/20 rounded-lg p-1">
                                        <Check size={16} />
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => { onAdd(product, 1); onClose(); }}
                                    className="w-full h-12 bg-foreground text-background rounded-xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                                >
                                    Add to Order <ArrowRight size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
