
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GoalCardProps {
  title: string;
  description: string;
  progress: number;
  category: string;
  daysLeft?: number;
  completed?: boolean;
  className?: string;
}

export function GoalCard({
  title,
  description,
  progress,
  category,
  daysLeft,
  completed = false,
  className,
}: GoalCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm transition-all",
        completed && "bg-primary/5 border-primary/20",
        className
      )}
    >
      <div className="mb-2">
        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
          {category}
        </span>
        {completed && (
          <span className="ml-2 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        )}
      </div>
      
      <h3 className="text-lg font-semibold mb-1 line-clamp-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>
      
      <div className="mb-1 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Progress</span>
        <span className="text-sm font-medium">{progress}%</span>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      {!completed && daysLeft !== undefined && (
        <div className="mt-4 text-sm text-muted-foreground">
          {daysLeft > 0 ? (
            <span>{daysLeft} days left</span>
          ) : (
            <span className="text-amber-600 font-medium">Due today</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
