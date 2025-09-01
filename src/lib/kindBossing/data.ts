import { BenefitCategory } from "@/types/benefits";

export const stats = {
  totalEmployees: 12,
  totalHours: 30,
  pendingPayslips: 5,
  documentsUploaded: 25,
};

export const attendees = [
  {
    name: "Darlene Robertson",
    date: "2019-8-2",
    timeIn: "09:00 am",
    timeOut: "05:00 pm",
    hours: "8 Hours",
    status: "On time",
  },
  {
    name: "Cody Fisher",
    date: "2013-8-16",
    timeIn: "10:00 am",
    timeOut: "05:00 pm",
    hours: "7 Hours",
    status: "Late",
  },
  {
    name: "Savannah Nguyen",
    date: "2017-1-28",
    timeIn: "11:00 am",
    timeOut: "05:00 pm",
    hours: "6 Hours",
    status: "Late",
  },
  {
    name: "Floyd Miles",
    date: "2017-7-18",
    timeIn: "09:00 am",
    timeOut: "05:00 pm",
    hours: "8 Hours",
    status: "On time",
  },
  {
    name: "Jacob Jones",
    date: "2015-5-27",
    timeIn: "11:30 am",
    timeOut: "05:00 pm",
    hours: "5.5 Hours",
    status: "Late",
  },
  {
    name: "Marvin McKinney",
    date: "2014-8-30",
    timeIn: "09:00 am",
    timeOut: "05:00 pm",
    hours: "8 Hours",
    status: "On time",
  },
  {
    name: "Cameron Williamson",
    date: "2019-6-21",
    timeIn: "09:00 am",
    timeOut: "05:00 pm",
    hours: "8 Hours",
    status: "On time",
  },
  {
    name: "Courtney Henry",
    date: "2012-10-28",
    timeIn: "09:00 am",
    timeOut: "05:00 pm",
    hours: "8 Hours",
    status: "On time",
  },
  {
    name: "Ako Nanobra",
    date: "2012-10-28",
    timeIn: "09:00 am",
    timeOut: "05:00 pm",
    hours: "8 Hours",
    status: "On time",
  },
];

export interface Payslip {
  name: string;
  month: string;
  netPay: string;
  hours: string;
  status: "Paid" | "Unpaid";
}

export const payslips: Payslip[] = [
  {
    name: "Darlene Robertson",
    month: "Mar",
    netPay: "₱550",
    hours: "365 Hours",
    status: "Paid",
  },
  {
    name: "Cody Fisher",
    month: "Nov",
    netPay: "₱685",
    hours: "225 Hours",
    status: "Unpaid",
  },
  {
    name: "Savannah Nguyen",
    month: "Jul",
    netPay: "₱550",
    hours: "115 Hours",
    status: "Unpaid",
  },
  {
    name: "Floyd Miles",
    month: "Aug",
    netPay: "₱895",
    hours: "65 Hours",
    status: "Paid",
  },
  {
    name: "Jacob Jones",
    month: "Feb",
    netPay: "₱1000",
    hours: "41 Hours",
    status: "Unpaid",
  },
  {
    name: "Marvin McKinney",
    month: "Oct",
    netPay: "₱1685",
    hours: "691 Hours",
    status: "Paid",
  },
  {
    name: "Cameron Williamson",
    month: "Jun",
    netPay: "₱550",
    hours: "595 Hours",
    status: "Paid",
  },
  {
    name: "Courtney Henry",
    month: "May",
    netPay: "₱895",
    hours: "325 Hours",
    status: "Paid",
  },
];

export const employeeOptions = [
  "Darlene Robertson",
  "Cody Fisher",
  "Savannah Nguyen",
  "Floyd Miles",
  "Jacob Jones",
  "Marvin McKinney",
  "Cameron Williamson",
  "Courtney Henry",
];

export const deductionOptions = [
  "PhilHealth",
  "SSS",
  "Pag-IBIG",
  "Tax",
  "Other",
];

export const govBenefits: BenefitCategory[] = [
  {
    name: "SSS",
    records: [
      {
        number: "01",
        lastPaymentDate: "9/23/16",
        amount: "₱550",
        nextDueDate: "9/23/16",
        status: "Paid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        number: "02",
        lastPaymentDate: "10/28/12",
        amount: "₱550",
        nextDueDate: "10/28/12",
        status: "Unpaid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        number: "03",
        lastPaymentDate: "12/4/17",
        amount: "₱550",
        nextDueDate: "12/4/17",
        status: "Unpaid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
    ],
  },
  {
    name: "PhilHealth",
    records: [
      {
        number: "01",
        lastPaymentDate: "9/23/16",
        amount: "₱550",
        nextDueDate: "9/23/16",
        status: "Paid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        number: "02",
        lastPaymentDate: "10/28/12",
        amount: "₱550",
        nextDueDate: "10/28/12",
        status: "Unpaid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        number: "03",
        lastPaymentDate: "12/4/17",
        amount: "₱550",
        nextDueDate: "12/4/17",
        status: "Unpaid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
    ],
  },
  {
    name: "Pag-IBIG",
    records: [
      {
        number: "01",
        lastPaymentDate: "9/23/16",
        amount: "₱550",
        nextDueDate: "9/23/16",
        status: "Paid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        number: "02",
        lastPaymentDate: "10/28/12",
        amount: "₱550",
        nextDueDate: "10/28/12",
        status: "Unpaid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
      {
        number: "03",
        lastPaymentDate: "12/4/17",
        amount: "₱550",
        nextDueDate: "12/4/17",
        status: "Unpaid",
        notes:
          "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
      },
    ],
  },
];

export const pdfData = [
  {
    name: "Contract File",
    date: "2024-01-01",
    type: "Contracts",
    description: "Description for the first PDF file.",
  },
  {
    name: "General PDF",
    date: "2024-02-15",
    type: "PDF",
    description: "Description for the second PDF file.",
  },
  {
    name: "Signed Contract",
    date: "2024-03-20",
    type: "Contracts",
    description: "Description for the third PDF file.",
  },
  {
    name: "Another PDF",
    date: "2024-04-10",
    type: "PDF",
    description: "Description for the fourth PDF file.",
  },
];

export const postedJobs = [
  {
    name: "Jarrel Steward",
    image: "/people/darrellSteward.png",
    location: "Cebu City",
    occupation: "Maid for Home",
    price: 550,
  },
  {
    name: "Ralph Edwards",
    image: "/people/ralphEdwards.png",
    location: "Cebu City",
    occupation: "Electrician",
    price: 550,
  },
  {
    name: "Esther Howard",
    image: "/people/estherHoward.png",
    location: "Talisay City",
    occupation: "Plumber",
    price: 550,
  },
  {
    name: "Theresa Webb",
    image: "/people/theresaWebb.png",
    location: "Talisay City",
    occupation: "Maid for Home",
    price: 550,
  },
  {
    name: "Devon Lane",
    image: "/people/devonLane.png",
    location: "Naga City",
    occupation: "Electrician",
    price: 550,
  },
  {
    name: "Kristin Watson",
    image: "/people/kristinWatson.png",
    location: "Naga City",
    occupation: "Plumber",
    price: 550,
  },
  {
    name: "Dianne Russell",
    image: "/people/dianneRussell.png",
    location: "Minglanilla",
    occupation: "Maid for Home",
    price: 550,
  },
  {
    name: "Jane Cooper",
    image: "/people/janeCooper.png",
    location: "Minglanilla",
    occupation: "Electrician",
    price: 550,
  },
];
