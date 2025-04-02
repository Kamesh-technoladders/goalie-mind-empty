import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface SummaryModalProps {
  analysisData: {
    overall_score: number;
    skills_score: number;
    skills_summary: string;
    work_experience_score: number;
    work_experience_summary: string;
    education_score: number;
    education_summary: string;
    projects_score: number;
    projects_summary: string;
  };
  onClose: () => void;
}

const SummaryModal: React.FC<SummaryModalProps> = ({ analysisData, onClose }) => {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-5xl rounded-xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Resume Analysis</DialogTitle>
        </DialogHeader>

        {/* Overall Score */}
        <div className="bg-purple-100 text-purple-700 font-semibold p-4 rounded-lg flex justify-between items-center">
          <span>Overall Score</span>
          <span className="text-xl">{analysisData.overall_score}%</span>
        </div>

        {/* Grid Layout for Sections */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Skills Match */}
          <div className="border border-purple-300 p-4 rounded-lg">
            <h3 className="font-medium">Skills Match</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score: {analysisData.skills_score}%</span>
            </div>
            <p className="text-sm text-gray-800 mt-1">{analysisData.skills_summary}</p>
          </div>

          {/* Experience Relevance */}
          <div className="border border-purple-300 p-4 rounded-lg">
            <h3 className="font-medium">Experience Relevance</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score: {analysisData.work_experience_score}%</span>
            </div>
            <p className="text-sm text-gray-800 mt-1">{analysisData.work_experience_summary}</p>
          </div>

          {/* Education */}
          <div className="border border-purple-300 p-4 rounded-lg">
            <h3 className="font-medium">Education</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score: {analysisData.education_score}%</span>
            </div>
            <p className="text-sm text-gray-800 mt-1">{analysisData.education_summary}</p>
          </div>

          {/* Projects */}
          <div className="border border-purple-300 p-4 rounded-lg">
            <h3 className="font-medium">Projects</h3>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Score: {analysisData.projects_score}%</span>
            </div>
            <p className="text-sm text-gray-800 mt-1">{analysisData.projects_summary}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SummaryModal;
