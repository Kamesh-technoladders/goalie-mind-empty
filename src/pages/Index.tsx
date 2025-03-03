
import { Navbar } from "@/components/navbar/Navbar";
import { Hero } from "@/components/hero/Hero";
import { FeatureSection } from "@/components/features/FeatureSection";
import { GoalCard } from "@/components/goals/GoalCard";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";

const Index = () => {
  const [isVisible, setIsVisible] = useState(true);

  // Example goals for demonstration
  const exampleGoals = [
    {
      title: "Complete Website Redesign",
      description: "Revamp the company website with modern UI and improved user experience",
      progress: 75,
      category: "Work",
      daysLeft: 14,
    },
    {
      title: "Learn Spanish",
      description: "Master conversational Spanish for upcoming trip to Barcelona",
      progress: 45,
      category: "Personal",
      daysLeft: 60,
    },
    {
      title: "Run 10K Marathon",
      description: "Train and complete the city marathon next spring",
      progress: 30,
      category: "Health",
      daysLeft: 45,
    },
    {
      title: "Launch Mobile App",
      description: "Complete development and launch the mobile companion app",
      progress: 100,
      category: "Work",
      completed: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <FeatureSection />

      {/* Example Goals Section */}
      <section className="py-20 bg-gray-50">
        <Container>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See How Goals Come to Life</h2>
            <p className="text-lg text-muted-foreground">
              Visualize and manage your objectives with our intuitive interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {exampleGoals.map((goal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <GoalCard
                  title={goal.title}
                  description={goal.description}
                  progress={goal.progress}
                  category={goal.category}
                  daysLeft={goal.daysLeft}
                  completed={goal.completed}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg">
              Create Your First Goal
            </Button>
          </div>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary/5">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Transform Your Goals into Reality?
            </h2>
            <p className="text-lg text-muted-foreground mb-10">
              Join thousands of achievers who are turning their aspirations into accomplishments every day.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Get Started for Free
            </Button>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-semibold">
                <span className="mr-1">Goal</span>
                <span className="text-primary">Symphony</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Turn ambitions into achievements
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div className="text-sm text-muted-foreground">© 2023 GoalSymphony. All rights reserved.</div>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};

export default Index;
