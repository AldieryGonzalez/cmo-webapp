import { api } from "~/trpc/server";

const CartBadge = async () => {
    const cart = await api.events.getSavedShifts.query();
    return (
        <span className="relative">
            <span>Cart</span>
            {cart.length > 0 && (
                <span className="absolute bottom-0 right-0 inline-flex -translate-y-3/4 translate-x-full transform items-center justify-center rounded-full bg-red-500 px-1 py-0.5 text-xs font-bold leading-none text-white">
                    {cart.length}
                </span>
            )}
        </span>
    );
};

export default CartBadge;
