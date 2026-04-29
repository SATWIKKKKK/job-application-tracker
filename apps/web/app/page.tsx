import { Footer, NavBar } from '../components/site-chrome';
import { LandingPage } from '../components/landing';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <NavBar />
      <LandingPage />
      <Footer />
    </div>
  );
}
