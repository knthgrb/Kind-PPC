type StatCardProps = {
  label: string;
  value?: string | number;
  unit?: string;
};

export default function StatCard({ label, value, unit }: StatCardProps) {
  return (
    <div className="p-5 flex flex-col justify-between">
      <div className="text-[clamp(0.85rem,1.5vw,1.05rem)] text-black !font-medium">
        {label}
      </div>

      {value !== undefined && (
        <div className="flex items-baseline gap-1">
          <span className="text-[clamp(1.8rem,4vw,3rem)] text-black !font-bold">
            {value}
          </span>
          {unit && (
            <span className="text-[clamp(0.9rem,1vw,1rem)] text-gray-600 !font-medium">
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
