"use client";

import { useTransition } from "@/components/public/TransitionProvider";

type Social = { id: string; label: string; url: string };

export function SiteFooter({
  brand,
  footerText,
  socials,
  year,
}: {
  brand: string;
  footerText: string;
  socials: Social[];
  year: string;
}) {
  const { navigate } = useTransition();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="footer-monogram">TG</span>
            <span className="footer-brand-name">{brand}</span>
            <span className="label-light">— DESIGN. CODE. EXPERIENCE.</span>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            <button className="footer-link" onClick={() => navigate("/work")}>WORK</button>
            <button className="footer-link" onClick={() => navigate("/about")}>ABOUT</button>
            <button className="footer-link" onClick={() => navigate("/contact")}>CONTACT</button>
          </nav>
        </div>

        <div className="hairline" />

        <div className="footer-bottom">
          <span className="label-light">© {year} {brand}</span>
          <div className="footer-socials">
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="footer-social"
              >
                {s.label}
              </a>
            ))}
          </div>
          <span className="label-light">{footerText}</span>
        </div>
      </div>
    </footer>
  );
}