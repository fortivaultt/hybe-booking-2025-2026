import { useState } from "react";

const HybeFooter = () => {
  const [selectedPrivacyPolicy, setSelectedPrivacyPolicy] = useState("");

  const privacyPolicyOptions = [
    {
      value: "https://hybeinsight.com/policy/privacy?locale=en",
      label: "HYBE INSIGHT",
    },
    {
      value: "https://hybe.career.greetinghr.com/privacypolicy",
      label: "HYBE CAREERS",
    },
  ];

  const subsidiaryCompanies = [
    { name: "Big Hit Music", href: "https://ibighit.com", external: true },
    {
      name: "SOURCE MUSIC",
      href: "https://www.sourcemusic.com",
      external: true,
    },
    {
      name: "PLEDIS ENTERTAINMENT",
      href: "http://www.pledis.co.kr",
      external: true,
    },
    { name: "WEVERSE COMPANY", href: "https://benx.co", external: true },
    { name: "HYBE 360", href: "", external: false },
    { name: "HYBE EDU", href: "", external: false },
    { name: "HYBE IPX", href: "", external: false },
    { name: "SUPERB", href: "https://www.superbcorp.com", external: true },
  ];

  const handlePrivacyPolicyChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const value = e.target.value;
    setSelectedPrivacyPolicy(value);
    if (value) {
      window.open(value, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <footer className="footer bg-white text-gray-900 py-6 sm:py-8 border-t border-gray-200">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center space-y-6">
          {/* Copyright */}
          <p className="copy text-sm text-gray-600 font-medium">
            © HYBE. All Rights Reserved
          </p>

          {/* Footer Navigation */}
          <ul className="fnb flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm">
            <li>
              <a
                href="/eng/cookie"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-150"
                rel="nosublink"
              >
                Cookie Policy
              </a>
            </li>
            <li>
              <div className="footer_select_box">
                <select
                  name="privacy-policy"
                  id="footer-privacy-select"
                  value={selectedPrivacyPolicy}
                  onChange={handlePrivacyPolicyChange}
                  className="text-gray-600 hover:text-gray-900 bg-transparent border border-gray-300 rounded px-2 py-1 outline-none cursor-pointer transition-colors duration-150"
                >
                  <option value="" disabled>
                    Privacy & Policy
                  </option>
                  {privacyPolicyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </li>
            <li>
              <a
                href="https://www.redwhistle.org/report/reportCheck.asp?organ=8230&leng=EN"
                className="view_site text-gray-600 hover:text-gray-900 transition-colors duration-150"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>HYBE Whistleblowing Center</span>
              </a>
            </li>
            <li>
              <a
                href="/eng/related/site"
                className="view_site text-gray-600 hover:text-gray-900 transition-colors duration-150"
                rel="nosublink"
              >
                <span>Related Link</span>
              </a>
            </li>
          </ul>

          {/* Subsidiary Companies */}
          <div className="w-full">
            <h4 className="text-center text-sm font-medium text-gray-700 mb-4">
              HYBE Family Companies
            </h4>
            <ul className="site_list grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 text-center">
              {subsidiaryCompanies.map((company) => (
                <li key={company.name}>
                  {company.href && company.external ? (
                    <a
                      href={company.href}
                      target="_blank"
                      rel="nosublink noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150 block py-1"
                    >
                      {company.name}
                    </a>
                  ) : company.href ? (
                    <a
                      href={company.href}
                      rel="nosublink"
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-150 block py-1"
                    >
                      {company.name}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-600 block py-1">
                      {company.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Info */}
          <div className="text-center space-y-2">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
              <span>Seoul, South Korea</span>
              <span>•</span>
              <span>Official HYBE Corporation Website</span>
              <span>•</span>
              <span>Leading Global Entertainment Company</span>
            </div>
            <div className="text-xs text-gray-400">
              Home to BTS, BLACKPINK, NewJeans, LE SSERAFIM, SEVENTEEN, TWICE,
              Stray Kids, and more
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HybeFooter;
