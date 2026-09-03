// panel/api/mock/gamunits.js — the mock GAM ad unit tree. Invented data — mock only.
// BASE units exist from the first sync; PENDING units appear when ops hits "Sync GAM".

export const BASE_UNITS = [
  '/7176/toi/mweb/videoshow/preroll',
  '/7176/toi/mweb/videoshow/midroll',
  '/7176/toi/mweb/videoshow/postroll',
  '/7176/toi/mweb/videoshow/display',
  '/7176/toi/mweb/articleshow/preroll',
  '/7176/toi/mweb/articleshow/display',
  '/7176/toi/web/videoshow/preroll',
  '/7176/toi/web/videoshow/midroll',
  '/7176/toi/web/videoshow/display',
  '/7176/toi/mweb/shorts/preroll',
  '/7176/et/app/minitv/preroll',
  '/7176/et/app/minitv/midroll',
  '/7176/et/web/articleshow/preroll',
  '/7176/et/web/articleshow/display',
  '/7176/nbt/mweb/videoshow/preroll',
  '/7176/nbt/mweb/videoshow/midroll',
  '/7176/nbt/app/minitv/preroll',
  '/7176/nbt/app/minitv/midroll',
];

export const PENDING_UNITS = [
  '/7176/toi/mweb/videoshow/lband',
  '/7176/toi/mweb/liveblog/preroll',
  '/7176/et/web/articleshow/lband',
];
