import { format, formatDistanceToNow } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

const formatDate = (date: Date) => {
  const formattedDate = format(date, "MMM d, yyyy, h:mm a");
  const hoursAgo = formatDistanceToNow(date, { addSuffix: true });
  return `${formattedDate} (${hoursAgo})`;
};

const text = `\tLorem ipsum dolor sit amet consectetur adipisicing elit. 
\tAlias voluptates et voluptatibus veniam, ad, deleniti qui suscipit ullam pariatur impedit quod ipsa dignissimos, ducimus officiis. 
\tConsequuntur delectus, officia unde numquam sunt fugiat consectetur blanditiis a tempora quasi quidem earum illum repellat accusantium et debitis reiciendis architecto atque aut sapiente corporis. 
\tAnimi optio debitis nostrum numquam commodi tempora incidunt deleniti quas adipisci! Beatae culpa tempora provident sequi alias quisquam, porro nesciunt dolorem dolor in delectus maxime consequatur aliquam deleniti rem? 
\tLabore voluptates numquam omnis, eum eaque corporis mollitia consectetur eius sequi atque reiciendis nam dicta perferendis accusantium natus maxime, aperiam explicabo modi ducimus est fugiat?
\tRem vitae temporibus vero quae blanditiis eum ducimu eius. 
\tIncidunt animi ex officiis perspiciatis repellat sequi dicta soluta veniam, recusandae numquam quis a nisi architecto distinctio nemo ducimus nobis. 
\tRem vitae temporibus vero quae blanditiis eum ducimu eius. 
\tIncidunt animi ex officiis perspiciatis repellat sequi dicta soluta veniam, recusandae numquam quis a nisi architecto distinctio nemo ducimus nobis. 
\tRem vitae temporibus vero quae blanditiis eum ducimu eius. 
\tIncidunt animi ex officiis perspiciatis repellat sequi dicta soluta veniam, recusandae numquam quis a nisi architecto distinctio nemo ducimus nobis. 
\tRem vitae temporibus vero quae blanditiis eum ducimu eius. 
\tIncidunt animi ex officiis perspiciatis repellat sequi dicta soluta veniam, recusandae numquam quis a nisi architecto distinctio nemo ducimus nobis. 
\tObcaecati quam quae recusandae vitae animi expedita ullam facilis, quis corrupti accusamus delectus amet quisquam pariatur laborum ipsum dolorem harum nostrum. 
\tRepudiandae iure quia dolore incidunt, laborum numquam quasi magni, dicta sequi sapiente iste nobis ex labore nostrum at exercitationem veritatis est corrupti blanditiis omnis? 
\tObcaecati quam quae recusandae vitae animi expedita ullam facilis, quis corrupti accusamus delectus amet quisquam pariatur laborum ipsum dolorem harum nostrum. 
\tRepudiandae iure quia dolore incidunt, laborum numquam quasi magni, dicta sequi sapiente iste nobis ex labore nostrum at exercitationem veritatis est corrupti blanditiis omnis? 
\tObcaecati quam quae recusandae vitae animi expedita ullam facilis, quis corrupti accusamus delectus amet quisquam pariatur laborum ipsum dolorem harum nostrum. 
\tRepudiandae iure quia dolore incidunt, laborum numquam quasi magni, dicta sequi sapiente iste nobis ex labore nostrum at exercitationem veritatis est corrupti blanditiis omnis? 



\tObcaecati quam quae recusandae vitae animi expedita ullam facilis, quis corrupti accusamus delectus amet quisquam pariatur laborum ipsum dolorem harum nostrum. 
\tRepudiandae iure quia dolore incidunt, laborum numquam quasi magni, dicta sequi sapiente iste nobis ex labore nostrum at exercitationem veritatis est corrupti blanditiis omnis? 
\tVoluptatem, consequuntur molestias obcaecati autem rem eum magnam id quam. Voluptas tempora commodi voluptatum qui ab dolorum nostrum laboriosam quo odit architecto?`;

const date = new Date(2023, 9, 31, 9, 28); // Oct 31, 2023, 9:28 AM

const DashboardMessages = () => {
  const page = 1;
  const totalPages = 5;
  return (
    <section className="flex grow flex-col">
      <h3 className="block text-xl font-normal">Announcements</h3>
      <div className="relative grow overflow-y-scroll rounded-md bg-zinc-200 ">
        <nav className="sticky left-0 right-0 top-0 flex h-7 justify-end gap-2 rounded-t-md bg-zinc-400 px-6 py-0.5">
          <p>{`${page} of ${totalPages}`}</p>
          <button>
            <ChevronLeft />
          </button>
          <button>
            <ChevronRight />
          </button>
        </nav>
        <div className="flex flex-col p-3">
          <p className="text-lg font-semibold">New Feature</p>
          <p className="text-sm font-normal">Bill Millgram</p>
          <p className="text-sm font-normal">To: Everyone</p>
          <p className="text-sm font-normal">{`Sent: ${formatDate(date)}`}</p>
          <pre className="whitespace-pre-wrap text-sm font-normal">{text}</pre>
        </div>
      </div>
    </section>
  );
};

export default DashboardMessages;
