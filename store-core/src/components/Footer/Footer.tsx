import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";
import { MapPin, Mail, Phone, NotepadText, Instagram, Facebook, Building2 } from "lucide-react";

const Footer: React.FC = () => {
  const footerItems = [
    { label: "Home", path: "/" },
    { label: "Collections", path: "/collections" },
    { label: "New Arrivals & News", path: "/news" },
  ];

  const footerRegs = [
    { label: "Terms of Service", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy-policy" },
    { label: "Returns & Exchanges", path: "/returns" },
    { label: "Shipping Information", path: "/shipping" },
  ];

  const socialLinks = [
    { label: "Instagram", url: "https://www.instagram.com", icon: <Instagram size={18} /> },
    { label: "Facebook", url: "https://www.facebook.com", icon: <Facebook size={18} /> },
  ];

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="container">
          <div className="duzy-text">Customer Support</div>
          <div className="spacje">
            <Building2 size={18} />
            <div>
              <strong>DEMOSHOP E-COMMERCE LTD.</strong>
              <br />
              Tax ID: 0000000000
            </div>
          </div>
          <div className="spacje">
            <MapPin size={18} />
            <div>
              100 Market Square
              <br />
              00-001 City Center
            </div>
          </div>
          <div className="spacje">
            <Mail size={18} />
            <div>support@example.com</div>
          </div>
          <div className="spacje">
            <Phone size={18} />
            <div>+1 (555) 019-2834</div>
          </div>
        </div>

        <div className="container menu-tab">
          <div className="duzy-text">Store Navigation</div>
          {footerItems.map((item) => (
            <Link key={item.path} to={item.path} className="links">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="container">
          <div className="duzy-text">Legal & Policies</div>
          {footerRegs.map((item) => (
            <div className="spacje" key={item.path}>
              <NotepadText size={18} />
              <Link to={item.path} className="links">
                {item.label}
              </Link>
            </div>
          ))}
        </div>

        <div className="container">
          <div className="duzy-text">Follow DemoShop</div>
          {socialLinks.map(({ label, url, icon }) => (
            <a
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="links"
            >
              <div className="spacje">
                {icon}
                <span>{label}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;