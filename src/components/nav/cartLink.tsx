"use client";
import { api } from "~/trpc/react";

const CartBadge = () => {
    const { data: cart } = api.events.getSavedShifts.useQuery(undefined, {
        staleTime: 30 * 1000, // 30 s — cart badge; refetched after mutations
    });
    return (
        <span className="relative">
            <span>Cart</span>
            {cart && cart.length > 0 && (
                <span className="absolute bottom-0 right-0 inline-flex -translate-y-3/4 translate-x-full transform items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-xs font-bold leading-none text-white">
                    {cart.length}
                </span>
            )}
        </span>
    );
};

export default CartBadge;
