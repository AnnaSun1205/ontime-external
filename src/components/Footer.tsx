import { Link } from "react-router-dom";
import { Logo } from "./Logo";
export function Footer() {
  return <footer className="border-t border-border bg-white">
      <div className="container py-12 border-primary-foreground">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo size="sm" />
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </nav>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} OnTime. All rights reserved.
        </div>
      </div>
    </footer>;
}