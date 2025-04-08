import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/jobs/ui/card";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Static data for demonstration
const staticJob = {
  postedDate: "2025-03-15",
  status: "OPEN",
};

const staticCandidates = [
  { id: 1, status: "Screening" },
  { id: 2, status: "Screening" },
  { id: 3, status: "Interviewing" },
  { id: 4, status: "Selected" },
  { id: 5, status: "Screening" },
];

const SubmissionOverviewCard = () => {
  // Calculate data for the pie chart using static data
  const internalSubmissions = staticCandidates.filter(c => c.status === "Screening").length; // 3
  const clientSubmissions = staticCandidates.filter(c => c.status === "Interviewing").length; // 1
  const joined = staticCandidates.filter(c => c.status === "Selected").length; // 1
  const interviewed = 0; // Static value
  const offer = 0; // Static value

  // Pie chart data
  const data = {
    labels: ["Internal Submission", "Client Submission", "Interviewed", "Joined", "Offer"],
    datasets: [
      {
        data: [internalSubmissions, clientSubmissions, interviewed, joined, offer],
        backgroundColor: [
          "oklch(62.7% 0.265 303.9)", // Purple from your CSS
          "#7B43F1", // Gradient start
          "#b343b5", // Purple hover
          "rgb(180 75 203 / 0.8)", // Gradient end
          "#D1C4E9", // Light purple for contrast
        ],
        borderWidth: 1,
        borderColor: "#ffffff",
      },
    ],
  };

  // Pie chart options for a modern look
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#4B5563", // Gray-600 for text
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { size: 16 },
        bodyFont: { size: 14 },
        padding: 10,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Card className="md:col-span-1  shadow-lg">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-lg font-semibold purple-text-color flex items-center">
          <svg
            className="mr-2"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M5 17h14"
            />
          </svg>
          Submission Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="h-64">
          <Pie data={data} options={options} />
        </div>
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-500 flex items-center">
            <svg
              className="mr-2 text-purple-500"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Posted: {staticJob.postedDate}
          </span>
          <span
            className={`text-sm font-medium px-2 py-1 rounded-full ${
              staticJob.status === "OPEN"
                ? "bg-green-100 text-green-800"
                : staticJob.status === "HOLD"
                ? "bg-orange-100 text-orange-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {staticJob.status}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default SubmissionOverviewCard;



// Real Data count

// import { Pie } from "react-chartjs-2";
// import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/jobs/ui/card";
// import { JobData, Candidate } from "@/lib/types";

// // Register Chart.js components
// ChartJS.register(ArcElement, Tooltip, Legend);

// interface SubmissionOverviewCardProps {
//   job: JobData;
//   candidates: Candidate[];
// }

// const SubmissionOverviewCard = ({ job, candidates }: SubmissionOverviewCardProps) => {
//   // Calculate data for the pie chart
//   const internalSubmissions = candidates.filter(c => c.status === "Screening").length;
//   const clientSubmissions = candidates.filter(c => c.status === "Interviewing").length;
//   const joined = candidates.filter(c => c.status === "Selected").length;
//   const interviewed = 0; // Hardcoded as in original
//   const offer = 0; // Hardcoded as in original

//   // Pie chart data
//   const data = {
//     labels: ["Internal Submission", "Client Submission", "Interviewed", "Joined", "Offer"],
//     datasets: [
//       {
//         data: [internalSubmissions, clientSubmissions, interviewed, joined, offer],
//         backgroundColor: [
//           "oklch(62.7% 0.265 303.9)", // Purple from your CSS
//           "#7B43F1", // Gradient start
//           "#b343b5", // Purple hover
//           "rgb(180 75 203 / 0.8)", // Gradient end
//           "#D1C4E9", // Light purple for contrast
//         ],
//         borderWidth: 1,
//         borderColor: "#ffffff",
//       },
//     ],
//   };

//   // Pie chart options for a modern look
//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: "bottom" as const,
//         labels: {
//           color: "#4B5563", // Gray-600 for text
//           font: {
//             size: 14,
//           },
//         },
//       },
//       tooltip: {
//         backgroundColor: "rgba(0, 0, 0, 0.8)",
//         titleFont: { size: 16 },
//         bodyFont: { size: 14 },
//         padding: 10,
//       },
//     },
//     maintainAspectRatio: false,
//   };

//   return (
//     <Card className="md:col-span-1  shadow-lg">
//       <CardHeader className="pb-2 pt-4">
//         <CardTitle className="text-lg font-semibold purple-text-color flex items-center">
//           <svg
//             className="mr-2"
//             width="18"
//             height="18"
//             fill="none"
//             stroke="currentColor"
//             viewBox="0 0 24 24"
//             xmlns="http://www.w3.org/2000/svg"
//           >
//             <path
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth="2"
//               d="M9 17v-6a2 2 0 012-2h2a2 2 0 012 2v6M5 17h14"
//             />
//           </svg>
//           Submission Overview
//         </CardTitle>
//       </CardHeader>
//       <CardContent className="pt-2">
//         <div className="h-64">
//           <Pie data={data} options={options} />
//         </div>
//         <div className="mt-4 flex justify-between items-center">
//           <span className="text-sm text-gray-500 flex items-center">
//             <svg
//               className="mr-2 text-purple-500"
//               width="16"
//               height="16"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//               />
//             </svg>
//             Posted: {job.postedDate}
//           </span>
//           <span
//             className={`text-sm font-medium px-2 py-1 rounded-full ${
//               job.status === "OPEN"
//                 ? "bg-green-100 text-green-800"
//                 : job.status === "HOLD"
//                 ? "bg-orange-100 text-orange-800"
//                 : "bg-gray-100 text-gray-800"
//             }`}
//           >
//             {job.status}
//           </span>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default SubmissionOverviewCard;