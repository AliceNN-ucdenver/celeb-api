export interface KnownForCredit {
  readonly title: string;
  readonly year: number;
  readonly category: 'film' | 'tv';
  readonly role?: string;
}

export interface CelebrityProfile {
  readonly id: string;
  readonly display_name: string;
  readonly summary: string;
  readonly birth_year: number | null;
  readonly death_year: number | null;
  readonly known_for: readonly KnownForCredit[];
  readonly primary_image_url: string | null;
}

interface CelebrityRecord {
  readonly id: string;
  readonly displayName: string;
  readonly summary: string;
  readonly birthYear: number | null;
  readonly deathYear: number | null;
  readonly knownFor: readonly KnownForCredit[];
  readonly identityStatus: 'confirmed' | 'ambiguous';
  readonly primaryImageUrl: string | null;
  readonly imageLicenseStatus: 'approved' | 'unknown';
  readonly internalNotes: string;
}

const RECORDS: readonly CelebrityRecord[] = [
  {
    id: 'nm0000138',
    displayName: 'Leonardo DiCaprio',
    summary: 'American actor and producer known for dramatic film performances.',
    birthYear: 1974,
    deathYear: null,
    knownFor: [
      { title: 'Titanic', year: 1997, category: 'film', role: 'Jack Dawson' },
      { title: 'Inception', year: 2010, category: 'film', role: 'Cobb' },
    ],
    identityStatus: 'confirmed',
    primaryImageUrl: null,
    imageLicenseStatus: 'unknown',
    internalNotes: 'Image suppressed until a licensed asset is approved.',
  },
  {
    id: 'nm0000199',
    displayName: 'Keanu Reeves',
    summary: 'Canadian actor recognized for action and science fiction films.',
    birthYear: 1964,
    deathYear: null,
    knownFor: [
      { title: 'The Matrix', year: 1999, category: 'film', role: 'Neo' },
      { title: 'John Wick', year: 2014, category: 'film', role: 'John Wick' },
    ],
    identityStatus: 'confirmed',
    primaryImageUrl: null,
    imageLicenseStatus: 'unknown',
    internalNotes: 'Only policy-approved fields are exposed in the public contract.',
  },
  {
    id: 'nm9999999',
    displayName: 'Chris Lee',
    summary: 'Ambiguous placeholder record retained internally for curation only.',
    birthYear: null,
    deathYear: null,
    knownFor: [],
    identityStatus: 'ambiguous',
    primaryImageUrl: 'https://cdn.example.invalid/chris-lee.jpg',
    imageLicenseStatus: 'unknown',
    internalNotes: 'Do not expose: ambiguous identity and unlicensed image.',
  },
];

function toPublicProfile(record: CelebrityRecord): CelebrityProfile {
  return {
    id: record.id,
    display_name: record.displayName,
    summary: record.summary,
    birth_year: record.birthYear,
    death_year: record.deathYear,
    known_for: record.knownFor,
    primary_image_url:
      record.imageLicenseStatus === 'approved' ? record.primaryImageUrl : null,
  };
}

export function getCelebrityProfileById(id: string): CelebrityProfile | null {
  const record = RECORDS.find((candidate) => candidate.id === id);

  if (record == null || record.identityStatus !== 'confirmed') {
    return null;
  }

  return toPublicProfile(record);
}
