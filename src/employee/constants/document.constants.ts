export const DOCUMENT_DEFINITIONS = {
  PROFILE_PHOTO: {
    name: 'Profile Photo',
    type: 'Profile',
  },

  AADHAAR: {
    name: 'Aadhaar Card',
    type: 'Identity',
  },

  PAN: {
    name: 'PAN Card',
    type: 'Identity',
  },

  DRIVING_LICENSE: {
    name: 'Driving License',
    type: 'Identity',
  },

  TENTH: {
    name: '10th Certificate',
    type: 'Education',
  },

  INTERMEDIATE: {
    name: 'Intermediate Certificate',
    type: 'Education',
  },

  DIPLOMA: {
    name: 'Diploma Certificate',
    type: 'Education',
  },

  DEGREE: {
    name: 'B.Tech / Degree Certificate',
    type: 'Education',
  },

  PG: {
    name: 'PG Certificate',
    type: 'Education',
  },

  EXPERIENCE: {
    name: 'Experience Letter',
    type: 'Experience',
  },

  RESUME: {
    name: 'Resume',
    type: 'Resume',
  },
} as const;

export type DocumentKey = keyof typeof DOCUMENT_DEFINITIONS;
