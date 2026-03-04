import * as React from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {}

function Breadcrumb({ className, children, ...props }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" {...props}>
      <ol className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        {children}
      </ol>
    </nav>
  );
}

interface BreadcrumbItemProps {
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

function BreadcrumbItem({ href, active, children, className }: BreadcrumbItemProps) {
  if (active) {
    return (
      <li className={cn("text-foreground font-medium", className)} aria-current="page">
        {children}
      </li>
    );
  }

  return (
    <li className={className}>
      {href ? (
        <Link to={href} className="hover:text-primary transition-colors">
          {children}
        </Link>
      ) : (
        <span>{children}</span>
      )}
    </li>
  );
}

function BreadcrumbSeparator({ className }: { className?: string }) {
  return (
    <li role="presentation" aria-hidden="true" className={className}>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
    </li>
  );
}

export { Breadcrumb, BreadcrumbItem, BreadcrumbSeparator };
