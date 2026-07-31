import LuxuryNavbar from "../components/home/LuxuryNavbar";
import HeroSection from "../components/home/HeroSection";
import CategoryTiles from "../components/home/CategoryTiles";
import OffresSection from "../components/home/OffresSection";
import EditorialSection from "../components/home/EditorialSection";
import VideoSection from "../components/home/VideoSection";
import BlogSection from "../components/home/BlogSection";
import SocialSection from "../components/home/SocialSection";
import NewsletterSection from "../components/home/NewsletterSection";
import SiteFooter from "../components/home/SiteFooter";
import PromoModal from "../components/home/PromoModal";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
      <LuxuryNavbar />
      <HeroSection />
      <CategoryTiles />
      <OffresSection />
      <EditorialSection />
      <VideoSection />
      <BlogSection />
      <SocialSection />
      <NewsletterSection />
      <SiteFooter />
      <PromoModal />
    </div>
  );
}
