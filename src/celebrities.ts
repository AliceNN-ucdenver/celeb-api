export interface CelebrityRecord {
  readonly id: string;
  readonly displayName: string;
  readonly summary: string;
  readonly knownFor: readonly string[];
  readonly profileImageUrl: string | null;
  readonly identityVerified: boolean;
  readonly imageLicensed: boolean;
}

export interface CelebrityProfile {
  readonly id: string;
  readonly display_name: string;
  readonly summary: string;
  readonly known_for: readonly string[];
  readonly profile_image_url: string | null;
}

const celebrityRecords: Readonly<Record<string, CelebrityRecord>> = {
  nm0000138: {
    id: 'nm0000138',
    displayName: 'Leonardo DiCaprio',
    summary: 'Academy Award-winning actor and producer known for dramatic lead performances.',
    knownFor: ['Titanic', 'Inception', 'The Revenant'],
    profileImageUrl: null,
    identityVerified: true,
    imageLicensed: false,
  },
  nm0000199: {
    id: 'nm0000199',
    displayName: 'Keanu Reeves',
    summary: 'Actor recognized for action, science fiction, and character-driven performances.',
    knownFor: ['The Matrix', 'Speed', 'John Wick'],
    profileImageUrl: null,
    identityVerified: true,
    imageLicensed: false,
  },
};

export function getCelebrityRecord(id: string): CelebrityRecord | null {
  return celebrityRecords[id] ?? null;
}

export function toCelebrityProfile(record: CelebrityRecord): CelebrityProfile | null {
  if (!record.identityVerified) {
    return null;
  }

  return {
    id: record.id,
    display_name: record.displayName,
    summary: record.summary,
    known_for: [...record.knownFor],
    profile_image_url: record.imageLicensed ? record.profileImageUrl : null,
  };
}
