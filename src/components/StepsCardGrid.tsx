import Image from 'next/image';

type StepCard = {
  icon: string;       // relative path to image in /public
  title: string;
  description: string;
};

type StepsCardGridProps = {
  steps: StepCard[];
  className?: string;
};

export default function StepsCardGrid({ steps, className = '' }: StepsCardGridProps) {
  return (
    <section className={`bg-white  ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="bg-[#F7F7F7] rounded-2xl p-6 shadow-sm text-center flex flex-col items-center max-w-[512px]"
            >
              <div className="w-14 h-14 rounded-full bg-[#C60000] flex items-center justify-center mb-4">
                <Image
                  src={step.icon}
                  alt={step.title}
                  width={24}
                  height={24}
                  className="object-contain"
                />
              </div>
              <h3 className="h3Card mb-2">{step.title}</h3>
              <p className="pCard leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
