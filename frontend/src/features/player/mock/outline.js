/**
 * Mock course outline for the player.
 *
 * Release dates are generated relative to the moment the module is imported
 * rather than hardcoded, so the locked/available split stays meaningful however
 * long this mock lives. Hardcoded January 2026 dates would all be in the past
 * by the time anyone ran this, and nothing would ever render as locked.
 *
 * TODO: delete once GET /courses/:slug/outline exists.
 */

const DHAKA_OFFSET = '+06:00';

/**
 * ISO timestamp `days` from now, pinned to a given wall-clock hour in Dhaka.
 * @param {number} days  Negative for the past.
 * @param {number} hour  0-23, Dhaka local.
 */
function at(days, hour = 20) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(hour).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:00:00${DHAKA_OFFSET}`;
}

export const MOCK_OUTLINE = {
  courseSlug: 'fcps-p1-january-2026',
  courseTitle: 'FCPS Part-1 Foundation Batch — January 2026',
  modules: [
    {
      id: 'm1',
      title: 'Module 1: General Anatomy',
      titleBn: 'মডিউল ১: সাধারণ অ্যানাটমি',
      durationMinutes: 118,
      lessons: [
        { id: 'l1', title: '1-1 Introduction to Upper Limb', type: 'video', durationMinutes: 12, questionCount: null, completed: true, releaseAt: at(-40) },
        { id: 'l2', title: '1-2 Bones of the Upper Limb', type: 'video', durationMinutes: 18, questionCount: null, completed: true, releaseAt: at(-39) },
        { id: 'l3', title: '1-3 হিউমেরাস ও স্ক্যাপুলা', type: 'video', durationMinutes: 16, questionCount: null, completed: true, releaseAt: at(-38) },
        { id: 'l4', title: '1-4 Brachial Plexus — Roots & Trunks', type: 'video', durationMinutes: 22, questionCount: null, completed: true, releaseAt: at(-37) },
        { id: 'l5', title: '1-5 Upper Limb Lecture Sheet', type: 'pdf', durationMinutes: null, questionCount: null, completed: true, releaseAt: at(-37) },
        { id: 'l6', title: '1-6 Axilla & Its Contents', type: 'video', durationMinutes: 20, questionCount: null, completed: true, releaseAt: at(-35) },
        { id: 'l7', title: '1-7 High-yield Points — Upper Limb', type: 'text', durationMinutes: null, questionCount: null, completed: true, releaseAt: at(-35) },
        { id: 'l8', title: '1-8 Cubital Fossa ও Forearm', type: 'video', durationMinutes: 15, questionCount: null, completed: true, releaseAt: at(-33) },
        { id: 'l9', title: '1-9 Module 1 Assessment', type: 'quiz', durationMinutes: null, questionCount: 25, completed: false, releaseAt: at(-30) },
        { id: 'l10', title: '1-10 Hand — Muscles & Nerve Supply', type: 'video', durationMinutes: 15, questionCount: null, completed: false, releaseAt: at(-30) },
      ],
    },
    {
      id: 'm2',
      title: 'Module 2: General Physiology',
      titleBn: 'মডিউল ২: সাধারণ ফিজিওলজি',
      durationMinutes: 96,
      lessons: [
        { id: 'l11', title: '2-1 Cell Membrane & Transport', type: 'video', durationMinutes: 19, questionCount: null, completed: true, releaseAt: at(-28) },
        { id: 'l12', title: '2-2 রেস্টিং মেমব্রেন পোটেনশিয়াল', type: 'video', durationMinutes: 17, questionCount: null, completed: true, releaseAt: at(-27) },
        { id: 'l13', title: '2-3 Action Potential — Phases', type: 'video', durationMinutes: 21, questionCount: null, completed: true, releaseAt: at(-26) },
        { id: 'l14', title: '2-4 Physiology Lecture Sheet', type: 'pdf', durationMinutes: null, questionCount: null, completed: true, releaseAt: at(-26) },
        { id: 'l15', title: '2-5 Neuromuscular Junction', type: 'video', durationMinutes: 18, questionCount: null, completed: true, releaseAt: at(-24) },
        { id: 'l16', title: '2-6 Module 2 Assessment', type: 'quiz', durationMinutes: null, questionCount: 30, completed: true, releaseAt: at(-22) },
        { id: 'l17', title: '2-7 Muscle Contraction — Sliding Filament', type: 'video', durationMinutes: 21, questionCount: null, completed: false, releaseAt: at(-20) },
        // Deliberately locked mid-list, with released lessons after it, so the
        // "Next skips locked lessons" path is exercised rather than only the
        // trailing-lock case.
        { id: 'l18', title: '2-8 পরীক্ষার আগে দ্রুত রিভিশন', type: 'text', durationMinutes: null, questionCount: null, completed: false, releaseAt: at(1, 20) },
      ],
    },
    {
      id: 'm3',
      title: 'Module 3: Biochemistry',
      titleBn: 'মডিউল ৩: বায়োকেমিস্ট্রি',
      durationMinutes: 104,
      lessons: [
        { id: 'l19', title: '3-1 Carbohydrate Metabolism — Overview', type: 'video', durationMinutes: 20, questionCount: null, completed: false, releaseAt: at(-14) },
        { id: 'l20', title: '3-2 গ্লাইকোলাইসিস ধাপে ধাপে', type: 'video', durationMinutes: 24, questionCount: null, completed: false, releaseAt: at(-12) },
        { id: 'l21', title: '3-3 TCA Cycle & Oxidative Phosphorylation', type: 'video', durationMinutes: 26, questionCount: null, completed: false, releaseAt: at(-10) },
        { id: 'l22', title: '3-4 Biochemistry Lecture Sheet', type: 'pdf', durationMinutes: null, questionCount: null, completed: false, releaseAt: at(-10) },
        { id: 'l23', title: '3-5 Enzyme Kinetics — Km & Vmax', type: 'video', durationMinutes: 18, questionCount: null, completed: false, releaseAt: at(2, 20) },
        { id: 'l24', title: '3-6 Module 3 Assessment', type: 'quiz', durationMinutes: null, questionCount: 30, completed: false, releaseAt: at(4, 20) },
        { id: 'l25', title: '3-7 Vitamins — Deficiency Syndromes', type: 'text', durationMinutes: null, questionCount: null, completed: false, releaseAt: at(6, 20) },
      ],
    },
    {
      id: 'm4',
      title: 'Module 4: Pathology & Microbiology',
      titleBn: 'মডিউল ৪: প্যাথলজি ও মাইক্রোবায়োলজি',
      durationMinutes: 112,
      lessons: [
        { id: 'l26', title: '4-1 Cell Injury & Adaptation', type: 'video', durationMinutes: 22, questionCount: null, completed: false, releaseAt: at(9, 20) },
        { id: 'l27', title: '4-2 প্রদাহ — একিউট ও ক্রনিক', type: 'video', durationMinutes: 24, questionCount: null, completed: false, releaseAt: at(11, 20) },
        { id: 'l28', title: '4-3 Neoplasia — Basic Concepts', type: 'video', durationMinutes: 23, questionCount: null, completed: false, releaseAt: at(13, 20) },
        { id: 'l29', title: '4-4 Pathology Lecture Sheet', type: 'pdf', durationMinutes: null, questionCount: null, completed: false, releaseAt: at(13, 20) },
        { id: 'l30', title: '4-5 Bacterial Structure & Staining', type: 'video', durationMinutes: 20, questionCount: null, completed: false, releaseAt: at(16, 20) },
        { id: 'l31', title: '4-6 Sterilisation ও Disinfection', type: 'text', durationMinutes: null, questionCount: null, completed: false, releaseAt: at(18, 20) },
        { id: 'l32', title: '4-7 Final Module Assessment', type: 'quiz', durationMinutes: null, questionCount: 40, completed: false, releaseAt: at(20, 20) },
      ],
    },
  ],
};

export const MOCK_PROGRESS = {
  courseSlug: 'fcps-p1-january-2026',
  overallCompleted: 14,
  overallTotal: 32,
  moduleProgress: {
    m1: { completed: 8, total: 10 },
    m2: { completed: 6, total: 8 },
    m3: { completed: 0, total: 7 },
    m4: { completed: 0, total: 7 },
  },
};
