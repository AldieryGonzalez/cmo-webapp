import { api } from "~/trpc/server";

const CartButtonBadge = async () => {
    const cart = await api.events.getSavedShifts.query();

    return (
        <p>
            Cart{" "}
            {cart.length > 0 && (
                <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">
                    {cart.length}
                </span>
            )}
        </p>
    );
};

export default CartButtonBadge;
