// MansWell · app themes. One choice (on the main page, Settings) colours the whole app: main page, Pocket and Lens.
// A theme swaps the colour tokens in K and the card surface before each render, plus the base styles (page, nav, brand, inputs).
import { K, store, setThemeHook, setSurface } from './core.js';

const BASE = { ...K };
/** Tokens every theme sets. card2 = raised tile, panel = bottom sheet, line2 = stronger line, onAcc = text on the accent,
 *  accRGB / tintRGB feed oa() and ta(). Status colours keep their meaning in every theme. */
const EMBER = { card2: '#1A1E24', panel: '#15181D', line2: '#2C3038', onAcc: '#FFFFFF', or2: '#FFB27A', accRGB: '255,106,0', tintRGB: '255,255,255', glass: 'rgba(19,22,27,0.92)', glow: 'rgba(255,106,0,.30)', light: false, ctaText: '#160A02',
  hero: 'radial-gradient(120% 120% at 100% 0%,rgba(255,190,120,.35),transparent 55%),linear-gradient(140deg,#FF8A3D 0%,#FF6A00 38%,#B83D00 78%,#5A1C02 100%)', heroText: '#FFFFFF', heroEdge: 'rgba(255,106,0,.22)' };
export const THEMES = {
  ember: { name: 'Ember Noir', note: 'Dark and warm. The original MansWell look.', K: { ...EMBER } },
  ivory: { name: 'Ivory Ledger', note: 'Light paper and ink, like a private-bank statement.', K: {
    bg: '#F6F1E8', card: '#FFFDF8', field: '#F3EDE2', line: '#E4DACB', sep: '#ECE3D6', text: '#1E1B16', sub: '#7A7064', mute: '#A69C8E',
    or: '#8C2F2A', grn: '#2F6B4F', red: '#B2392F', gold: '#A9741B', orSoft: 'rgba(140,47,42,0.10)', orBorder: 'rgba(140,47,42,0.45)', orTint: 'rgba(140,47,42,0.08)',
    card2: '#F7F1E6', panel: '#FFFDF8', line2: '#D9CDBA', onAcc: '#FFFFFF', or2: '#8C2F2A', accRGB: '140,47,42', tintRGB: '60,40,20', glass: 'rgba(255,253,248,0.94)', glow: 'rgba(140,47,42,.08)', light: true, hero: 'linear-gradient(140deg,#B4524B 0%,#8C2F2A 45%,#4E1714 100%)', heroText: '#FFF6EE', heroEdge: 'rgba(140,47,42,.25)',
    surface: '#FFFDF8', hair: 'rgba(60,40,20,0.10)' } },
  sapphire: { name: 'Midnight Sapphire', note: 'Deep navy with champagne gold.', K: {
    bg: '#0A1020', card: '#111A2E', field: '#16213A', line: '#22304D', sep: '#1B2741', text: '#EEF1F7', sub: '#8E9AB3', mute: '#5F6B85',
    or: '#D4B676', grn: '#5FB8A0', red: '#E06C75', gold: '#E2C27D', orSoft: 'rgba(212,182,118,0.12)', orBorder: 'rgba(212,182,118,0.45)', orTint: 'rgba(212,182,118,0.10)',
    card2: '#15203A', panel: '#0F1830', line2: '#2B3B5C', onAcc: '#1A1407', or2: '#E8D3A2', accRGB: '212,182,118', tintRGB: '255,255,255', glass: 'rgba(10,16,32,0.92)', glow: 'rgba(77,120,214,.35)', light: false, hero: 'radial-gradient(120% 120% at 100% 0%,rgba(212,182,118,.28),transparent 55%),linear-gradient(140deg,#2A4170 0%,#16223E 55%,#0A1020 100%)', heroText: '#F3E7C6', heroEdge: 'rgba(212,182,118,.35)',
    surface: 'linear-gradient(180deg,#14203A 0%,#111A2E 100%)', hair: 'rgba(255,255,255,0.07)' } },
  rose: { name: 'Rosé', note: 'Soft blush and berry. Light and gentle.', K: {
    bg: '#FBF1F3', card: '#FFFFFF', field: '#F8EAEE', line: '#F0D9DF', sep: '#F4E3E8', text: '#2B1A20', sub: '#8C6B76', mute: '#B79AA4',
    or: '#D6457A', grn: '#2F7D62', red: '#C2364B', gold: '#B07A1E', orSoft: 'rgba(214,69,122,0.10)', orBorder: 'rgba(214,69,122,0.45)', orTint: 'rgba(214,69,122,0.08)',
    card2: '#FDF5F7', panel: '#FFFFFF', line2: '#E8C7D1', onAcc: '#FFFFFF', or2: '#D6457A', accRGB: '214,69,122', tintRGB: '90,30,50', glass: 'rgba(255,255,255,0.94)', glow: 'rgba(214,69,122,.14)', light: true, hero: 'linear-gradient(140deg,#F08AAE 0%,#D6457A 50%,#8E2450 100%)', heroText: '#FFFFFF', heroEdge: 'rgba(214,69,122,.25)',
    surface: '#FFFFFF', hair: 'rgba(90,30,50,0.10)' } },
  graphite: { name: 'Graphite', note: 'Monochrome ink and silver. Nothing but the numbers.', K: {
    bg: '#0B0B0C', card: '#151517', field: '#1C1C1F', line: '#26262A', sep: '#1F1F22', text: '#F2F2F2', sub: '#9A9A9F', mute: '#606066',
    or: '#E6E6E6', grn: '#6FCF97', red: '#EB5757', gold: '#D9B65C', orSoft: 'rgba(230,230,230,0.10)', orBorder: 'rgba(230,230,230,0.40)', orTint: 'rgba(230,230,230,0.08)',
    card2: '#1A1A1D', panel: '#141416', line2: '#303035', onAcc: '#0B0B0C', or2: '#FFFFFF', accRGB: '230,230,230', tintRGB: '255,255,255', glass: 'rgba(11,11,12,0.92)', glow: 'rgba(255,255,255,.10)', light: false, hero: 'radial-gradient(120% 120% at 100% 0%,rgba(255,255,255,.14),transparent 55%),linear-gradient(140deg,#45454B 0%,#232326 55%,#0E0E10 100%)', heroText: '#FFFFFF', heroEdge: 'rgba(255,255,255,.12)',
    surface: 'linear-gradient(180deg,#18181A 0%,#141416 100%)', hair: 'rgba(255,255,255,0.07)' } }
};
export const THEME_ORDER = ['ember', 'ivory', 'sapphire', 'rose', 'graphite'];
export const appTheme = () => { const t = store.get('app_theme', store.get('lens_theme', 'ember')); return THEMES[t] ? t : 'ember'; };
export const setAppTheme = t => store.set('app_theme', THEMES[t] ? t : 'ember');

let cur = null, styleEl = null;
export function applyTheme(name) {
  if (name === cur) return; cur = name;
  const t = THEMES[name] || THEMES.ember;
  for (const k of Object.keys(K)) if (!(k in BASE)) delete K[k];
  Object.assign(K, BASE, EMBER, t.K);
  if (!styleEl) { styleEl = document.createElement('style'); styleEl.id = 'themeStyle'; document.head.appendChild(styleEl); }
  if (name !== 'ember') K.mainGlow = `radial-gradient(120% 90% at 85% 0%,${K.glow},transparent 70%)`;
  setSurface(t.K.surface, t.K.hair);
  const tint = a => `rgba(${K.tintRGB},${a})`, acc = a => `rgba(${K.accRGB},${a})`;
  styleEl.textContent = name === 'ember' ? '' : `html,body,#frame,#stage{background:${K.bg}!important;color:${K.text}}
.navbar-glass{background:${K.glass};box-shadow:inset 0 1px 0 ${tint(0.08)}}
.brand .mark{color:${K.text}}.brand .mark span{color:${K.or}}.brand .tag{color:${K.sub}}
.inp{color:${K.text}}.inp::placeholder{color:${K.mute}}.inp:focus{box-shadow:inset 0 0 0 1px ${K.or}!important}
.row.tap:active{background:${tint(0.04)}}.dd select option{background:${K.field};color:${K.text}}
.tog{background:${K.light ? K.line2 : K.mute}}.tog.on{background:${K.or}}.tog i{background:${K.light ? '#FFFFFF' : '#FFFFFF'}}
#notify.info{background:${K.light ? K.text : '#2A2F37'};color:${K.light ? K.bg : '#FFFFFF'}}
body.busy #busybar::after{background:${K.or}}body.syncing #busybar::after{background:${acc(0.55)}}
#syncnote{background:${K.field};box-shadow:inset 0 0 0 1px ${K.line2}}`;
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', K.bg);
}
/** The whole app follows your chosen theme. */
setThemeHook(() => applyTheme(appTheme()));
