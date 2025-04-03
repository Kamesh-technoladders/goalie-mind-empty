import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";

interface ValidateResumeButtonProps {
  isValidated: boolean;
  candidateId: number;
  onValidate: (candidateId: number, userId?: string) => void;
  isLoading?: boolean;
  overallScore?: number; // Score out of 100
}

const ValidateResumeButton = ({
  isValidated,
  candidateId,
  onValidate,
  isLoading,
  overallScore,
}: ValidateResumeButtonProps) => {
  const user = useSelector((state: any) => state.auth.user);
  const userId = user?.id || null;

  return (
    <Button
      variant={isValidated ? "outline" : "default"}
      size="sm"
      onClick={() => !isValidated && onValidate(candidateId, userId)}
      disabled={isValidated || isLoading}
      className={cn(
        isValidated && overallScore !== undefined && "bg-green-100 text-green-800 border-green-300",
        isValidated && overallScore === undefined && "text-gray-600 border-gray-300"
      )}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isValidated ? (
        <>
          {/* <CheckCircle2 className="h-4 w-4 mr-1" /> */}
          {overallScore !== undefined ? (
            <span>{overallScore} / 100</span> // Display score as is, out of 100
          ) : (
            "Validated"
          )}
        </>
      ) : (
        "Validate"
      )}
    </Button>
  );
};

export default ValidateResumeButton;