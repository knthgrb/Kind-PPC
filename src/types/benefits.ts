export type BenefitRecord = {
  number: string;
  lastPaymentDate: string;
  amount: string;
  nextDueDate: string;
  status: "Paid" | "Unpaid";
  notes: string;
};

export type BenefitCategory = {
  name: string;
  records: BenefitRecord[];
};
