import type { ReactNode } from "react";
import { Link } from "react-router";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
            givy
          </Link>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  size?: "sm" | "base" | "lg";
}

export function Breadcrumb({ items, size = "sm" }: BreadcrumbProps) {
  const textSize = size === "lg" ? "text-lg" : size === "base" ? "text-base" : "text-sm";
  return (
    <nav className={`flex items-center gap-1 ${textSize}`}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-400">/</span>}
          {item.href ? (
            <Link to={item.href} className="text-blue-600 hover:underline">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
