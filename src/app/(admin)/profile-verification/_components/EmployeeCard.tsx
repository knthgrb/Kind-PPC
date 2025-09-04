import Image from "next/image";
import { formatMMDDYYYY } from "@/utils/dateFormatter";

type ApprovalCardProps = {
  name: string;
  email: string;
  joiningDate: string | Date; // accepts "2024-12-05" or Date
  idDocument: string;
  avatarSrc?: string; // optional avatar
  onApprove?: () => void;
  onReject?: () => void;
};

export default function EmployeeCard({
  name,
  email,
  joiningDate,
  idDocument,
  avatarSrc = "/profile.jpg",
  onApprove,
  onReject,
}: ApprovalCardProps) {
  return (
    <div className="border border-[#E0E6F7] rounded-lg p-4 bg-white w-full">
      <div className="flex items-center space-x-3 mb-3">
        <div className="w-12 aspect-square relative">
          <Image
            src={avatarSrc}
            alt={`${name} avatar`}
            fill
            className="object-cover rounded-md"
          />
        </div>
        <div>
          <h3 className="text-[0.95rem] text-[#05264E] font-semibold leading-5">
            {name}
          </h3>
          <p className="text-[0.66rem] text-[#A0ABB8]">{email}</p>
        </div>
      </div>

      <div className="text-sm space-y-1 mb-4">
        <p>
          <span className="!font-bold text-[0.66rem] text-[#05264E]">
            Joining Date:
          </span>{" "}
          <span className="text-[0.66rem] text-[#05264E]">
            {formatMMDDYYYY(joiningDate)}
          </span>
        </p>

        <p>
          <span className="!font-bold text-[0.66rem] text-[#05264E]">
            ID Document:
          </span>{" "}
          <span className="text-[0.66rem] text-[#05264E]">{idDocument}</span>
        </p>
      </div>

      <div className="flex space-x-3">
        <button
          type="button"
          className="flex-1 border border-red-600 text-red-600 text-[0.718rem]  rounded-md py-2 hover:bg-red-50 cursor-pointer"
        >
          Reject
        </button>
        <button
          type="button"
          className="flex-1 bg-red-600 text-white text-[0.718rem] rounded-md py-2 hover:bg-red-700 cursor-pointer"
        >
          Approve
        </button>
      </div>
    </div>
  );
}
