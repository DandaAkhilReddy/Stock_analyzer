import { MeshGradientBackground } from "./MeshGradientBackground";
import { FloatingElements } from "./FloatingElements";
import { DotGrid } from "./DotGrid";
import { HeroTitle } from "./HeroTitle";
import { HeroSearchBar } from "./HeroSearchBar";

export function LandingHero(): JSX.Element {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-72px)]">
      {/* Animated mesh gradient background */}
      <MeshGradientBackground />

      {/* Floating 3D elements layer */}
      <FloatingElements />

      {/* Dot grid overlay */}
      <DotGrid />

      {/* Hero content (above all layers) */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-4">
        <HeroTitle />
        <HeroSearchBar />
      </div>
    </div>
  );
}
