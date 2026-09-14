import Hero from './components/Hero.jsx';
import FeaturedCourses from './components/FeaturedCourses.jsx';
import TrackPromos from './components/TrackPromos.jsx';
import Testimonials from './components/Testimonials.jsx';
import SuccessCollage from './components/SuccessCollage.jsx';
import FaqSection from './components/FaqSection.jsx';

/** Public homepage: hero → value props → featured batches → track promos → testimonials → success collage → FAQ. */
export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedCourses />
      <TrackPromos />
      <Testimonials />
      <SuccessCollage />
      <FaqSection />
    </>
  );
}
