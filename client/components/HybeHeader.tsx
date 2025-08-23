import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const HybeHeader = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const { pathname } = useLocation();

  const navigation = [
    {
      title: "COMPANY",
      items: [
        { label: "Company Info.", href: "/company/info" },
        { label: "Artist", href: "/company/artist" },
        { label: "Business", href: "/company/business" },
        { label: "Ethical Management", href: "/company/ethical" },
      ],
    },
    {
      title: "INVESTORS",
      items: [
        { label: "Sustainability Management", href: "/ir/esg" },
        { label: "Corporate Governance", href: "/ir/structure" },
        { label: "Announcement", href: "/ir/announce" },
        { label: "Public Disclosure Info.", href: "/ir/official" },
        { label: "Financial Info.", href: "/ir/finance" },
        { label: "Stock Info.", href: "/ir/share" },
        { label: "IR Event Schedule", href: "/ir/event" },
        { label: "IR Data Room", href: "/ir/archive" },
      ],
    },
    {
      title: "NEWSROOM",
      items: [
        { label: "Announcement", href: "/news/announcements" },
        { label: "Press", href: "/news/news" },
        { label: "Notice", href: "/news/notice" },
      ],
    },
    {
      title: "CAREERS",
      items: [
        {
          label: "Apply",
          href: "https://careers.hybecorp.com/?locale=en_US",
          external: true,
        },
        { label: "HYBE DNA", href: "/career/crew" },
      ],
    },
  ];

  const languages = [
    { code: "ENG", href: "/", active: true },
    { code: "KOR", href: "/kor/main" },
    { code: "CHN", href: "/chn/main" },
    { code: "JPN", href: "/jpn/main" },
  ];

  return (
    <header className="header bg-white text-gray-900 relative z-50">
      {/* Desktop Header */}
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <h1 className="logo">
          <Link
            to="/"
            className="flex items-center text-black text-xl font-bold"
          >
            <img
              src="/images/common/logo-b.svg"
              alt="HYBE"
              className="h-8 w-auto mr-2"
            />
            HYBE
          </Link>
        </h1>

        {/* Desktop Navigation */}
        <nav className="nav hidden lg:flex items-center space-x-8">
          <ul className="gnb flex items-center space-x-8">
            {navigation.map((item) => {
              const isCategoryActive = pathname.startsWith(
                `/${item.title.toLowerCase()}`,
              );
              return (
                <li
                  key={item.title}
                  className="relative group"
                  onMouseEnter={() => setActiveDropdown(item.title)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <span
                    className={`font-medium transition-colors duration-200 cursor-pointer ${
                      isCategoryActive
                        ? "text-purple-600"
                        : "text-gray-900 hover:text-gray-600"
                    }`}
                  >
                    {item.title}
                  </span>

                  {/* Dropdown Menu */}
                  <ul
                    className={`menu absolute top-full left-0 mt-2 w-64 bg-white shadow-lg border border-gray-200 rounded-lg py-2 transform transition-all duration-200 ${
                      activeDropdown === item.title
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-2"
                    }`}
                  >
                    {item.items.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          to={subItem.href}
                          target={subItem.external ? "_blank" : undefined}
                          rel={
                            subItem.external
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className={`block px-4 py-2 text-sm transition-colors duration-150 ${
                            pathname === subItem.href
                              ? "text-purple-600 bg-purple-50 font-semibold"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}
          </ul>

          {/* Language Selector */}
          <aside className="lang relative group">
            <div className="active cursor-pointer">
              <span className="text-gray-900 font-medium">ENG</span>
            </div>
            <ul className="absolute top-full left-0 mt-2 w-16 bg-white shadow-lg border border-gray-200 rounded-lg py-2 transform transition-all duration-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible">
              {languages.map((lang) => (
                <li key={lang.code}>
                  <Link
                    to={lang.href}
                    className={`block px-3 py-1 text-sm transition-colors duration-150 ${
                      pathname === lang.href
                        ? "text-purple-600 font-medium"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {lang.code}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <nav className="nav_mobile lg:hidden bg-white border-t border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="lnb space-y-4">
              {navigation.map((item) => (
                <div key={item.title}>
                  <span className="block text-gray-900 font-medium text-lg py-2">
                    {item.title}
                  </span>
                  <ul className="list ml-4 space-y-2">
                    {item.items.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          to={subItem.href}
                          target={subItem.external ? "_blank" : undefined}
                          rel={
                            subItem.external
                              ? "noopener noreferrer"
                              : undefined
                          }
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block py-1 transition-colors duration-150 ${
                            pathname === subItem.href
                              ? "text-purple-600 font-semibold"
                              : "text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Mobile Language Selector */}
              <div className="border-t border-gray-200 pt-4">
                <div className="lang grid grid-cols-4 gap-2">
                  {languages.map((lang) => (
                    <Link
                      key={lang.code}
                      to={lang.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`text-center py-2 px-3 rounded transition-colors duration-150 ${
                        pathname === lang.href
                          ? "bg-purple-100 text-purple-600 font-medium"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {lang.code}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};

export default HybeHeader;
