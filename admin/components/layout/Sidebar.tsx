"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Tag, Image, Palette, FileText, Percent, Users, ShoppingCart, PackageOpen, Layers, Wrench } from "lucide-react";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/categories", label: "Catégories", icon: Tag },
  { href: "/colors", label: "Couleurs", icon: Palette },
  { href: "/stock", label: "Stock", icon: PackageOpen },
  { href: "/styles", label: "Styles", icon: Tag },
  { href: "/heroSlide", label: "Hero Slides", icon: Layers },
  { href: "/blog", label: "Blogs", icon: FileText },
  { href: "/promotions", label: "Promotions", icon: Percent },
  { href: "/client", label: "Clients", icon: Users },
  { href: "/commande", label: "Commandes", icon: ShoppingCart },
  { href: "/oopus-tools", label: "Utilitaires Oopus", icon: Wrench },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-semibold tracking-tight text-gray-900">
          Kort <span className="text-amber-600">Admin</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-amber-50 text-amber-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 text-xs text-gray-400">
        Kort Interiors © {new Date().getFullYear()}
      </div>
    </aside>
  );
}
