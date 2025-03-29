
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-white border-t border-border py-8">
      <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
        <p>© 2025 PrecisionNote Inc. All rights reserved.</p>
        <Link to="/" className="inline-block mt-4">
          <Button variant="ghost" size="sm">
            Back to Home
          </Button>
        </Link>
      </div>
    </footer>
  );
}
