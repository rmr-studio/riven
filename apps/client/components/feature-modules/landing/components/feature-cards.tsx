export function FeatureCards() {
  const features = [
    {
      title: 'Plan your schedules',
      description: 'Explore your data, build your dashboard,\nbring your team together.',
      highlighted: true,
    },
    {
      title: 'Data to insights in the minutes',
      description: 'Explore your data, build your dashboard,\nbring your team together.',
      highlighted: false,
    },
    {
      title: 'Data to insights in the minutes',
      description: 'Explore your data, build your dashboard,\nbring your team together.',
      highlighted: false,
    },
  ];

  return (
    <section className="border-t border-b border-[#e0dedb]">
      <div className="mx-auto max-w-[1060px] px-4">
        <div className="grid grid-cols-1 gap-4 py-8 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`flex flex-col gap-2 p-6 ${
                // Updated feature card borders to 1px
                feature.highlighted
                  ? 'border border-[#e0dedb] bg-white shadow-sm'
                  : 'border border-[#e0dedb]/80'
              }`}
            >
              {feature.highlighted && (
                <div className="mb-2 space-y-1">
                  <div className="h-0.5 w-full bg-[#322d2b]/8"></div>
                  <div className="h-0.5 w-32 bg-[#322d2b]"></div>
                </div>
              )}
              <h3 className="text-sm leading-6 font-semibold text-[#49423d]">{feature.title}</h3>
              <p className="text-sm leading-[22px] whitespace-pre-line text-[#605a57]">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
