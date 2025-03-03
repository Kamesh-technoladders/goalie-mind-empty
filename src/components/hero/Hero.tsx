
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export function Hero() {
  return (
    <div className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent -z-10" />
      
      {/* Abstract shapes */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-1/3 -left-20 w-72 h-72 bg-indigo-100/40 rounded-full blur-3xl -z-10" />
      
      <Container className="z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-3 py-1 mb-6 text-xs font-medium text-primary bg-primary/10 rounded-full">
              Redefine Your Potential
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
          >
            Transform Your Goals into{" "}
            <span className="text-primary">Achievements</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto"
          >
            Set meaningful goals, track your progress, and celebrate your victories with our intuitive goal-tracking platform designed for ambitious achievers.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" asChild>
              <Link to="/register">
                Get Started — It's Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/demo">
                Watch Demo
              </Link>
            </Button>
          </motion.div>
        </div>

        {/* Hero Image */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 md:mt-24 relative mx-auto max-w-4xl"
        >
          <div className="relative rounded-2xl overflow-hidden border shadow-xl bg-white/80 backdrop-blur-sm">
            <div className="aspect-[16/9]">
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-blue-50 flex items-center justify-center">
                <div className="text-xl text-gray-400 font-light">Dashboard Preview</div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent pointer-events-none"></div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
