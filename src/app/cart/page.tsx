"use client";
import { api } from "~/trpc/react";

import { differenceInMinutes, endOfWeek, startOfWeek } from "date-fns";
import CartShifts from "./_components/cartshifts";
import ExportButton from "./_components/export";

const Cart = () => {
    const { data: results } = api.events.getSavedShifts.useQuery();
    if (!results) return null;
    const res: Record<number, number> = {};
    const weeklyHours = results.reduce((acc, shift) => {
        const start = startOfWeek(new Date(shift.savedShifts.start)).getTime();
        if (!acc[start]) {
            acc[start] = 0;
        }
        const hours =
            differenceInMinutes(
                shift.savedShifts.end,
                shift.savedShifts.start,
            ) / 60;
        acc[start] += hours;
        return acc;
    }, res);
    return (
        <div className="container mt-4 space-y-4">
            <div className="flex justify-between">
                <h1 className="text-3xl font-bold">Saved Shifts</h1>
                <div className="space-x-2">
                    <ExportButton results={results} />
                </div>
            </div>
            <CartShifts data={results} />
            <div className="mx-auto flex flex-col">
                {Object.entries(weeklyHours).map(([key, value]) => {
                    return (
                        <div key={key} className="rounded-md bg-gray-100">
                            <p className=" bg-gray-300">{`${new Date(
                                parseInt(key),
                            ).toDateString()} - ${endOfWeek(
                                new Date(parseInt(key)),
                            ).toDateString()}`}</p>
                            <p className=" bg-gray-200">
                                {value} hours{" "}
                                {`-> $${(value * 16.5).toFixed(2)}`}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Cart;
