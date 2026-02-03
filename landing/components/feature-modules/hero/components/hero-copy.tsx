export const HeroCopy = () => {
  return (
    <div className="text-center flex flex-col space-y-4 px-8 md:px-0">
      <section className="mx-auto">
        <h3 className="text-xl md:text-3xl italic flex flex-col md:flex-row items-center justify-center gap-x-2 gap-y-0 flex-wrap w-fit mx-auto">
          <div className="w-full md:w-auto flex pl-1">run your </div>
          <div className="w-fit font-extrabold tracking-tight not-italic text-3xl sm:text-4xl lg:text-5xl bg-purple-500/50 mx-0.5 px-2 py-0.5 rounded-sm">
            entire operation
          </div>{" "}
          <div className="w-full md:w-auto flex justify-end pr-1"> from</div>
        </h3>
        <h1 className="text-primary font-bold tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl ">
          one platform
        </h1>
      </section>
      <section className="w-full bottom-24 absolute left-1/2 md:left-0 md:bottom-0 -translate-x-1/2 md:translate-x-0 md:relative lg:text-lg max-w-sm md:max-w-2xl lg:max-w-3xl text-center lg:text-start md:mx-auto  lg:ml-[45%] italic leading-tight flex flex-col h-auto grow ">
        <div>Riven is an open sourced, scalable workspace.</div>
        <div>
          Bringing your CRM, automations, documents, invoicing and all of your
          favourite third party tools into a{" "}
          <span className="font-bold animate-pulse">
            single, unified platform.
          </span>
        </div>
        <div>
          Built for consumer businesses that are{" "}
          <span className="bg-green-500/50 rounded-sm px-1">
            ready to grow.
          </span>
        </div>
      </section>
    </div>
  );
};
