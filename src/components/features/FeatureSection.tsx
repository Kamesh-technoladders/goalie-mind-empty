
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { BarChart, Goal, LineChart, Target } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}

function FeatureCard({ title, description, icon, index }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        "relative p-6 sm:p-8 rounded-2xl overflow-hidden transition-all bg-white border",
        "hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      )}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-16 -translate-y-16" />
      
      <div className="relative z-10">
        <div className="w-12 h-12 mb-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-3">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export function FeatureSection() {
  const features = [
    {
      title: "Intuitive Goal Setting",
      description: "Create structured, achievable goals with customizable timeframes and milestones.",
      icon: <Goal className="w-6 h-6" />,
    },
    {
      title: "Progress Visualization",
      description: "Track your journey with beautiful charts and progress indicators that keep you motivated.",
      icon: <LineChart className="w-6 h-6" />,
    },
    {
      title: "Achievement Analytics",
      description: "Gain insights into your productivity patterns and accomplishment trends.",
      icon: <BarChart className="w-6 h-6" />,
    },
    {
      title: "Focus Management",
      description: "Prioritize your goals and maintain clarity on what matters most to your success.",
      icon: <Target className="w-6 h-6" />,
    },
  ];

  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white to-blue-50/50 -z-10" />
      
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Tools for Meaningful Progress</h2>
          <p className="text-lg text-muted-foreground">
            Our carefully crafted features help you transform aspirations into tangible achievements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              index={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
