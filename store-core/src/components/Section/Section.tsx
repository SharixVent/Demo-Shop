// src/components/Section/Section.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import "./Section.css";

export interface HomeSectionProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  reverse: boolean;
  buttonText?: string;
  buttonLink?: string;
}

const HomeSection: React.FC<HomeSectionProps> = ({
  title,
  subtitle,
  imageUrl,
  reverse,
  buttonText,
  buttonLink,
}) => {
  const navigate = useNavigate();
  const formattedTitle = (title || "").replace(/\\n/g, "\n");
  const formattedSubtitle = (subtitle || "").replace(/\\n/g, "\n");

  return (
    <section className={`home-section ${reverse ? "reverse" : ""}`}>
      <div className="section-container">
        <div className="section-image-box">
          <img src={imageUrl} alt={formattedTitle} className="section-img-element" loading="lazy" />
        </div>
        <div className="content">
          <span className="section-eyebrow">FEATURED COLLECTION</span>
          <h2 className="section-title" style={{ whiteSpace: "pre-line" }}>
            {formattedTitle}
          </h2>
          <p className="section-subtitle" style={{ whiteSpace: "pre-line" }}>
            {formattedSubtitle}
          </p>
          {buttonText && buttonLink && (
            <button
              className="section-button"
              type="button"
              onClick={() => navigate(buttonLink)}
            >
              {buttonText} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeSection;