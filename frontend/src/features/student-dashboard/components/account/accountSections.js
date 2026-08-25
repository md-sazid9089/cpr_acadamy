/**
 * Single source of truth for the My Profile tab.
 *
 * Display order, the profile-completion calculation and the edit forms all read
 * from this list, so adding a field is a one-line change here rather than three
 * edits that can drift apart.
 *
 * `type` drives the edit control: 'text' | 'date' | 'select' | 'textarea'.
 * `optional: true` keeps a field out of the completion percentage.
 */
export const ACCOUNT_SECTIONS = [
  {
    id: 'basic',
    title: 'Basic Information',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'fatherName', label: 'Father Name', type: 'text' },
      { key: 'bmdcNo', label: 'BMDC No', type: 'text' },
      { key: 'medicalSession', label: 'Medical Session', type: 'text' },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
      {
        key: 'gender',
        label: 'Gender',
        type: 'select',
        options: ['Male', 'Female', 'Other'],
      },
      {
        key: 'bloodGroup',
        label: 'Blood Group',
        type: 'select',
        options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
    ],
  },
  {
    id: 'contact',
    title: 'Contact Information',
    fields: [
      { key: 'mobile', label: 'Mobile', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'medicalCollege', label: 'Medical College', type: 'text' },
      { key: 'facebookId', label: 'Facebook ID', type: 'text', optional: true },
    ],
  },
  {
    id: 'address',
    title: 'Address Information',
    fields: [
      { key: 'division', label: 'Division', type: 'text' },
      { key: 'district', label: 'District', type: 'text' },
      { key: 'upazila', label: 'Upazila', type: 'text' },
      { key: 'presentAddress', label: 'Present Address', type: 'textarea' },
    ],
  },
];

/**
 * Percentage of required fields that carry a value, plus the labels of those
 * that do not — the figure shown on the completion bar.
 *
 * @param {object} profile
 * @returns {{ percent: number, missing: string[] }}
 */
export function getProfileCompletion(profile) {
  if (!profile) return { percent: 0, missing: [] };

  const required = ACCOUNT_SECTIONS.flatMap((section) =>
    section.fields
      .filter((field) => !field.optional)
      .map((field) => ({ ...field, sectionId: section.id })),
  );

  const missing = required.filter((field) => {
    const value = profile[field.sectionId]?.[field.key];
    return value == null || String(value).trim() === '';
  });

  const filled = required.length - missing.length;
  return {
    percent: required.length ? Math.round((filled / required.length) * 100) : 100,
    missing: missing.map((field) => field.label),
  };
}
