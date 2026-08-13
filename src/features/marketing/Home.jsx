import Hero from './components/Hero.jsx';
import FeaturedCourses from './components/FeaturedCourses.jsx';
import WhyChooseUs from './components/WhyChooseUs.jsx';
import Testimonials from './components/Testimonials.jsx';
import CtaBanner from './components/CtaBanner.jsx';

/** Public homepage: hero → category pills + course grid → trust → social proof → CTA. */
export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedCourses />
      <WhyChooseUs />
      <Testimonials />
      <CtaBanner />
    </>
  );
}
