
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-4 transition-all duration-300",
        scrolled
          ? "bg-white/80 backdrop-blur-sm border-b shadow-sm"
          : "bg-transparent"
      )}
    >
      <Container>
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="text-xl font-semibold tracking-tight transition-colors hover:text-primary"
          >
            <span className="mr-1">Goal</span>
            <span className="text-primary">Symphony</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/features">Features</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              className="hidden md:inline-flex transition-all hover:text-primary"
              asChild
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              className="relative overflow-hidden group"
              asChild
            >
              <Link to="/register">
                <span className="relative z-10">Get Started</span>
                <span className="absolute inset-0 bg-primary group-hover:bg-primary/90 transition-colors duration-300"></span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
}

function NavLink({ to, children }: NavLinkProps) {
  return (
    <Link
      to={to}
      className="relative text-foreground/80 hover:text-foreground transition-colors duration-200 font-medium"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
      </span>
    </Link>
  );
}
