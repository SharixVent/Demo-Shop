import React, { useEffect, useState } from "react";
import { RecordModel } from "pocketbase";
import { useNavigate } from "react-router-dom";
import HomeSection, { HomeSectionProps } from "../Section/Section";
import Loader from "../Loader/Loader";
import pb from "../../api/pocketbase";
import "./HomePage.css";

interface SectionRecord extends RecordModel {
  order: number;
  title: string;
  subtitle: string;
  image_path: string;
  button_text?: string;
  button_url?: string;
}

const HomePage: React.FC = () => {
  const [sections, setSections] = useState<(HomeSectionProps & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "DemoShop — Official Online Store | Modern Apparel & Essentials";

    pb.collection("sections")
      .getFullList<SectionRecord>({ sort: "order" })
      .then((data) => {
        const mapped = data.map((s, i) => {
          const imageUrl = pb.files.getURL(s, s.image_path);
          return {
            id: s.id,
            title: s.title,
            subtitle: s.subtitle,
            imageUrl: imageUrl,
            reverse: i % 2 === 1,
            buttonText: s.button_text || "Explore Collection",
            buttonLink: s.button_url || "/collections",
          };
        });

        mapped.forEach((sec) => {
          const img = new Image();
          img.src = sec.imageUrl;
        });

        setSections(mapped);
      })
      .catch((err) => console.error("Failed to load sections from PocketBase:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="home-wrapper">
      {/* Default SEO Hero Header if no sections or above sections */}
      <section className="hero-store-intro">
        <div className="hero-store-badge">NEW SEASON ARRIVALS</div>
        <h1>Timeless Style & Everyday Comfort at DemoShop</h1>
        <p>
          Explore our curated collections crafted from premium fabrics. Fast courier delivery, easy 30-day returns, and verified quality.
        </p>
        <div className="hero-cta-group">
          <button type="button" className="hero-btn-primary" onClick={() => navigate("/collections")}>
            Shop Catalog
          </button>
          <button type="button" className="hero-btn-outline" onClick={() => navigate("/news")}>
            Read Store News
          </button>
        </div>
      </section>

      <div style={{ maxWidth: "1440px", margin: "0 auto", width: "100%" }}>
        {sections.map((sec) => (
          <HomeSection
            key={sec.id}
            title={sec.title}
            subtitle={sec.subtitle}
            imageUrl={sec.imageUrl}
            reverse={sec.reverse}
            buttonText={sec.buttonText}
            buttonLink={sec.buttonLink}
          />
        ))}
      </div>
    </div>
  );
};

export default HomePage;