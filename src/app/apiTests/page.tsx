import { addMonths } from "date-fns";
import { api } from "~/trpc/server";

type TesterProps = {};

const Tester = async ({ ...props }: TesterProps) => {
    const freeBusy = await api.events.freeBusy.query({
        start: new Date(),
        end: addMonths(new Date(), 6),
    });

    return (
        <div className="whitespace-pre">
            {JSON.stringify(freeBusy, undefined, 4)}
        </div>
    );
};

export default Tester;
