type StoredCelebProfile = {
  displayName: string;
  shortBiography: string;
  knownFor: Array<{
    titleId: string;
    title: string;
    year: number;
    role: string;
  }>;
  heroImagePath: string;
  editorialHighlights: string[];
  profileLastUpdated: string;
};

const celebProfiles = new Map<string, StoredCelebProfile>([
  [
    'celeb-tom-hanks',
    {
      displayName: 'Tom Hanks',
      shortBiography:
        'Acclaimed actor and filmmaker known for dramatic, comedic, and family roles across four decades of film.',
      knownFor: [
        { titleId: 'tt0109830', title: 'Forrest Gump', year: 1994, role: 'Actor' },
        { titleId: 'tt0120815', title: 'Saving Private Ryan', year: 1998, role: 'Actor' },
        { titleId: 'tt0114709', title: 'Toy Story', year: 1995, role: 'Voice Actor' },
      ],
      heroImagePath: 'celebs/celeb-tom-hanks.webp',
      editorialHighlights: ['Academy Award winner', 'Producer', 'Director'],
      profileLastUpdated: '2026-05-29',
    },
  ],
  [
    'celeb-sigourney-weaver',
    {
      displayName: 'Sigourney Weaver',
      shortBiography:
        'Award-winning performer recognized for science-fiction, drama, and genre-defining lead roles.',
      knownFor: [
        { titleId: 'tt0078748', title: 'Alien', year: 1979, role: 'Actor' },
        { titleId: 'tt0499549', title: 'Avatar', year: 2009, role: 'Actor' },
        { titleId: 'tt0090605', title: 'Aliens', year: 1986, role: 'Actor' },
      ],
      heroImagePath: 'celebs/celeb-sigourney-weaver.webp',
      editorialHighlights: ['Golden Globe winner', 'Sci-fi icon', 'Producer'],
      profileLastUpdated: '2026-05-29',
    },
  ],
]);

export { celebProfiles };
export type { StoredCelebProfile };
