import Hero from './components/Hero.jsx';
import ValueProps from './components/ValueProps.jsx';
import CourseSpotlight from './components/CourseSpotlight.jsx';
import FeaturedCourses from './components/FeaturedCourses.jsx';
import TrackPromos from './components/TrackPromos.jsx';
import Testimonials from './components/Testimonials.jsx';
import CtaBanner from './components/CtaBanner.jsx';

/**
 * Content for the spotlight band. Kept here rather than inside the component so
 * the same section can front a different exam later — swap this object, or map
 * over several of them.
 *
 * TODO: source from the offers endpoint once the backend exists, and drop the
 * real cutout portrait at `public/assets/spotlight/doctor.png`.
 */
const FCPS_SPOTLIGHT = {
  titleLine1: 'FCPS Part-1 | Residency',
  titleLine2: 'Offline Combined Batch',
  subtitle: 'Structured classroom teaching — Chattogram campus',
  checklistItems: [
    'Medicine & Allied',
    'Surgery & Allied',
    'Paediatrics & Allied',
    'Gynae & Allied',
    'Radiology',
    'Dermatology',
  ],
  price: 13500,
  currency: '৳',
  offerNote: 'Limited time offer',
  enrollHref: '/courses/fcps',
  imageSrc: '/assets/spotlight/profilea.png',
  // Decorative: the batch details are all in the adjacent copy, so an empty
  // alt keeps screen readers from announcing a redundant image.
  imageAlt: '',
};

/** Public homepage: hero → value props → spotlight → course grid → social proof → CTA. */
export default function Home() {
  return (
    <>
      <Hero />
      <ValueProps />
      <CourseSpotlight {...FCPS_SPOTLIGHT} />
      <FeaturedCourses />
      <TrackPromos />
      <Testimonials />
      <CtaBanner />
    </>
  );
}
