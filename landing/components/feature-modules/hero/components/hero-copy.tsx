export const HeroCopy = () => {
  return (
    <div className="text-center flex flex-col space-y-4 px-8 md:px-0">
      <section className="mx-auto">
        <h3 className="text-xl md:text-3xl italic flex flex-col md:flex-row items-end justify-center gap-x-2 gap-y-0 flex-wrap w-fit mx-auto">
          <div className="w-full md:w-auto flex pl-1 mb-1">Every tool </div>
          <div className="w-fit font-extrabold tracking-tight not-italic text-3xl sm:text-4xl lg:text-5xl bg-purple-500/40 mx-0.5 px-2 py-0.5 rounded-sm rounded-b-none">
            shows you a slice.
          </div>{" "}
          <div className="w-full md:w-auto flex pl-1 mb-1">
            Riven visualises
          </div>
        </h3>
        <h1 className="text-xl md:text-3xl italic flex flex-col md:flex-row items-end justify-center gap-x-2 gap-y-0 flex-wrap w-fit mx-auto">
          <div className="text-primary font-bold tracking-tight text-5xl sm:text-6xl md:text-7xl lg:text-8xl rounded-sm bg-purple-500/40 px-2 py-0.5 w-fit">
            your entire business
          </div>
        </h1>
      </section>
      <section className=" w-full bottom-24 absolute left-1/2 md:left-0 md:bottom-0 -translate-x-1/2 md:translate-x-0 md:relative lg:text-lg max-w-sm md:max-w-2xl  text-center lg:text-start md:mx-auto  lg:ml-[40%] italic leading-tight flex flex-col h-auto grow ">
        <div>
          Cross-domain intelligence for scaling consumer businesses that
          connects your CRM, payments, support — with a bleeding edge AI powered
          knowledge base that surfaces what siloed tools cannot.
        </div>
      </section>
    </div>
  );
};
