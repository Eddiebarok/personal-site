/*
 * Project data — Edward de Jong
 *
 * To update a project:
 *   1. Find the matching object below
 *   2. Edit the fields directly
 *   3. For images: drop files into /images/ and set imageSrc / stills
 *
 * To add a project:
 *   1. Copy an existing object
 *   2. Add it to the PROJECTS array (newest first)
 *   3. Create a corresponding entry in work.html or update the slug-based routing
 */

const PROJECTS = [
  {
    title: "Los",
    year: null,
    category: "fiction",
    slug: "los",
    preProduction: true,
    logline: "[Logline — to be written.]",
    synopsis: "[Synopsis — to be written.]",
    production: "[Production company placeholder]",
    duration: null,
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer",   name: "Edward de Jong" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 0
  },
  {
    title: "De Sketches van Myrte Siebinga",
    year: 2024,
    category: "other",
    slug: "myrte-siebinga",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences about the project's story and themes.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "[Placeholder]" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Niks Gebeurd",
    year: 2023,
    category: "fiction",
    slug: "niks-gebeurd",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences about the film's story and themes.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [
      "Keep an Eye Filmacademie Festival, 2023 — Premiere"
    ],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "[Placeholder]" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Turks Fruit — Parodie",
    year: 2023,
    category: "other",
    slug: "turks-fruit",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "[Placeholder]" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Dat Kan!",
    year: 2023,
    category: "commercial",
    slug: "dat-kan",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Agency", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Suni",
    year: 2022,
    category: "fiction",
    slug: "suni",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences about the film's story and themes.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [
      "Nederlands Film Festival, 2022 — Premiere",
      "[Theatrical release — add details]"
    ],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "[Placeholder]" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Per Persoon",
    year: 2022,
    category: "fiction",
    slug: "per-persoon",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences about the film's story and themes.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [
      "Go Short — International Short Film Festival Nijmegen, 2023",
      "ShortCutz Amsterdam, 2023"
    ],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "Edward de Jong" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Onweer",
    year: 2022,
    category: "music-video",
    slug: "onweer",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — two to three sentences.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Artist", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Ik Haat Poëzie",
    year: 2020,
    category: "other",
    slug: "ik-haat-poezie",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "[Placeholder]" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Sabotage",
    year: 2020,
    category: "music-video",
    slug: "sabotage",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — two to three sentences.]",
    production: "[Production company placeholder]",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Artist", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  },
  {
    title: "Awkward Turtle",
    year: 2020,
    category: "other",
    slug: "awkward-turtle",
    logline: "[Logline placeholder — will be written later.]",
    synopsis: "[Synopsis placeholder — three to four sentences. Web series for NTR / 3LAB.]",
    production: "NTR / 3LAB",
    duration: "[Duration placeholder]",
    festivals: [],
    credits: [
      { role: "Director", name: "Edward de Jong" },
      { role: "Writer", name: "Edward de Jong" },
      { role: "Cinematography", name: "[Placeholder]" },
      { role: "Producer", name: "[Placeholder]" },
      { role: "Cast", name: "[Placeholder]" }
    ],
    watchUrl: null,
    watchPlatform: null,
    stillCount: 4
  }
];
