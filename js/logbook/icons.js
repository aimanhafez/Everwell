// MansWell Voyage · line icons (one style for expenses, transport, Discovery). Colours follow the theme.
import { html, K } from '../core.js';

const P = {
  bike: '<circle cx="5.5" cy="16.5" r="3"/><circle cx="18.5" cy="16.5" r="3"/><path d="M8.5 16.5h5.5l3-6.5h-4.5L10.5 7H8"/><path d="M15 7h2.5l1.5 3"/>',
  car: '<path d="M5 15.5v-3l2-5h10l2 5v3"/><rect x="3.5" y="12.5" width="17" height="5" rx="1.5"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/>',
  taxi: '<path d="M10 4h4v3"/><path d="M5 15.5v-3l2-5h10l2 5v3"/><rect x="3.5" y="12.5" width="17" height="5" rx="1.5"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/>',
  bus: '<rect x="5" y="3" width="14" height="15" rx="2.5"/><path d="M5 11h14M8 21v-3M16 21v-3"/><circle cx="8.5" cy="14.5" r=".9"/><circle cx="15.5" cy="14.5" r=".9"/>',
  train: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 10h12M9 21l1.5-4M15 21l-1.5-4"/><circle cx="9.5" cy="13.5" r=".9"/><circle cx="14.5" cy="13.5" r=".9"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M10 21l2-6 3 3v3M12 15l1-6-3 2-2 3M13 9l3 3 3 1"/>',
  boat: '<path d="M3 16.5l2 3.5h14l2-3.5z"/><path d="M6 16.5V11h12v5.5M12 11V4l5 3-5 2"/>',
  plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  bed: '<path d="M3 19V6M3 14h18v5M21 19v-4a3 3 0 0 0-3-3h-7v2"/><circle cx="7" cy="11" r="1.8"/>',
  meal: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 21V3c-2.2 1-3.5 3.3-3.5 7.5H17"/>',
  bag: '<path d="M5 8h14l-1.2 13H6.2z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/>',
  gift: '<rect x="4" y="10" width="16" height="11" rx="1.5"/><path d="M3 7h18v3H3zM12 7v14"/><path d="M12 7c-1.5-3.5-6-3.5-5 0M12 7c1.5-3.5 6-3.5 5 0"/>',
  ticket: '<path d="M3.5 7h17v3a2 2 0 0 0 0 4v3h-17v-3a2 2 0 0 0 0-4z"/><path d="M14.5 7.5v9" stroke-dasharray="1.6 1.8"/>',
  coffee: '<path d="M4 9h12v4.5a5.5 5.5 0 0 1-5.5 5.5h-1A5.5 5.5 0 0 1 4 13.5z"/><path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5c-.8 1 .8 2 0 3M12 3.5c-.8 1 .8 2 0 3"/>',
  city: '<path d="M3 21h18M5 21V10l5-3v14M10 21V4l6 3v14M16 21v-9l3.5 2V21"/><path d="M12.5 9.5h1M12.5 12.5h1M12.5 15.5h1"/>',
  view: '<path d="M2.5 20 9 9.5l4 6 3-4 5.5 8.5z"/><circle cx="17" cy="6" r="2"/>',
  road: '<path d="M8.5 3 4 21M15.5 3 20 21M12 4v2.5M12 10v3.5M12 17v3"/>',
  gem: '<path d="M6.5 4h11L21 9.5 12 20.5 3 9.5z"/><path d="M3 9.5h18M9.5 4 12 9.5 14.5 4M12 9.5v11"/>',
  coins: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v5.5c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8V6M5 11.5V17c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8v-5.5"/>',
  split: '<path d="M4 6h5l6 12h5M4 18h5l2.5-5M15 6h5"/><path d="M18 4l2 2-2 2M18 16l2 2-2 2"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
  book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
  pin: '<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 16v-4M11 16V8M15 16v-6M19 16V6"/>',
  trips: '<circle cx="6" cy="19" r="2.2"/><path d="M18 12s-3.2-3.4-3.2-5.7C14.8 4.4 16.2 3 18 3s3.2 1.4 3.2 3.3C21.2 8.6 18 12 18 12z"/><circle cx="18" cy="6.3" r="1"/><path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3 3 0 0 1 0-6h3"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M7.5 13.5h1M11.5 13.5h1M15.5 13.5h1M7.5 17h1M11.5 17h1"/>',
  wallet: '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16" height="11" rx="2.5"/><path d="M15.5 13.5h4.5"/>',
  gauge: '<path d="M3.5 17a8.5 8.5 0 1 1 17 0"/><path d="M12 17l4-5"/><circle cx="12" cy="17" r="1.4"/><path d="M6 13l1 .5M18 13l-1 .5M12 8.5v1.2"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5S9.5 6.1 12 3.5z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/>',
  mount: '<path d="M2.5 20 9 9.5l4 6 3-4 5.5 8.5z"/>',
  solo: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6l-3 8M12 13l3 8M8 10l4-3 4 3"/>',
  family: '<circle cx="7" cy="5" r="1.8"/><circle cx="16" cy="5" r="1.8"/><circle cx="11.5" cy="11" r="1.4"/><path d="M5 21v-6H4l1.5-6h3l1.5 6H9v6M14 21v-5l-1-6h6l-1 6v5M10.5 21v-4h2v4"/>',
  group: '<circle cx="6" cy="6" r="1.7"/><circle cx="12" cy="5" r="1.7"/><circle cx="18" cy="6" r="1.7"/><path d="M4 21v-8l2-4 2 4v8M10 21v-9l2-5 2 5v9M16 21v-8l2-4 2 4v8"/>',
  people: '<circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.4"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>'
};
export const svgIco = (n, c, s = 20) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n] || P.bag}</svg>`;
/** A line icon in the theme colour (or c). */
export const Ico = (n, s = 20, c) => html`<span style=${`display:inline-flex;line-height:0;flex:none`} dangerouslySetInnerHTML=${{ __html: svgIco(n, c || K.or, s) }}></span>`;
/** The icon in a soft rounded tile (lists). */
export const Tile = (n, sz = 34) => html`<span class="lbtl" style=${`width:${sz}px;height:${sz}px`} dangerouslySetInnerHTML=${{ __html: svgIco(n, K.or, Math.round(sz * 0.56)) }}></span>`;
