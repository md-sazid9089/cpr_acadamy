import Hero from './components/Hero.jsx';
import ValueProps from './components/ValueProps.jsx';
import FeaturedCourses from './components/FeaturedCourses.jsx';
import TrackPromos from './components/TrackPromos.jsx';
import Testimonials from './components/Testimonials.jsx';
import FaqSection from './components/FaqSection.jsx';

/** Public homepage: hero → value props → featured batches → track promos → testimonials → FAQ. */
export default function Home() {
  return (
    <>
      <Hero />
      <ValueProps />
      <FeaturedCourses />
      <TrackPromos />
      <Testimonials />
      <FaqSection />
    </>
  );
}
