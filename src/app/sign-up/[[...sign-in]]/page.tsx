import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex h-full justify-end bg-purple-900 p-2">
      <div className="mb-4 ml-4 hidden grow rounded-lg border-[3px] border-black bg-white p-5 shadow-[7px_7px_0_#000000] lg:block">
        <h1 className="text-center text-4xl font-bold">Northwestern CMO</h1>
        <p className="mb-4 text-center text-2xl font-semibold text-muted-foreground">
          Concert Management Office application
        </p>
        <ul className="ml-4 list-disc text-lg font-semibold xl:text-2xl">
          <li>Sign in with your Northwestern email</li>
          <li>View upcoming events</li>
          <li>Sign up for shifts</li>
          <li>View your saved shifts</li>
        </ul>
      </div>
      <div className="flex w-full flex-col items-center lg:flex lg:w-auto lg:px-12">
        <div className="mb-8 text-center lg:hidden">
          <h1 className="text-3xl font-bold text-white">Northwestern CMO</h1>
          <p className="text-lg text-white">
            Concert Management Office application
          </p>
        </div>

        <SignUp />
      </div>
    </div>
  );
}
