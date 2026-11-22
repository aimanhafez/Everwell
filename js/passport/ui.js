// MansWell Passport · UI kit: the shell (header, five tabs), flags, the world map, and the sheets every tab shares
// (one country, add/edit a trip, a wish, pick a country, photo viewer, confirm). Same look and theme as Lens.
import { html, K, DB, NAV, I, Brand, Navigate, rerender, save, Notify, guard, Today, G, store, api, applySaved } from '../core.js';
import { syncNow, PasswordDialog, askPassword } from '../shared.js';
import { css as lensCss, Sheet, openSheet, closeSheet, oa, ta, Cap, newId } from '../lens/ui.js';
import * as P from './engine.js';
import { MAP_W, MAP_H, SHAPES as SHAPES0, OTHER as OTHER0, DOTS } from './geo.js';
/* The light map draws at once; the detailed one (1:50m, real coasts and islands) loads in the background on first use and replaces it. */
let SHAPES = SHAPES0, OTHER = OTHER0, hdAsk = false;
function needHD() { if (hdAsk) return; hdAsk = true; import('./geo-hd.js').then(m => { SHAPES = { ...SHAPES0, ...m.SHAPES }; OTHER = m.OTHER; rerender(); }).catch(() => { hdAsk = false; }); }
export const mapDetailed = () => SHAPES !== SHAPES0;
import * as PH from './photos.js';

export { openSheet, closeSheet, Cap, newId, oa, ta };
export const WISHC = () => (K.light ? '#7B3FE4' : '#E2367A');
export const PINK = '#E2367A', PURPLE = '#7B3FE4';

/* ───────── styles ───────── */
export const css = () => lensCss() + `
.pfl{display:inline-block;flex:none;border-radius:3px;object-fit:cover;vertical-align:middle;box-shadow:0 0 0 1px ${ta(.14)};background:${ta(.06)}}
.ppass{margin:0 12px 12px;border-radius:20px;padding:18px;position:relative;overflow:hidden;color:${K.heroText || '#fff'};background:${K.hero || `linear-gradient(140deg,${K.or},${K.or2})`};box-shadow:0 14px 30px ${K.heroEdge || oa(.18)}${K.light ? '' : `,inset 0 0 0 1px ${ta(.06)}`}}
.ppass:after{content:'';position:absolute;right:-34px;top:-34px;width:160px;height:160px;border-radius:50%;border:1.5px solid rgba(255,255,255,.22);box-shadow:0 0 0 20px rgba(255,255,255,.06),0 0 0 40px rgba(255,255,255,.04);pointer-events:none}
.ppass .lcap{color:inherit;opacity:.85}.ppass .big{font-size:34px;font-weight:700;letter-spacing:-.5px;margin-top:4px}.ppass .sub{font-size:12.5px;color:inherit;opacity:.92;margin-top:3px}.ppass .sub b{color:inherit}
.ppass .bar{height:6px;border-radius:6px;background:rgba(255,255,255,.25);margin-top:12px;overflow:hidden}.ppass .bar i{display:block;height:100%;background:currentColor;border-radius:6px}
.ppass .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:13px}.ppass .g3 div{background:rgba(255,255,255,.15);border-radius:11px;padding:8px 10px}.ppass .g3 b{display:block;font-size:17px;margin-top:2px}
.pmap{position:relative;border-radius:12px;overflow:hidden;background:${K.light ? ta(.03) : 'rgba(0,0,0,.18)'}}
.pmap{display:flex;align-items:center;justify-content:center}.pmap svg{display:block;width:100%;height:100%}.pmap.live svg{touch-action:none;cursor:grab}
.pmap .zb{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:5px}.pmap .zb span{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:${K.panel};box-shadow:inset 0 0 0 1px ${K.line2};color:${K.text};font-size:17px;font-weight:600;cursor:pointer;user-select:none}
.pleg{display:flex;gap:12px;flex-wrap:wrap;font-size:10.5px;color:${K.sub};margin-top:9px}.pleg span{display:inline-flex;align-items:center;gap:5px}.pleg i{width:9px;height:9px;border-radius:2px;display:inline-block}
.pchips{display:flex;gap:6px;margin:0 12px 10px;overflow-x:auto;scrollbar-width:none}.pchips::-webkit-scrollbar{display:none}
.pchip{flex:none;font-size:12px;font-weight:600;color:${K.sub};padding:7px 11px;border-radius:99px;box-shadow:inset 0 0 0 1px ${K.line2};white-space:nowrap;cursor:pointer;background:transparent}
.pchip.on{background:${oa(.13)};color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.5)}}
.psrch{display:flex;align-items:center;gap:8px;margin:0 12px 10px;padding:0 12px;height:42px;border-radius:12px;background:${K.field};box-shadow:inset 0 0 0 1px ${ta(.07)}}
.psrch input{flex:1;border:0;outline:0;background:transparent;color:${K.text};font-size:15px;font-family:inherit;min-width:0}.psrch input::placeholder{color:${K.mute}}
.pcr{display:grid;grid-template-columns:30px 1fr auto;gap:11px;align-items:center;padding:10px 0;border-top:1px solid ${K.sep};cursor:pointer}.pcr:first-child{border-top:0;padding-top:2px}.pcr:last-child{padding-bottom:2px}
.pcr .t{font-size:14px;font-weight:600;color:${K.text}}.pcr .s{font-size:11.5px;color:${K.sub};margin-top:2px}
.pst{font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:4px 8px;border-radius:99px;white-space:nowrap;text-transform:uppercase}
.pst.visited{color:${K.or};background:${oa(.13)}}.pst.wish{color:${WISHC()};background:${WISHC()}22}.pst.none{color:${K.sub};background:${ta(.06)}}.pst.home{color:${K.text};background:${ta(.1)}}
.pgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.pgc{border-radius:12px;padding:10px 8px;text-align:center;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};cursor:pointer;position:relative}
.pgc .n{font-size:11.5px;font-weight:600;margin-top:7px;color:${K.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pgc .s{font-size:9.5px;color:${K.sub};margin-top:2px}
.pgc .dot{position:absolute;top:7px;right:7px;width:7px;height:7px;border-radius:50%}
.ptrip{margin:0 12px 12px;border-radius:16px;overflow:hidden;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};cursor:pointer}
.ptrip .ph{height:118px;position:relative}.ptrip .ph:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,transparent 45%,rgba(0,0,0,.45))}
.ptrip .ph .fl{position:absolute;right:10px;bottom:9px;z-index:1;display:flex;gap:4px}
.ptrip .tx{padding:11px 14px 12px}.ptrip b{font-size:15px;color:${K.text}}.ptrip .s{font-size:11.5px;color:${K.sub};margin-top:3px}
.pyr{display:flex;justify-content:space-between;align-items:baseline;margin:18px 18px 8px}.pyr b{font:400 20px Georgia,serif;color:${K.text}}.pyr span{font-size:10px;font-weight:600;letter-spacing:.8px;color:${K.mute}}
.phl{display:grid;grid-template-columns:58px 1fr auto;gap:11px;align-items:center;padding:9px 0;border-top:1px solid ${K.sep};cursor:pointer}.phl:first-child{border-top:0;padding-top:0}.phl:last-child{padding-bottom:0}
.phl .im{width:58px;height:44px;border-radius:9px}.phl .t{font-size:13.5px;font-weight:600;color:${K.text};display:flex;gap:6px;align-items:center}.phl .s{font-size:11px;color:${K.sub};margin-top:2px}
.pk{font-size:9px;font-weight:700;letter-spacing:1.2px}
.pfr{display:flex;gap:6px;flex-wrap:wrap}
.pfc{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:6px 10px 6px 7px;border-radius:99px;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};color:${K.text};cursor:pointer}
.pbad{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.pbad div{text-align:center;font-size:9.5px;color:${K.sub};line-height:1.25}.pbad i{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 5px;border-radius:50%;font:700 13px Inter,system-ui;font-style:normal;color:#fff;background:linear-gradient(135deg,${K.or},${PINK});box-shadow:0 4px 12px ${oa(.25)}}
.pbad .off i{background:${K.field};color:${K.mute};box-shadow:inset 0 0 0 1.5px ${K.line2}}.pbad b{display:block;color:${K.text};font-size:10px}
.pcover{position:relative;height:250px}.pcover:after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.25),transparent 30%,transparent 50%,rgba(0,0,0,.6))}
.pcover .ov{position:absolute;left:18px;right:18px;bottom:16px;z-index:1;color:#fff}.pcover .ov b{display:block;font:400 28px Georgia,serif;text-shadow:0 2px 12px rgba(0,0,0,.4)}.pcover .ov span{font-size:12.5px;opacity:.92}
.pmeta{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:12px 12px}.pmeta div{background:${K.card2};border-radius:12px;padding:9px 11px;box-shadow:inset 0 0 0 1px ${K.line}}.pmeta b{display:block;font-size:14.5px;margin-top:3px;color:${K.text}}
.pcvb{position:absolute;right:14px;top:46px;z-index:3;font-size:12px;font-weight:600;color:#fff;padding:7px 11px;border-radius:99px;background:rgba(0,0,0,.32);box-shadow:inset 0 0 0 1px rgba(255,255,255,.35);cursor:pointer;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
.pcvb.big{right:auto;left:50%;top:44%;transform:translate(-50%,-50%);font-size:14px;padding:12px 18px;background:rgba(0,0,0,.38);box-shadow:inset 0 0 0 1px rgba(255,255,255,.55)}
.pgal{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:0 12px 12px}.pgal div,.pgal label{aspect-ratio:1;border-radius:9px;cursor:pointer;position:relative}
.pgal .add{display:grid;place-items:center;text-align:center;font-size:11.5px;font-weight:600;color:${K.or};box-shadow:inset 0 0 0 1.5px ${oa(.45)};border-radius:9px;background:${oa(.06)}}
.pgal .cv:after{content:'COVER';position:absolute;left:5px;top:5px;font-size:8px;font-weight:700;letter-spacing:.8px;color:#fff;background:rgba(0,0,0,.5);padding:2px 5px;border-radius:4px}
ul.pmom{list-style:none;margin:0;padding:0}ul.pmom li{position:relative;padding:7px 0 7px 16px;font-size:13.5px;line-height:1.45;color:${K.text};border-top:1px solid ${K.sep}}ul.pmom li:first-child{border-top:0;padding-top:0}
ul.pmom li:before{content:'';position:absolute;left:0;top:14px;width:6px;height:6px;border-radius:50%;background:${PINK}}ul.pmom li:first-child:before{top:7px}
.pwl{display:grid;grid-template-columns:34px 1fr auto;gap:11px;align-items:start;padding:12px 0;border-top:1px solid ${K.sep}}.pwl:first-child{border-top:0;padding-top:2px}.pwl:last-child{padding-bottom:2px}
.pwl .t{font-size:14.5px;font-weight:600;color:${K.text}}.pwl .s{font-size:11.5px;color:${K.sub};margin-top:2px;line-height:1.4}
.ptags{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}.ptags i{font-style:normal;font-size:10.5px;color:${K.sub};background:${K.field};border-radius:6px;padding:3px 7px}
.pord{display:flex;flex-direction:column;gap:4px;align-items:flex-end}.pord span{width:26px;height:22px;border-radius:7px;display:grid;place-items:center;color:${K.sub};box-shadow:inset 0 0 0 1px ${K.line2};cursor:pointer;font-size:11px}
.ppri{font-size:9.5px;font-weight:700;letter-spacing:.5px;padding:4px 8px;border-radius:99px}.ppri.H{color:${K.red};background:rgba(229,72,77,.12)}.ppri.M{color:${K.gold};background:rgba(233,185,73,.13)}.ppri.L{color:${K.sub};background:${ta(.07)}}
.pwall{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;margin:0 12px 12px}.pwall div{aspect-ratio:1;border-radius:9px;cursor:pointer}.pwall div:first-child{grid-column:span 2;grid-row:span 2}
.pstep{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:14px;background:${K.field}}.pstep b{font:400 26px Georgia,serif;color:${K.text}}.pstep span{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;font-size:20px;cursor:pointer;background:${K.card};box-shadow:inset 0 0 0 1px ${K.line};color:${K.text};user-select:none}
.pstamps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.jsum{display:grid;grid-template-columns:repeat(4,1fr);margin:2px 14px 0;border-radius:18px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line}}
.jsum div{padding:11px 2px;text-align:center;min-width:0}.jsum div+div{border-left:1px solid ${K.sep}}.jsum b{display:block;font:400 21px Georgia,serif;color:${K.text}}.jsum span{font-size:7.5px;letter-spacing:1.4px;font-weight:800;color:${K.sub}}
.jhero{position:relative;margin:12px 14px 4px;height:206px;border-radius:24px;overflow:hidden;cursor:pointer;color:#fff;box-shadow:0 14px 30px rgba(0,0,0,${K.light ? '.16' : '.4'})}
.jhero .ph{position:absolute;inset:0;background-size:cover;background-position:center}.jhero:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 32%,rgba(15,8,12,.8))}
.jhero .fl{position:absolute;top:14px;left:16px;z-index:2;display:flex;gap:4px}.jhero .sc{position:absolute;top:12px;right:12px;z-index:2;padding:5px 10px;border-radius:14px;background:rgba(255,255,255,.2);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font:400 14px Georgia,serif}
.jhero .tx{position:absolute;left:16px;right:16px;bottom:14px;z-index:2}.jhero .k{font-size:8.5px;letter-spacing:2px;font-weight:700;opacity:.85}.jhero b{display:block;font:400 25px/1.1 Georgia,serif;margin-top:5px}
.jhero .m{display:flex;gap:6px;margin-top:9px;flex-wrap:wrap}.jhero .m span{font-size:10.5px;padding:4px 9px;border-radius:12px;background:rgba(255,255,255,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
.jtl{position:relative;margin:2px 14px 0;padding-left:22px}.jtl:before{content:"";position:absolute;left:6px;top:14px;bottom:10px;width:1.5px;background:linear-gradient(180deg,${K.or},${oa(.12)})}
.jyr{position:relative;display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin:16px 0 8px}.jyr:before{content:"";position:absolute;left:-21px;top:6px;width:11px;height:11px;border-radius:50%;background:${K.bg};box-shadow:inset 0 0 0 2.5px ${K.or}}
.jyr b{font:400 20px Georgia,serif;color:${K.text}}.jyr span{font-size:8px;letter-spacing:1.4px;font-weight:800;color:${K.sub};text-align:right}
.jrow{display:flex;gap:12px;align-items:center;padding:8px;border-radius:18px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};margin-bottom:8px;cursor:pointer}
.jrow .th{width:64px;height:64px;border-radius:13px;flex:none;background-size:cover;background-position:center}
.jrow .t{flex:1;min-width:0}.jrow .t b{display:block;font:400 16px/1.2 Georgia,serif;color:${K.text}}.jrow .t>span{display:block;font-size:11px;color:${K.sub};margin-top:3px;line-height:1.35}.jrow .t .f{display:flex;gap:3px;margin-top:6px}
.jrow .r{text-align:right;padding-right:4px;flex:none}.jrow .r b{display:block;font:400 16px Georgia,serif;color:${K.text};white-space:nowrap}.jrow .r span{font-size:7.5px;letter-spacing:1.3px;font-weight:800;color:${K.sub}}
.pstp{aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;position:relative;border:2px solid var(--s);color:var(--s);transform:rotate(var(--r));cursor:pointer}
.pstp:before{content:'';position:absolute;inset:4px;border-radius:50%;border:1px dashed var(--s);opacity:.7}.pstp.sq{border-radius:13px}.pstp.sq:before{border-radius:9px}.pstp.ar{border-radius:46% 46% 12px 12px}.pstp.ar:before{border-radius:44% 44% 8px 8px}
.pstp b{font:800 16px Inter,system-ui;letter-spacing:1px;display:block}.pstp span{font-size:7.5px;font-weight:700;letter-spacing:.8px;display:block}
.pstp.lock{--s:${K.line2};color:${K.mute}}
body.pvland #stage{overflow:visible}.pview{position:fixed;inset:0;z-index:60;background:#050507;overflow:hidden;color:#fff;outline:0;font-family:inherit}
.pview .amb{position:absolute;inset:-60px;background:center/cover no-repeat;filter:blur(46px) saturate(1.25) brightness(.8);opacity:.75;transform:scale(1.15)}
.pview .im{position:absolute;inset:0;touch-action:none;user-select:none;-webkit-user-select:none}
.pview .fr{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;animation:pvIn .35s ease both}
.pview .fr img,.pview .fr video{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;-webkit-user-drag:none;transition:transform .25s ease;background:transparent}
.pview .fr.cv img,.pview .fr.cv video{object-fit:cover}.pview:not(.land) .fr:not(.cv){bottom:20%}.pview:not(.land) .fr.vd:not(.cv){bottom:29%}.pview .fr.z img{transition:none}
.pview .fr iframe{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);width:100%;height:min(100%,calc(100vw * 1.78));border:0;background:#000}
.pview .wait{position:absolute;inset:0;background:center/contain no-repeat;display:grid;place-items:center}.pview .wait span,.pview .vload{font-size:12px;letter-spacing:.5px;padding:8px 14px;border-radius:99px;background:rgba(0,0,0,.5)}.pview .vload{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap}.pview .ld{position:absolute;inset:0;display:grid;place-items:center;color:#aaa;font-size:13px}
@keyframes pvIn{from{opacity:0;transform:scale(1.02)}to{opacity:1;transform:none}}
.pview .shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,0) 20%,rgba(0,0,0,0) 50%,rgba(0,0,0,.84) 100%);transition:opacity .35s}
.pview .vctl{position:absolute;left:0;right:0;z-index:3;transition:opacity .35s,transform .35s}.pview.hide .vctl,.pview.hide .shade,.pview.hide .parr{opacity:0;pointer-events:none}.pview.hide .vctl.top{transform:translateY(-8px)}.pview.hide .vctl.bot{transform:translateY(8px)}
.pview .top{top:0;display:flex;align-items:center;justify-content:space-between;padding:calc(14px + env(safe-area-inset-top)) 16px 0}
.pview .gb{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;cursor:pointer;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}.pview .gb.ghost{visibility:hidden}
.pview .svi{display:inline-flex;line-height:0}
.pview .dots{display:flex;gap:5px;align-items:center}.pview .dots i{width:4px;height:4px;border-radius:2px;background:rgba(255,255,255,.42);transition:all .25s}.pview .dots i.on{width:18px;background:#fff}
.pview .parr{position:absolute;z-index:3;top:30%;margin-top:-22px;width:44px;height:44px;display:grid;place-items:center;cursor:pointer;opacity:.75;transition:opacity .35s;filter:drop-shadow(0 1px 3px rgba(0,0,0,.5))}.pview .parr.l{left:2px}.pview .parr.r{right:2px}
.pview .bot{bottom:0;padding:0 0 calc(8px + env(safe-area-inset-bottom))}
.pview .tit{padding:0 20px 10px}.pview .ey{font-size:8.5px;font-weight:600;letter-spacing:2.4px;opacity:.82;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pview .tt{font:400 19px/1.2 Georgia,'Times New Roman',serif;margin:5px 0 0;text-shadow:0 2px 16px rgba(0,0,0,.35)}.pview.land .tt{font-size:18px}
.pview .hl{display:block;width:34px;height:1.5px;background:${K.or};margin:7px 0 6px;width:24px}.pview .dd{font-size:10.5px;opacity:.86;letter-spacing:.3px}
.pview .pwhy{margin:0 16px 12px;padding:8px 12px;border-radius:12px;font-size:11.5px;line-height:1.45;background:rgba(255,190,90,.14);color:#FFD9A6;box-shadow:inset 0 0 0 1px rgba(255,190,90,.3)}
.pview .vbar{padding:0 20px 8px}.pview .vbar input{width:100%;-webkit-appearance:none;appearance:none;height:2px;margin:6px 0;border-radius:1px;background:linear-gradient(90deg,#fff var(--p),rgba(255,255,255,.28) var(--p));outline:0}
.pview .vbar input::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 10px ${K.or},0 0 0 3px ${oa(.35)}}.pview .vbar input::-moz-range-thumb{width:12px;height:12px;border:0;border-radius:50%;background:#fff}
.pview .vbar .rw{display:flex;justify-content:space-between;align-items:center;margin-top:8px}.pview .vbar .rw span{display:flex;gap:16px;align-items:center}.pview .vbar button{background:none;border:0;padding:4px;cursor:pointer;line-height:0}.pview .vbar .tm{font-weight:500;font-size:11px;letter-spacing:1px;font-variant-numeric:tabular-nums}
.pview .vbig{position:absolute;z-index:2;left:50%;top:30%;transform:translate(-50%,-50%);width:78px;height:78px;border-radius:50%;display:grid;place-items:center;cursor:pointer;padding-left:4px;background:rgba(255,255,255,.12);box-shadow:inset 0 0 0 1px rgba(255,255,255,.55);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);transition:opacity .35s}.pview.hide .vbig{opacity:0}
.pview .pvst{display:flex;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:6px 0 4px;touch-action:pan-x}.pview .pvst::-webkit-scrollbar{display:none}.pview .pvst .in{display:flex;gap:5px;align-items:flex-end;margin:0 auto;padding:0 16px;min-height:52px}.pview .pvst .th{flex:none;width:30px;height:42px;border-radius:7px;opacity:.5;cursor:pointer;position:relative;display:grid;place-items:center;transition:all .25s}.pview .pvst .th.on{opacity:1;width:38px;height:52px;box-shadow:0 0 0 1.5px #fff,0 6px 16px rgba(0,0,0,.4)}.pview .pvst .th i{filter:drop-shadow(0 1px 2px #000)}
.pview.land .tit{padding-bottom:8px}.pview .pmenu{position:absolute;z-index:6;top:calc(62px + env(safe-area-inset-top));right:14px;min-width:190px;padding:6px;border-radius:16px;background:rgba(22,22,26,.74);backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);box-shadow:inset 0 0 0 1px rgba(255,255,255,.14),0 14px 36px rgba(0,0,0,.5);animation:pvIn .2s ease both}.pview .pmenu button{display:flex;gap:12px;align-items:center;width:100%;padding:11px 12px;background:none;border:0;border-radius:10px;color:#fff;font:500 13px/1 inherit;letter-spacing:.3px;cursor:pointer;text-align:left}.pview .pmenu button:active{background:rgba(255,255,255,.08)}.pview .pmenu button.d{color:#FFB0BC}.pview .pmenu hr{border:0;height:1px;background:rgba(255,255,255,.1);margin:4px 8px}.pview.land .parr,.pview.land .vbig{top:50%}.pview.land .pvst{display:none}
.pgal .pvid{position:absolute;inset:0;display:grid;place-items:center;pointer-events:none}.pgal .pvid i{width:30px;height:30px;border-radius:50%;background:rgba(0,0,0,.45);color:#fff;display:grid;place-items:center;font-style:normal;font-size:11px}.pgal .pvid b{position:absolute;right:6px;bottom:4px;color:#fff;font-size:10.5px;text-shadow:0 1px 2px #000}
.pconf{position:absolute;inset:0;z-index:70;display:grid;place-items:center}.pconf .dim{position:absolute;inset:0;background:rgba(0,0,0,.6)}
.pconf .bx{position:relative;width:310px;background:${K.panel};border-radius:18px;padding:20px;box-shadow:inset 0 0 0 1px ${K.line2};color:${K.text}}
.pconf .bx b{display:block;font-size:16px}.pconf .bx p{font-size:13px;color:${K.sub};line-height:1.5;margin:8px 0 16px}.pconf .row{display:flex;gap:8px}
.pseg{display:grid;gap:4px;background:${K.field};border-radius:12px;padding:4px;box-shadow:inset 0 0 0 1px ${ta(.06)}}
.pseg span{text-align:center;font-size:12.5px;font-weight:600;color:${K.sub};padding:9px 0;border-radius:9px;cursor:pointer}.pseg span.on{background:${oa(.14)};color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.5)}}
.pseg.dis span{cursor:default;opacity:.75}
textarea.lin{height:auto;min-height:74px;padding:10px 12px;line-height:1.45;font-weight:500;resize:vertical}
.pfls{display:flex;gap:4px;flex-wrap:nowrap;overflow:hidden}
.pdr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:11px;align-items:start;padding:12px 0;border-top:1px solid ${K.sep}}.pdr:first-child{border-top:0;padding-top:2px}
.pdr .t{font-size:14.5px;font-weight:600;color:${K.text};margin-top:7px;line-height:1.35}.pdr .t .ppri{font-size:8.5px;margin-left:3px;vertical-align:2px}.pdr .s{font-size:11.5px;color:${K.sub};margin-top:2px;line-height:1.4}
.pup{cursor:default}.pup .t{font-size:16px;font-weight:700;color:${K.text};margin-top:8px}.pup .s{font-size:12px;color:${K.sub};margin-top:3px}
.pupt{font-size:9px;font-weight:800;letter-spacing:1px;color:${K.or};background:${oa(.13)};border-radius:99px;padding:4px 8px}
.pupf{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid ${K.sep};font-size:12px;color:${K.sub}}
.pgw{display:flex;flex-wrap:wrap;gap:6px}.pgoc{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:${K.text};padding:6px 10px;border-radius:99px;background:${oa(.12)};cursor:default}.pgoc b{color:${K.or};cursor:pointer;font-size:15px;line-height:1;margin-left:2px}
.pgoc.s{background:transparent;color:${K.sub};font-weight:500;box-shadow:inset 0 0 0 1px ${oa(.35)};cursor:pointer}
.psug{margin-top:6px;border-radius:12px;background:${K.card2};box-shadow:inset 0 0 0 1px ${K.line};padding:2px 12px}
.pstop{display:grid;grid-template-columns:26px 1fr 74px 28px;gap:9px;align-items:center;padding:8px 0;border-top:1px solid ${K.sep}}.pstop:first-child{border-top:0}
.pstop .t{font-size:14px;font-weight:600}.pstop .pstopp{grid-column:2 / span 3;height:34px;font-size:12.5px;font-weight:500;margin-top:-2px}.pstop .x{color:${K.red};text-align:center;cursor:pointer;font-size:18px}
.ptier{display:inline-grid;place-items:center;min-width:30px;height:22px;padding:0 5px;border-radius:7px;font:800 10.5px Inter,system-ui;letter-spacing:.4px;color:#0D0F12;background:var(--c);flex:none}
.ptier.none{background:${K.field};color:${K.mute};box-shadow:inset 0 0 0 1px ${K.line2}}.ptier.big{min-width:44px;height:36px;font-size:15px;border-radius:10px}
.pband{display:grid;grid-template-columns:repeat(5,1fr);gap:5px}.pband div{border-radius:11px;padding:8px 2px;text-align:center;background:${K.field};box-shadow:inset 0 0 0 1px ${ta(.07)};cursor:pointer}
.pband b{display:block;font:800 17px Inter,system-ui;color:var(--c)}.pband span{display:block;font-size:9px;color:${K.sub};margin-top:2px}.pband div.on{box-shadow:inset 0 0 0 1.5px var(--c);background:color-mix(in srgb,var(--c) 15%,${K.field})}
.ptres{margin-top:10px;border-radius:14px;padding:10px 12px;display:flex;gap:12px;align-items:center;background:linear-gradient(120deg,color-mix(in srgb,var(--c) 16%,transparent),transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 45%,transparent)}
.ptres b{font-size:13px;display:block;color:${K.text}}.ptres span{font-size:11px;color:${K.sub}}
.ppick{margin:0 12px 12px;border-radius:16px;padding:13px 14px;background:linear-gradient(160deg,${oa(.12)},${oa(.03)});box-shadow:inset 0 0 0 1px ${oa(.45)}}
.ppick .t{display:flex;gap:11px;align-items:center}.ppick .t b{font:400 21px Georgia,serif;color:${K.text}}.ppick .x{color:${K.sub};cursor:pointer;padding:4px 2px 4px 8px;font-size:14px}
.pb2{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.pb2 button{border:0;font-family:inherit;font-size:12.5px;font-weight:700;padding:10px 0;border-radius:11px;cursor:pointer;background:transparent}
.pb2 .v{background:${K.or};color:${K.onAcc}}.pb2 .v.on{background:${oa(.15)};color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.55)}}.pb2 .w{color:${WISHC()};box-shadow:inset 0 0 0 1px ${WISHC()}99}.pb2 .w.on{background:${WISHC()}22}.pb2 button:disabled{opacity:.55;cursor:default}
.pfacts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin:0 12px 12px}.pfacts div{border-radius:12px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};padding:9px 10px}
.pfacts span{display:block;font-size:9.5px;font-weight:600;letter-spacing:.6px;color:${K.sub};text-transform:uppercase}.pfacts b{display:block;font-size:12px;margin-top:4px;line-height:1.3;color:${K.text}}
.pgo{display:grid;grid-template-columns:28px 1fr auto;gap:11px;align-items:center;padding:9px 0;border-top:1px solid ${K.sep};cursor:pointer}.pgo:first-child{border-top:0;padding-top:2px}.pgo:last-child{padding-bottom:2px}
.pgo .t{font-size:14px;font-weight:600;color:${K.text}}.pgo .s{font-size:11.5px;color:${K.sub};margin-top:2px}
.pgoing{font-size:9px;font-weight:700;letter-spacing:.7px;padding:4px 8px;border-radius:99px;color:${K.grn};background:rgba(52,199,123,.13)}
.pstrip{display:grid;grid-template-columns:.75fr 1.45fr 1fr;margin:12px 12px 10px;border-radius:14px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line},inset 0 1px 0 ${ta(.04)}}
.pstrip div{padding:9px 11px;min-width:0}.pstrip div+div{border-left:1px solid ${K.sep}}.pstrip span{display:block;font-size:8.5px;font-weight:700;letter-spacing:1.3px;color:${K.sub};text-transform:uppercase}
.pstrip b{display:block;font-size:13.5px;margin-top:3px;color:${K.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pstrip em{font-style:normal;font-size:11px;color:${K.or}}
.proute{margin:0 12px 10px;border-radius:14px;background:${K.surface || K.card};box-shadow:inset 0 0 0 1px ${K.hair || K.line};padding:11px 12px}
.proute .hd{display:flex;align-items:center;gap:8px;cursor:pointer}.proute .hd b{font-size:13.5px;color:${K.text}}.proute .hd span{font-size:11px;color:${K.sub}}.proute .hd em{font-style:normal;font-size:9px;font-weight:700;letter-spacing:.6px;color:${K.or};margin-left:auto}
.pstops{display:flex;align-items:center;flex-wrap:wrap;row-gap:7px;margin-top:10px}
.pst2{display:inline-flex;align-items:center;gap:6px;border-radius:10px;padding:6px 10px 6px 7px;font-size:12px;font-weight:600;color:${K.text};background:linear-gradient(180deg,${K.card2},${K.field});box-shadow:inset 0 0 0 1px ${K.line2}}
.pst2 i{font-style:normal;width:16px;height:16px;border-radius:50%;display:grid;place-items:center;font-size:9px;font-weight:800;background:${oa(.16)};color:${K.or}}
.lk2{display:block;width:14px;height:1.5px;flex:none;background:linear-gradient(90deg,${K.or},${oa(.25)})}
.pgal .more:after{content:attr(data-m);position:absolute;inset:0;border-radius:9px;background:rgba(10,8,14,.58);display:grid;place-items:center;font-size:15px;font-weight:700;color:#fff}
.pmoms{display:flex;flex-direction:column;gap:8px;margin:0 12px 12px}
.pmo{position:relative;border-radius:14px;padding:12px 13px 12px 58px;background:linear-gradient(120deg,${oa(.15)},${K.surface || K.card} 62%);box-shadow:inset 0 0 0 1px ${oa(.28)};overflow:hidden}
.pmo:before{content:attr(data-n);position:absolute;left:12px;top:50%;transform:translateY(-50%);font:800 31px Inter,system-ui;letter-spacing:-1.5px;color:${K.or};opacity:.95}
.pmo span{display:block;font-size:9px;font-weight:700;letter-spacing:1.2px;color:${K.or}}.pmo b{display:block;font-size:14px;line-height:1.35;margin-top:2px;color:${K.text}}
.pmo.big{background:${K.hero || K.or};box-shadow:0 10px 24px ${K.heroEdge || oa(.25)}}.pmo.big:before,.pmo.big span,.pmo.big b{color:${K.heroText || '#fff'}}.pmo.big span{opacity:.85}
.ptiers{display:flex;height:8px;border-radius:6px;overflow:hidden;margin-top:10px;background:${K.field}}.ptiers i{display:block;height:100%}
.ptl{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;font-size:11px;font-weight:600;color:${K.sub}}.ptl span:before{content:'';display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:5px;background:var(--c)}
.pstp .pfl{width:19px!important;height:14px!important;margin-bottom:3px}.pstp b{font-size:12px}.pstp span{font-size:7px}
.pwl .t .ppri{font-size:8.5px;margin-left:5px;vertical-align:2px}
.pfile{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.pprog{margin:0 12px 12px;padding:10px 14px;border-radius:12px;background:${oa(.08)};box-shadow:inset 0 0 0 1px ${oa(.3)};font-size:12.5px;color:${K.or}}
`;

/* ───────── shell ───────── */
const TABS = [['Globe', 'Odyssey', 'scrPpOverview'], ['Plane', 'Journeys', 'scrPpJourneys'], ['Star', 'Wanderlist', 'scrPpWishlist']];
export const goHome = () => { NAV.stack = []; Navigate('scrDreamer'); };
export const go = scr => { NAV.stack = []; Navigate(scr); };
function Header(l) {
  return html`
    ${Brand(18, 18, 236, 44, false, false, 'Atlas', goHome)}
    ${I(258, 20, 36, 36, 'Settings', K.sub, { pad: 9, onClick: () => openSettings(l), label: 'Atlas settings' })}
    ${I(298, 20, 36, 36, 'Grid', K.sub, { pad: 9, onClick: goHome, label: 'MansWell' })}
    ${I(338, 20, 36, 36, 'Reset', K.sub, { pad: 9, onClick: () => syncNow(), label: 'Refresh' })}`;
}
function Nav(active) {
  return html`<div class="navbar-glass"></div>
    ${active >= 0 ? html`<div class="abs" style=${`left:${54 + active * 130}px;bottom:75px;width:22px;height:3px;border-radius:2px;background:${K.or};box-shadow:0 0 12px ${oa(0.55)}`}></div>` : null}
    ${TABS.map(([ic, lb, scr], i) => html`
      ${I(52 + i * 130, { b: 41 }, 26, 26, ic, i === active ? K.or : K.mute, { pad: 4, onClick: () => go(scr), label: 'Atlas ' + lb })}
      <div class="abs" style=${`left:${i * 130}px;bottom:25px;width:130px;height:14px;text-align:center;font-size:10px;letter-spacing:.3px;font-weight:${i === active ? 600 : 400};color:${i === active ? K.or : K.mute};cursor:pointer`} onClick=${() => go(scr)}>${lb}</div>`)}`;
}
/* ───────── the United Kingdom is now four countries (3.12): move entries saved before ───────── */
function UkNote(l) {
  const u = P.ukLeft(), n = u.trips.length + u.places.length;
  if (!n && !u.junk.length && !u.stops.length) return null;
  if (!n) { setTimeout(() => moveUk(l, {}, true), 0); return null; } // only bookkeeping left (Voyage pins, blank rows): done quietly
  return html`<div class="lwarn" data-t="ppUkNote" style="cursor:pointer" onClick=${() => openUkMove(l)}>The United Kingdom is now England, Scotland, Wales and Northern Ireland. ${plural(n, 'entry')} saved as United Kingdom ${n === 1 ? 'needs' : 'need'} a home. <b class="lor">Choose ›</b></div>`;
}
const UKN = { 'GB-ENG': 'England', 'GB-SCT': 'Scotland', 'GB-WLS': 'Wales', 'GB-NIR': 'N. Ireland' };
/** Which parts a journey's Voyage pins fall in. */
const pinParts = tid => P.UK.filter(k => DB.lbStops.some(s => s.LpTrip === tid && s.LpCountry === 'GB' && P.ukPartAt(s.LpLat, s.LpLng) === k));
export function openUkMove(l) {
  const u = P.ukLeft(), pick = {};
  u.trips.forEach(t => { pick['t:' + t.TrId] = pinParts(t.TrId); });
  u.places.forEach(p => { pick['p'] = []; });
  const Chips = k => html`<div class="pgw" style="margin-top:8px">${P.UK.map(x => { const on = pick[k].includes(x); return html`<span class=${'pgoc' + (on ? '' : ' s')} data-t=${'uk-' + k + '-' + x} onClick=${() => { pick[k] = on ? pick[k].filter(y => y !== x) : P.UK.filter(y => y === x || pick[k].includes(y)); rerender(); }}>${Flag(x, 14)}${UKN[x]}${on ? ' ✓' : ''}</span>`; })}</div>`;
  openSheet(l, { title: 'Where was this?', body: () => html`<div data-t="ukMove">
      <div class="lnote" style="margin-top:0">Saved as United Kingdom before it became four countries. Pick one or more for each.</div>
      ${u.trips.map(t => html`<div class="llab">Journey · ${t.TrName}</div>${Chips('t:' + t.TrId)}${pinParts(t.TrId).length ? html`<div class="lnote" style="margin-top:4px">Picked from your Voyage pins.</div>` : null}`)}
      ${u.places.length ? html`<div class="llab">${u.places[0].PlStatus === 'wish' ? 'Wanderlist' : 'Visited before'} · United Kingdom</div>${Chips('p')}` : null}
      <div class="lnote" style="margin-top:12px">Voyage stops with a pin go to the part they are in. Expenses stay in GBP.</div></div>`,
  saveLabel: 'Save',
  onSave: () => {
    const miss = Object.keys(pick).find(k => !pick[k].length);
    if (miss) return Notify('Pick at least one for each.', 'error');
    moveUk(l, pick); closeSheet(l);
  } });
}
function moveUk(l, pick, quiet) {
  const u = P.ukLeft(), up = { PP_Stops: [], PP_Places: [], LB_Stops: [] }, del = { PP_Stops: [], PP_Places: [] };
  u.trips.forEach(t => {
    const parts = pick['t:' + t.TrId] || []; if (!parts.length) return;
    const st = P.stopsOf(t.TrId), out = [];
    // places on the route go with the part their Voyage pin is in (London → England, Edinburgh → Scotland); the rest stay with the first
    const lb = DB.lbStops.filter(x => x.LpTrip === t.TrId), partOfPlace = nm => { const q = String(nm).trim().toLowerCase(), m = lb.find(x => [x.LpCity, x.LpPlace].some(v => String(v || '').trim().toLowerCase() === q)); const k = m ? P.ukPartAt(m.LpLat, m.LpLng) : ''; return parts.includes(k) ? k : parts[0]; };
    st.forEach(s => { if (s.StIso !== 'GB') { out.push(s); return; } del.PP_Stops.push(s.StKey); const pl = P.splitPlaces(s.StRoute || '');
      parts.forEach((x, i) => { if (!st.some(o => o.StIso === x)) out.push({ ...s, StKey: t.TrId + '|' + x, StIso: x, StDays: i ? 0 : s.StDays, StRoute: pl.filter(n => partOfPlace(n) === x).join(', ') }); }); });
    out.forEach((s, i) => up.PP_Stops.push({ ...s, StSeq: i + 1 }));
  });
  u.places.forEach(p => {
    const parts = pick['p'] || []; if (!parts.length) return;
    const grp = parts.length > 1 && p.PlStatus === 'wish' ? p.PlDream || newId('DR') : p.PlDream || '';
    parts.forEach(x => { const cur = P.place(x); if (cur && (cur.PlStatus === 'wish' || cur.PlStatus === 'been')) return; up.PP_Places.push({ ...p, PlIso: x, PlDream: grp }); });
    del.PP_Places.push('GB');
  });
  u.junk.forEach(() => { if (!del.PP_Places.includes('GB')) del.PP_Places.push('GB'); });
  const first = {}; u.trips.forEach(t => { first[t.TrId] = (pick['t:' + t.TrId] || [])[0]; });
  u.stops.forEach(s => { const k = P.ukPartAt(s.LpLat, s.LpLng) || first[s.LpTrip] || (P.stopsOf(s.LpTrip).map(x => x.StIso).find(x => P.UK.includes(x))) || ''; if (k) up.LB_Stops.push({ ...s, LpCountry: k }); });
  Object.keys(up).forEach(k => { if (!up[k].length) delete up[k]; }); Object.keys(del).forEach(k => { if (!del[k].length) delete del[k]; });
  if (!Object.keys(up).length && !Object.keys(del).length) return;
  if (quiet) { if (!DB.ppOk || G.ukQuiet) return; G.ukQuiet = 1; save({ up, del }); return; }
  psave({ up, del }, 'United Kingdom → four countries', Object.values(pick).map(a => a.join('+')).join(', '));
}
export function Page(l, active, kids, id) {
  if (G.ppOpenSettings) { G.ppOpenSettings = false; setTimeout(() => openSettings(l), 0); }
  return html`<div>
    <style>${css()}</style>
    ${Header(l)}
    <div class="lz" data-t=${id} id=${id}>${UpdateNote()}${UkNote(l)}${kids}</div>
    ${Nav(active)}
    ${Sheet(l)}${Confirm(l)}${Viewer(l)}
    ${PasswordDialog(l)}
  </div>`;
}
export const Sect = (t, link, onLink, id) => html`<div class="lst"><h2>${t}<i>.</i></h2><div class="ln"></div>${link ? html`<span class="lk" onClick=${onLink} data-t=${id}>${link}</span>` : null}</div>`;

/* ───────── saving ───────── */
export function canWrite() {
  if (DB.ppOk) return true;
  Notify('Atlas needs the MansWell 3.3 Apps Script to save. Update Code.gs and deploy a new version (see README).', 'error');
  return false;
}
export const psave = (ch, action, detail) => guard(async () => { if (!canWrite()) return; await save({ ...ch, log: [{ AuAction: 'Atlas · ' + action, AuRef: 'PASSPORT', AuDetail: detail || '' }] }); });
const UpdateNote = () => !DB.ppOk ? html`<div class="lwarn">Atlas is ready, but it can't save yet. Update the Apps Script to MansWell 3.3 and deploy a new version. The README has the steps.</div>`
  : !P.srvAtLeast('3.3.0') ? html`<div class="lwarn" data-t="ppOldGs">Update the Apps Script to MansWell 3.3 (paste the new Code.gs, then Deploy › New version). Until then tiers, “I'm going” and route places can't be saved.</div>` : null;

/* ───────── small pieces ───────── */
export const Flag = (iso, h = 18) => html`<img class="pfl" src=${P.flagUrl(iso)} loading="lazy" alt="" style=${`width:${Math.round(h * 4 / 3)}px;height:${h}px`} />`;
const ST_TXT = { visited: 'Visited', wish: 'Wanderlist', none: 'Not yet', home: 'Home' };
export function StPill(iso) {
  const st = iso === P.homeIso() ? 'home' : P.status(iso), n = st === 'visited' ? P.tripsIn(iso).length : 0;
  return html`<span class=${'pst ' + st} data-t=${'st-' + iso}>${ST_TXT[st]}${n > 1 ? ' ×' + n : ''}</span>`;
}
export const plural = (n, w) => n + ' ' + (n === 1 ? w : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + (w === w.toUpperCase() ? 'IES' : 'ies') : w + (w === w.toUpperCase() ? 'S' : 's'));
export const tripLine = t => P.range(t.TrStart, t.TrEnd) + ' · ' + plural(P.daysOf(t), 'day') + (t.TrWith ? ' · ' + P.withTxt(t) : '');
export const Seg = (opts, cur, set, id, dis) => html`<div class=${'pseg' + (dis ? ' dis' : '')} style=${`grid-template-columns:repeat(${opts.length},1fr)`}>${opts.map(([k, t]) => html`<span class=${cur === k ? 'on' : ''} data-t=${id + '-' + k} onClick=${() => !dis && set(k)}>${t}</span>`)}</div>`;

/* ───────── the map ───────── */
const MST = {};
const clampV = st => { st.z = Math.max(1, Math.min(st.z, 12)); const w = MAP_W / st.z, h = MAP_H / st.z; st.cx = Math.max(w / 2, Math.min(MAP_W - w / 2, st.cx)); st.cy = Math.max(h / 2, Math.min(MAP_H - h / 2, st.cy)); };
const vbOf = st => { const w = MAP_W / st.z, h = MAP_H / st.z; return [st.cx - w / 2, st.cy - h / 2, w, h].map(v => v.toFixed(1)).join(' '); };
export function focusMap(key, iso) {
  const st = MST[key] || (MST[key] = { z: 1, cx: MAP_W / 2, cy: MAP_H / 2 });
  const c = P.BY[iso]; if (!c) return;
  const pt = DOTS[iso] || centerOf(iso); if (!pt) return;
  st.z = Math.max(st.z, 3); st.cx = pt[0]; st.cy = pt[1]; clampV(st);
}
function centerOf(iso) {
  const d = SHAPES[iso]; if (!d) return null;
  const n = d.match(/-?\d+(\.\d+)?/g).map(Number); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i + 1 < n.length; i += 2) { x0 = Math.min(x0, n[i]); x1 = Math.max(x1, n[i]); y0 = Math.min(y0, n[i + 1]); y1 = Math.max(y1, n[i + 1]); }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}
/** The world map. o.live: pan, pinch, zoom and tap a country (o.onPick). o.sel: highlighted country. */
export function WorldMap(key, o = {}) {
  const st = MST[key] || (MST[key] = { z: 1, cx: MAP_W / 2, cy: MAP_H / 2 });
  const home = P.homeIso(), wc = WISHC(), none = K.light ? 'rgba(60,40,20,.16)' : ta(.17);
  const fill = iso => { if (iso === home) return K.light ? 'rgba(60,40,20,.45)' : ta(.55); const s = P.status(iso); return s === 'visited' ? K.or : s === 'wish' ? `url(#ph-${key})` : none; };
  const stroke = iso => (iso === o.sel ? (K.light ? '#000' : '#fff') : P.status(iso) === 'wish' ? wc : (K.light ? '#FFFDF8' : K.bg));
  const sw = iso => (iso === o.sel ? 1.6 : P.status(iso) === 'wish' ? 0.7 : 0.4) / Math.sqrt(st.z);
  const r = 4.2 / Math.sqrt(st.z);
  const ptrs = new Map(); let start = null, moved = 0;
  const svgOf = e => e.currentTarget;
  const down = e => { if (!o.live) return; e.currentTarget.setPointerCapture && e.currentTarget.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); start = { st: { ...st }, pts: [...ptrs.values()].map(p => [...p]) }; moved = 0; };
  const move = e => {
    if (!o.live || !ptrs.has(e.pointerId) || !start) return;
    ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const svg = svgOf(e), rect = svg.getBoundingClientRect(), k = (MAP_W / start.st.z) / rect.width;
    const pts = [...ptrs.values()];
    if (pts.length >= 2 && start.pts.length >= 2) {
      const d0 = Math.hypot(start.pts[0][0] - start.pts[1][0], start.pts[0][1] - start.pts[1][1]) || 1, d1 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
      st.z = start.st.z * d1 / d0; moved = 99;
    } else {
      const dx = pts[0][0] - start.pts[0][0], dy = pts[0][1] - start.pts[0][1]; moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      st.cx = start.st.cx - dx * k; st.cy = start.st.cy - dy * k;
    }
    clampV(st); svg.setAttribute('viewBox', vbOf(st));
  };
  const up = e => {
    if (!o.live || !ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (!ptrs.size) {
      if (moved < 6) { const el = document.elementFromPoint(e.clientX, e.clientY), iso = el && el.getAttribute && el.getAttribute('data-iso'); if (iso && o.onPick) o.onPick(iso); }
      start = null; rerender();
    } else start = { st: { ...st }, pts: [...ptrs.values()].map(p => [...p]) };
  };
  const wheel = e => { if (!o.live) return; e.preventDefault(); st.z *= e.deltaY < 0 ? 1.25 : 0.8; clampV(st); rerender(); };
  const zoom = f => { st.z *= f; clampV(st); rerender(); };
  const tapStatic = e => { if (o.live || !o.onTap) return; o.onTap(); };
  needHD();
  const dots = Object.entries(DOTS).filter(([iso]) => P.BY[iso]);
  const selC = K.light ? K.text : '#FFE2B8';
  return html`<div class=${'pmap' + (o.live ? ' live' : '')} data-t=${'map-' + key} onClick=${tapStatic} style=${`height:${o.h || 180}px`}>
    <svg viewBox=${vbOf(st)} preserveAspectRatio="xMidYMid meet" stroke-linejoin="round" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onWheel=${wheel}>
      <defs><pattern id=${'ph-' + key} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="5" height="5" fill=${wc + '30'}/><line x1="0" y1="0" x2="0" y2="5" stroke=${wc} stroke-width="2.2"/></pattern>
        <filter id=${'gl-' + key} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation=${5 / st.z} result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <path d=${OTHER} fill=${none} stroke=${K.light ? '#FFFDF8' : K.bg} stroke-width=${0.4 / Math.sqrt(st.z)} />
      ${Object.entries(SHAPES).map(([iso, d]) => iso === o.sel ? null : html`<path key=${iso} d=${d} data-iso=${iso} fill=${fill(iso)} stroke=${stroke(iso)} stroke-width=${sw(iso)} />`)}
      ${o.sel && SHAPES[o.sel] ? html`<path key="sel" d=${SHAPES[o.sel]} data-iso=${o.sel} data-t="mapSel" fill=${selC} stroke=${K.light ? '#FFFFFF' : '#FFFFFF'} stroke-width=${1.4 / Math.sqrt(st.z)} filter=${`url(#gl-${key})`} />` : null}
      ${dots.map(([iso, [x, y]]) => { const s = iso === home ? 'home' : P.status(iso); return html`<circle key=${'d' + iso} cx=${x} cy=${y} r=${s === 'none' ? r * 0.7 : r} data-iso=${iso} fill=${iso === o.sel ? selC : s === 'visited' ? K.or : s === 'wish' ? wc : s === 'home' ? ta(.6) : none} stroke=${iso === o.sel ? '#fff' : 'none'} stroke-width=${1.2 / Math.sqrt(st.z)} />`; })}
    </svg>
    ${o.live ? html`<div class="zb"><span onClick=${() => zoom(1.6)} data-t="zoomIn">+</span><span onClick=${() => zoom(1 / 1.6)} data-t="zoomOut">−</span><span onClick=${() => { st.z = 1; st.cx = MAP_W / 2; st.cy = MAP_H / 2; rerender(); }} style="font-size:12px" data-t="zoomReset">⤢</span></div>` : null}
  </div>`;
}
export const Legend = (s, extra) => html`<div class="pleg"><span><i style=${`background:${K.or}`}></i>Visited ${s ? s.n + s.extra : ''}</span><span><i style=${`background:${WISHC()}`}></i>Wanderlist ${s ? s.wish : ''}</span>${extra || null}</div>`;

/* ───────── confirm ───────── */
export function confirmAsk(l, title, msg, label, run) { l.confirm = { title, msg, label, run }; rerender(); }
function Confirm(l) {
  const c = l.confirm; if (!c) return null;
  const close = () => { l.confirm = null; rerender(); };
  return html`<div class="pconf" data-t="confirm"><div class="dim" onClick=${close}></div><div class="bx"><b>${c.title}</b><p>${c.msg}</p>
    <div class="row"><button class="lbtn" style="flex:1;padding:12px" onClick=${close} data-t="confirmNo">Cancel</button><button class="lbtnd" style="flex:1" onClick=${() => { l.confirm = null; c.run(); rerender(); }} data-t="confirmYes">${c.label || 'Delete'}</button></div></div></div>`;
}

/* ───────── photo viewer ───────── */
export function openPhoto(l, ph, o = {}) {
  if (l.pview && l.pview.blob) URL.revokeObjectURL(l.pview.blob);
  l.pview = { ph, o, src: null, err: '' }; curView = l.pview; rerender();
  if (PH.isVideo(ph)) {
    if (!(Number(ph.PhW) > 0) || !(Number(ph.PhDur) > 0)) api('ppVideoMeta', { id: ph.PhId }, undefined, { quiet: true }).then(r => { if (r && r.ready) { applySaved({ PP_Photos: [r.row] }); if (l.pview && l.pview.ph.PhId === ph.PhId) { l.pview.ph = { ...l.pview.ph, PhW: r.row.PhW, PhH: r.row.PhH, PhDur: r.row.PhDur }; rerender(); } } }).catch(() => {});
    if (!ph.PhShare) api('ppVideoShare', { id: ph.PhId }, undefined, { quiet: true }).then(r => { applySaved({ PP_Photos: [r] }); if (l.pview && l.pview.ph.PhId === ph.PhId) { l.pview.ph = r; rerender(); } }).catch(e => { if (l.pview) { l.pview.err = "Couldn't get the video ready: " + e.message; rerender(); } });
    return;
  }
  const ls = ph.PhTrip ? P.photosOf(ph.PhTrip) : [], i = ls.findIndex(x => x.PhId === ph.PhId); // the next and previous photos load in the background, so swiping is quick
  setTimeout(() => [ls[i + 1], ls[i - 1]].forEach(n => { if (n && !PH.isVideo(n)) PH.full(n.PhId).catch(() => {}); }), 400);
  PH.full(ph.PhId).then(s => { if (l.pview && l.pview.ph === ph) { l.pview.src = s; rerender(); } }).catch(e => { if (l.pview) { l.pview.err = e.message; rerender(); } });
}
/** The Memories viewer: the photo or video in a framed card on its own colours, the journey day, a film strip, swipe / arrows,
 *  double-tap to zoom (photos). Videos play inside, with Google Drive's player. */
/** MansWell's own video player: the phone plays the file straight from Drive (needs the Drive key), one bar in the theme colour. */
/** Plan B when the phone's player is refused (an iPhone doesn't send the MansWell address with videos): the app fetches the file
 *  itself (that does send it) and plays it from the phone's memory. Up to 150 MB; otherwise Google's player, with the reason. */
async function loadBlob(v, src) {
  v.tried = true; v.pct = 0; rerender();
  const fail = () => { v.useFrame = true; rerender(); whyBlocked(src, v.ph).then(m => { v.why = m; rerender(); }); };
  try {
    const r = await fetch(src); if (!r.ok) throw new Error(String(r.status));
    const total = Number(r.headers.get('content-length')) || 0, max = 150 * 1048576; if (total > max) throw new Error('too big');
    const rd = r.body && r.body.getReader ? r.body.getReader() : null, parts = []; let got = 0;
    if (rd) { for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; if (got > max) throw new Error('too big'); const p = total ? Math.round(got / total * 100) : 0; if (p !== v.pct) { v.pct = p; rerender(); } if (l0() !== v) return; } }
    const blob = rd ? new Blob(parts, { type: r.headers.get('content-type') || 'video/mp4' }) : await r.blob();
    if (l0() !== v) return; v.blob = URL.createObjectURL(blob); rerender();
  } catch (e) { if (l0() === v) fail(); }
}
let curView = null; const l0 = () => curView;
/** Why Drive refused the video (shown under it), e.g. a website rule on the key that doesn't match this address. */
async function whyBlocked(src, ph) {
  const tip = m => m;
  let r = null; try { r = await api('ppVideoCheck', { id: ph.PhId, origin: location.origin }, undefined, { quiet: true }); } catch (e) { /* older Apps Script */ }
  if (r && r.code) {
    const m = String(r.msg || '');
    if (r.access && !/ANYONE_WITH_LINK/.test(r.access) && r.access !== 'unknown') return tip('This video is not shared by link yet (' + r.access + '). Close it and open it again.');
    if (r.code === 200) return tip('Google accepts your Drive key (…' + r.keyEnd + ') and this video, but the phone\'s video player was refused. The phone probably doesn\'t send the MansWell address with videos: in Google Cloud, set the key\'s Application restrictions to None (keep Google Drive API ticked).');
    if (/referer|referrer/i.test(m)) return tip('Your Drive key (…' + r.keyEnd + ') does not allow ' + location.origin + '. In Google Cloud, set its website to ' + location.origin + '/* and wait 5 minutes.');
    if (/not been used|disabled|not enabled/i.test(m)) return tip('Google Drive API is not turned on in the key\'s project. Turn it on, then wait 5 minutes.');
    if (/API key not valid|invalid/i.test(m)) return tip('The Drive key saved in Apps Script (…' + r.keyEnd + ') is not valid. Copy it again from Google Cloud and run setDriveKey.');
    if (/blocked/i.test(m)) return tip('Your Drive key (…' + r.keyEnd + ') is not allowed to use Google Drive API. Tick Google Drive API in the key\'s API restrictions.');
    if (r.code === 404) return tip('Drive can\'t find this video by its link. Close it and open it again in a minute.');
    return tip('Drive refused the key (' + r.code + '): ' + m);
  }
  if (r && r.msg === 'no key') return tip('No Drive key is saved in Apps Script yet. Run setDriveKey.');
  try {
    const x = await fetch(src); if (x.ok) return tip('This phone could not play the file itself.');
    const j = await x.json().catch(() => null); return tip('Drive refused the key: ' + ((j && j.error && j.error.message) || x.status));
  } catch (e) { return tip('Could not reach Google Drive. Paste the new Code.gs (3.15.0) so MansWell can check the key for you.'); }
}
const vt = s => { s = Math.max(0, Math.floor(Number(s) || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const SV = d => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const SI = { more: '<circle cx="5.5" cy="12" r="1.3" fill="#fff"/><circle cx="12" cy="12" r="1.3" fill="#fff"/><circle cx="18.5" cy="12" r="1.3" fill="#fff"/>', back: '<path d="M15 5l-7 7 7 7"/>', play: '<path d="M8 5v14l11-7z" fill="#fff"/>', pause: '<path d="M8 5v14M16 5v14" stroke-width="2.4"/>', snd: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9a4 4 0 0 1 0 6"/>', mute: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 10l4 4M21 10l-4 4"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>', starF: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="#fff"/>',
  zoom: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4M11 8.5v5M8.5 11h5"/>', fit: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.4-4.4M8.5 11h5"/>', del: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', trip: '<path d="M7 17 17 7M9 7h8v8"/>', l: '<path d="M15 5l-7 7 7 7"/>', r: '<path d="M9 5l7 7-7 7"/>' };
const Sv = (k, sz) => html`<i class="svi" style=${sz ? `width:${sz}px;height:${sz}px` : ''} dangerouslySetInnerHTML=${{ __html: SV(SI[k]).replace(/18/g, String(sz || 18)) }}></i>`;
/** The video itself (fills the screen; the bar is drawn with the rest of the controls). */
function VideoEl(v, poster) {
  const st = v.vs || (v.vs = { cur: 0, dur: Number(v.ph.PhDur) || 0, playing: false, muted: false });
  const upd = e => { const x = e.currentTarget; st.cur = x.currentTime; st.dur = isFinite(x.duration) && x.duration ? x.duration : st.dur; st.playing = !x.paused; rerender(); };
  const src0 = 'https://www.googleapis.com/drive/v3/files/' + encodeURIComponent(v.ph.PhFile) + '?alt=media&key=' + encodeURIComponent(DB.driveKey), src = v.blob || src0;
  const play = e => { upd(e); clearTimeout(v.hideT); v.hideT = setTimeout(() => { if (l0() === v && v.vs.playing) { v.hide = true; rerender(); } }, 2000); }; // the controls fade away while it plays
  return html`<video id="pvVideo" src=${src} poster=${poster || ''} playsinline webkit-playsinline preload="metadata" muted=${st.muted} data-t="viewerVideo"
      onTimeUpdate=${upd} onPlay=${play} onPause=${e => { upd(e); clearTimeout(v.hideT); v.hide = false; rerender(); }} onLoadedMetadata=${upd} onEnded=${e => { upd(e); v.hide = false; rerender(); }}
      onError=${() => { if (v.blob) { v.useFrame = true; rerender(); return; } if (!v.tried) loadBlob(v, src0); }}></video>
    ${v.tried && !v.blob ? html`<span class="vload" data-t="viewerLoading">Loading video${v.pct ? ' · ' + v.pct + '%' : '…'}</span>` : null}`;
}
function VideoBar(v) {
  const st = v.vs || { cur: 0, dur: Number(v.ph.PhDur) || 0, playing: false, muted: false };
  const el = () => document.getElementById('pvVideo');
  const toggle = () => { const x = el(); if (x) { if (x.paused) x.play().catch(() => {}); else x.pause(); } };
  const full = () => { const x = el(); if (!x) return; if (x.webkitEnterFullscreen) x.webkitEnterFullscreen(); else if (x.requestFullscreen) x.requestFullscreen(); };
  return html`<div class="vbar" data-t="viewerBar">
    <input type="range" min="0" max=${Math.max(1, st.dur)} step="0.05" value=${st.cur} style=${`--p:${st.dur ? st.cur / st.dur * 100 : 0}%`} onInput=${e => { const x = el(); if (x) { x.currentTime = Number(e.target.value); st.cur = x.currentTime; rerender(); } }} data-t="vSeek" />
    <div class="rw"><span><button onClick=${toggle} data-t="vPlay" aria-label=${st.playing ? 'Pause' : 'Play'}>${Sv(st.playing ? 'pause' : 'play', 16)}</button><b class="tm">${vt(st.cur)} / ${vt(st.dur)}</b></span>
      <span><button onClick=${() => { const x = el(); st.muted = !st.muted; if (x) x.muted = st.muted; rerender(); }} data-t="vMute" aria-label="Sound">${Sv(st.muted ? 'mute' : 'snd', 17)}</button><button onClick=${full} data-t="vFull" aria-label="Full screen">${Sv('full', 17)}</button></span></div></div>`;
}
/** The video frame in the video's own shape (portrait phone videos stand upright), as big as the screen allows. */
function vidBox(ph) {
  const W = Number(ph.PhW) || 0, H = Number(ph.PhH) || 0, r = W && H ? W / H : 9 / 16; // unknown: most phone videos are upright
  const vw = Math.min(window.innerWidth || 390, 560) - 28, vh = (window.innerHeight || 780) - 300;
  let w = vw, h = w / r; if (h > vh) { h = vh; w = h * r; }
  return `width:${Math.round(w)}px;height:${Math.round(h)}px`;
}
const WD = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** The Memories viewer, cinema style: the photo or video fills the screen (a landscape one sits across the middle on its own
 *  colours), the journey and day in spaced capitals, the date in serif. Tap to hide or show everything; turn the phone for a
 *  landscape one. Swipe / film strip / arrows move; double-tap zooms a photo. */
function Viewer(l) {
  const v = l.pview; if (!v) return null;
  if (!window.__pvRs) { window.__pvRs = 1; window.addEventListener('resize', () => { if (l.pview) rerender(); }); }
  const close = () => { if (v.blob) URL.revokeObjectURL(v.blob); clearTimeout(v.hideT); document.body.classList.remove('pvland'); l.pview = null; curView = null; rerender(); };
  const t = v.ph.PhTrip && P.trip(v.ph.PhTrip);
  const list = t ? P.photosOf(t.TrId) : [v.ph], at = Math.max(0, list.findIndex(x => x.PhId === v.ph.PhId));
  const go = d => { const n = list[at + d]; if (n) openPhoto(l, n, v.o); };
  const vid = PH.isVideo(v.ph), th = PH.thumb(v.ph.PhId), img = vid ? th : v.src || th;
  const W = window.innerWidth || 390, H = window.innerHeight || 800, land = W > H;
  if (v.hide === undefined) v.hide = land; // sideways: the picture alone; tap for the rest
  // fill the screen when the shape is close (upright on an upright phone), else show it whole on its own colours
  const mw = Number(v.ph.PhW) || 0, mh = Number(v.ph.PhH) || 0, cover = mw && mh && Math.abs(mw / mh - W / H) / (W / H) < 0.22;
  const tk = v.ph.PhTaken ? new Date(String(v.ph.PhTaken).slice(0, 10) + 'T00:00:00') : null;
  const dn = tk && t ? Math.round((tk - new Date(String(t.TrStart).slice(0, 10) + 'T00:00:00')) / 864e5) + 1 : 0;
  const eyebrow = [t ? t.TrName : '', dn >= 1 && t && dn <= P.daysOf(t) ? 'Day ' + dn : ''].filter(Boolean).join(' · ').toUpperCase();
  const isCover = t && t.TrCover === v.ph.PhId;
  // gestures: swipe left / right; tap shows or hides everything; double-tap zooms a photo (then drag to look around)
  // pinch with two fingers to zoom a photo (1×–5×), drag to look around; double-tap zooms in / back out
  const zs = () => v.zs || 1, setT = el => { if (el) el.style.transform = zs() > 1 ? `translate(${v.px || 0}px,${v.py || 0}px) scale(${zs()})` : ''; };
  const pts = v.pts || (v.pts = new Map()), dist = () => { const [p, q] = [...pts.values()]; return Math.hypot(p.x - q.x, p.y - q.y) || 1; };
  const down = e => {
    if (v.menu && !e.target.closest('.pmenu,[data-t="viewerMore"]')) { v.menu = false; v.x0 = null; rerender(); return; }
    if (e.target.closest('.vctl,.pmenu,.pvst,.vbig,.parr,.gb')) { v.x0 = null; return; }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && !vid) { v.x0 = null; v.pin = { d0: dist(), s0: zs(), px: v.px || 0, py: v.py || 0 }; return; }
    if (pts.size > 1) return;
    v.x0 = e.clientX; v.y0 = e.clientY; v.x1 = null; v.pan = zs() > 1 ? { x: e.clientX, y: e.clientY, px: v.px || 0, py: v.py || 0 } : null;
  };
  const moveP = e => {
    if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const el = e.currentTarget.querySelector('.fr img');
    if (v.pin && pts.size === 2) { const k = Math.min(5, Math.max(1, v.pin.s0 * dist() / v.pin.d0)); v.zs = k; v.px = v.pin.px * k / v.pin.s0; v.py = v.pin.py * k / v.pin.s0; setT(el); return; }
    if (v.x0 == null) return; v.x1 = e.clientX;
    if (v.pan) { v.px = v.pan.px + (e.clientX - v.pan.x); v.py = v.pan.py + (e.clientY - v.pan.y); setT(el); }
  };
  const up = e => {
    pts.delete(e.pointerId);
    if (v.pin) { if (pts.size) return; v.pin = null; v.x0 = null; v.pinEnd = Date.now(); if (zs() < 1.08) { v.zs = 1; v.px = 0; v.py = 0; } v.zoom = zs() > 1; rerender(); return; }
    if (v.x0 == null) return; const dx = (e.clientX ?? v.x1 ?? v.x0) - v.x0, dy = (e.clientY ?? v.y0) - v.y0; v.x0 = null;
    if (!v.zoom && Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; }
    if (Math.abs(dx) >= 8 || Math.abs(dy) >= 8 || Date.now() - (v.pinEnd || 0) < 350) return;
    const now = Date.now();
    if (!vid && now - (v.tap || 0) < 300) { clearTimeout(v.tapT); v.tap = 0; v.zs = zs() > 1 ? 1 : 2.5; v.zoom = v.zs > 1; v.px = 0; v.py = 0; rerender(); return; }
    v.tap = now; clearTimeout(v.tapT); v.tapT = setTimeout(() => { if (l0() === v) { v.hide = !v.hide; rerender(); } }, vid ? 0 : 280);
  };
  const cancel = e => { pts.delete(e.pointerId); if (v.pin && !pts.size) { v.pin = null; v.zoom = zs() > 1; rerender(); } else if (v.x0 != null && v.x1 != null && !v.zoom) { const dx = v.x1 - v.x0; if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1); } v.x0 = null; };
  const n0 = Math.max(0, Math.min(at - 3, list.length - 7)), near = list.map((x, i) => [x, i]).slice(n0, n0 + 7);
  const del = () => confirmAsk(l, vid ? 'Delete this video?' : 'Delete this photo?', 'It is removed from the trip and moved to the bin in your Google Drive.', 'Delete', () => guard(async () => {
    if (!canWrite()) return;
    await PH.remove([v.ph.PhId]); await save({ del: { PP_Photos: [v.ph.PhId] }, up: isCover ? { PP_Trips: [{ ...t, TrCover: '' }] } : {}, log: [{ AuAction: 'Atlas · Photo deleted', AuRef: 'PASSPORT', AuDetail: t ? t.TrName : '' }] });
    close();
  }));
  const mi = (ic, label, fn, id, cls) => html`<button class=${cls || ''} onClick=${() => { v.menu = false; fn(); }} data-t=${id}>${Sv(ic, 18)}<span>${label}</span></button>`;
  const menuItems = [
    t && v.o.cover !== false && !vid ? mi(isCover ? 'starF' : 'star', isCover ? 'Journey cover ✓' : 'Set as journey cover', () => { psave({ up: { PP_Trips: [{ ...t, TrCover: v.ph.PhId }] } }, 'Trip cover', t.TrName); rerender(); }, 'setCover') : null,
    v.o.onOpenTrip && t ? mi('trip', 'Open journey', () => { close(); v.o.onOpenTrip(t); }, 'openTrip') : null,
    v.o.del !== false ? mi('del', vid ? 'Delete video' : 'Delete photo', del, 'photoDel', 'd') : null].filter(Boolean);
  // keep the open one in the middle of the film strip (it scrolls left and right)
  if (v.scAt !== at) { v.scAt = at; requestAnimationFrame(() => { const sc = document.querySelector('.pview .pvst'), on = sc && sc.querySelector('.th.on'); if (on) sc.scrollTo({ left: on.offsetLeft - sc.clientWidth / 2 + on.offsetWidth / 2, behavior: v.scF ? 'smooth' : 'auto' }); v.scF = 1; }); }
  const st = v.vs || {}, own = vid && !v.useFrame && v.ph.PhShare && DB.driveKey;
  const media = vid ? (own ? VideoEl(v, img)
      : v.ph.PhShare ? html`<iframe src=${'https://drive.google.com/file/d/' + encodeURIComponent(v.ph.PhFile) + '/preview'} allow="autoplay; fullscreen" allowfullscreen data-t="viewerVideo"></iframe>`
      : html`<div class="wait" style=${img ? `background-image:url("${img}")` : ''}><span>${v.err || 'Getting the video ready…'}</span></div>`)
    : img ? html`<img src=${img} alt="" draggable="false" style=${zs() > 1 ? `transform:translate(${v.px || 0}px,${v.py || 0}px) scale(${zs()})` : ''} data-t="viewerImg" />` : html`<span class="ld">${v.err || 'Loading…'}</span>`;
  // the app is a phone-width canvas; turned sideways the viewer steps out of it and takes the whole screen at true size
  let box = null; const sg = land && document.getElementById('stage');
  if (sg) { const r = sg.getBoundingClientRect(), k = (r.width / (sg.offsetWidth || 390)) || 1; box = `position:fixed;inset:auto;left:${-r.left / k}px;top:${-r.top / k}px;width:${W}px;height:${H}px;transform-origin:0 0;transform:scale(${1 / k})`; }
  document.body.classList.toggle('pvland', !!box);
  return html`<div class=${'pview' + (v.hide ? ' hide' : '') + (land ? ' land' : '')} style=${box} data-t="viewer" tabindex="0" onKeyDown=${e => { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); if (e.key === 'Escape') close(); }}>
    <div class="amb" style=${th ? `background-image:url("${th}")` : PH.bg('', v.ph.PhId)}></div>
    <div class="im" onPointerDown=${down} onPointerMove=${moveP} onPointerUp=${up} onPointerCancel=${cancel}>
      <div class=${'fr' + (vid ? ' vd' : '') + (cover ? ' cv' : '') + (v.zoom ? ' z' : '')} key=${v.ph.PhId}>${media}</div>
      ${own && !st.playing && !v.tried ? html`<span class="vbig" onClick=${() => { const x = document.getElementById('pvVideo'); if (x) x.play().catch(() => {}); }} data-t="viewerPlay">${Sv('play', 26)}</span>` : null}</div>
    <div class="shade"></div>
    <div class="vctl top"><span class="gb" onClick=${close} data-t="viewerClose" aria-label="Back">${Sv('back', 18)}</span>
      ${list.length > 1 ? html`<div class="dots">${near.map(([, i]) => html`<i class=${i === at ? 'on' : ''}></i>`)}</div>` : html`<span></span>`}${menuItems.length ? html`<span class="gb" onClick=${() => { v.menu = !v.menu; rerender(); }} data-t="viewerMore" aria-label="More">${Sv('more', 20)}</span>` : html`<span class="gb ghost"></span>`}</div>
    ${v.menu && menuItems.length ? html`<div class="pmenu" data-t="viewerMenu">${menuItems}</div>` : null}
    ${at > 0 && !v.zoom ? html`<span class="parr l" onClick=${() => go(-1)} data-t="viewerPrev" aria-label="Previous">${Sv('l', 22)}</span>` : null}${at < list.length - 1 && !v.zoom ? html`<span class="parr r" onClick=${() => go(1)} data-t="viewerNext" aria-label="Next">${Sv('r', 22)}</span>` : null}
    <div class="vctl bot">
      ${vid && v.why ? html`<div class="pwhy" data-t="viewerWhy">${v.why}</div>` : null}
      <div class="tit">${eyebrow ? html`<div class="ey">${eyebrow}</div>` : null}
        ${tk ? html`<div class="tt">${WD[tk.getDay()]}, ${tk.getDate()} ${MONTHS[tk.getMonth()]}</div>` : null}<i class="hl"></i>
        <div class="dd" data-t="viewerPos">${vid ? 'Video · ' + PH.durTxt(v.ph.PhDur) : 'Photo ' + (at + 1) + ' of ' + list.length}${tk ? ' · ' + tk.getFullYear() : ''}${isCover ? ' · Cover' : ''}</div></div>
      ${own ? VideoBar(v) : null}
      ${list.length > 1 ? html`<div class="pvst" data-t="viewerStrip"><div class="in">${list.map((x, i) => html`<span class=${'th' + (i === at ? ' on' : '')} style=${PH.bg(x.PhId, x.PhId)} onClick=${() => openPhoto(l, x, v.o)} data-t=${'vs-' + x.PhId}>${PH.isVideo(x) ? html`<i>${Sv('play', 10)}</i>` : null}</span>`)}</div></div>` : null}
    </div></div>`;
}

/* ───────── pick a country ───────── */
export function openPick(l, o) {
  const f = { q: '' };
  openSheet(l, { title: o.title || 'Choose a country', body: () => {
    const list = P.search(f.q).filter(c => !o.filter || o.filter(c)).slice(0, 60);
    return html`<div class="psrch" style="margin:2px 0 10px"><input placeholder="Search countries" value=${f.q} onInput=${e => { f.q = e.target.value; rerender(); }} data-t="pickQ" /></div>
      <div>${list.length ? list.map(c => html`<div class="pcr" data-t=${'pick-' + c.iso} onClick=${() => o.onPick(c.iso)}>${Flag(c.iso, 20)}<div><div class="t">${c.name}</div><div class="s">${c.cont}${c.ex ? ' · territory' : ''}</div></div>${StPill(c.iso)}</div>`) : html`<div class="lempty">No country matches “${f.q}”.</div>`}</div>`;
  } });
}

/* ───────── one country ───────── */
export function openCountry(l, iso, o = {}) {
  const c = P.BY[iso]; if (!c) return;
  const f = { first: (P.place(iso) || {}).PlFirst || '' };
  openSheet(l, { title: '', body: () => {
    const st = P.status(iso), locked = P.byTrip(iso), pl = P.place(iso), ts = P.tripsIn(iso), home = iso === P.homeIso();
    const setSt = k => {
      if (locked || k === st) return;
      if (k === 'wish') { closeSheet(l); openWish(l, iso); return; }
      const row = { ...(pl || { PlIso: iso, PlPri: 'M', PlYear: 0, PlWhy: '', PlSee: '', PlNote: '', PlSeq: 0, PlPhoto: '', PlAdded: Today(), PlFirst: '' }), PlStatus: k === 'visited' ? 'been' : '' };
      psave({ up: { PP_Places: [row] } }, k === 'visited' ? 'Visited before' : 'Status cleared', c.name);
    };
    const first = P.firstVisit(iso);
    return html`<div data-t="country">
      <div style="display:flex;gap:14px;align-items:center">${Flag(iso, 46)}<div><div style="font:400 27px Georgia,serif;color:${K.text}" data-t="cName">${c.name}</div><div class="lsub" style="margin:0">${c.iso} · ${c.iso3}${c.num ? ' · ' + c.num : ''}${c.ex ? ' · territory' : ''}</div></div></div>
      <div class="lg2 r2 lfx" style="margin-top:14px">
        <div>${Cap('Capital')}<div class="lv">${c.cap || '—'}</div></div><div>${Cap('Currency')}<div class="lv" style="font-size:13.5px">${c.curName ? c.curName + ' · ' + c.cur : '—'}</div></div>
        <div>${Cap('Continent')}<div class="lv">${c.cont}</div></div><div>${Cap('First visit')}<div class="lv" data-t="cFirst">${first ? P.fmtMon(first) : '—'}</div></div></div>
      ${home ? html`<div class="lnote" style="margin-top:12px">This is your home country. It shows on the map but isn't counted. Change it in Atlas settings.</div>` : html`
        <div style="margin-top:14px">${Seg([['visited', 'Visited'], ['wish', 'Wanderlist'], ['none', 'Not yet']], st, setSt, 'cst', locked)}</div>
        <div class="lnote" style="margin-top:7px">${locked ? html`Visited because ${plural(ts.length, 'trip')} include${ts.length === 1 ? 's' : ''} ${c.name}. To change it, edit or delete ${ts.length === 1 ? 'that trip' : 'those trips'}.` : st === 'visited' ? 'Marked as visited before Atlas, with no journey written up.' : st === 'wish' ? 'On your Wanderlist. Add the journey when you go and it moves to Visited by itself.' : 'Not visited yet.'}</div>
        ${st === 'visited' && !locked ? html`<div class="llab">First visit (optional)</div><input class="lin" type="month" value=${String(f.first).slice(0, 7)} data-t="cFirstIn" onChange=${e => { f.first = e.target.value ? e.target.value + '-01' : ''; psave({ up: { PP_Places: [{ ...pl, PlFirst: f.first }] } }, 'First visit', c.name); }} />` : null}`}
      ${pl && (pl.PlWhy || pl.PlSee || pl.PlNote || P.isTier(pl.PlTier)) ? html`<div class="lfx" style="margin-top:12px">${Cap(st === 'wish' ? (P.isGoing(pl) ? 'Going · ' + (pl.PlGoYear || '') + (pl.PlGoDays ? ' · ' + pl.PlGoDays + ' days' : '') : 'On your Wanderlist') : 'From your Wanderlist')}
        ${P.isTier(pl.PlTier) ? html`<div style="display:flex;gap:9px;align-items:center;margin-top:7px">${TierBadge(pl.PlTier)}<span class="lnote">${P.tierText(pl.PlTier)}</span></div>` : null}
        ${pl.PlWhy ? html`<div style="font-size:13.5px;margin-top:5px;color:${K.text}">${pl.PlWhy}</div>` : null}
        ${pl.PlSee ? html`<div class="ptags">${String(pl.PlSee).split('|').filter(Boolean).map(s => html`<i>${s}</i>`)}</div>` : null}
        ${pl.PlNote ? html`<div class="lnote" style="margin-top:6px">${pl.PlNote}</div>` : null}
        ${st === 'wish' ? html`<div style="margin-top:9px;display:flex;gap:8px"><span class="lbtn o" onClick=${() => { closeSheet(l); openWish(l, iso); }} data-t="cEditWish">Edit</span>${P.isGoing(pl) || P.upIsos().has(iso) ? null : html`<span class="lbtn" onClick=${() => { closeSheet(l); openGoing(l, P.dreamOf(iso)); }} data-t="cGoing">I'm going</span>`}</div>` : null}</div>` : null}
      ${ts.length ? html`<div class="lst" style="margin:18px 0 8px"><h2 style="font-size:19px">Your journeys here<i>.</i></h2><div class="ln"></div><span class="lk">${ts.length}</span></div>
        <div class="lfx">${ts.map(t => { const cv = P.coverOf(t); return html`<div class="phl" onClick=${() => { closeSheet(l); openTrip(t.TrId); }} data-t=${'cTrip-' + t.TrId}><div class="im" style=${PH.bg(cv && cv.PhId, t.TrId)}></div><div><div class="t">${t.TrName}</div><div class="s">${tripLine(t)}</div></div><span style=${`color:${K.mute}`}>›</span></div>`; })}</div>` : null}
      ${home ? null : html`<button class="lbtnf" style="margin-top:16px" data-t="cAddTrip" onClick=${() => { closeSheet(l); openTripEdit(l, null, { isos: [iso] }); }}>+ Add a journey to ${c.name}</button>`}
    </div>`;
  } });
}

/* ───────── a wish (Wanderlist) ───────── */
export const TierBadge = (c, big) => P.isTier(c) ? html`<span class=${'ptier' + (big ? ' big' : '')} style=${`--c:${P.TIER_COLOR[c[0]]}`} data-t=${'tier-' + c}>${c}</span>` : html`<span class=${'ptier none' + (big ? ' big' : '')}>–</span>`;
/** Budget first (S A B C D), then how long (1–4). S has three budget levels instead. */
export function TierPicker(f) {
  const L = f.tier ? f.tier[0] : '';
  return html`<div data-t="tierPicker">
    <div class="pband">${P.TIER_LETTERS.map(x => html`<div class=${L === x ? 'on' : ''} style=${`--c:${P.TIER_COLOR[x]}`} onClick=${() => { f.tier = L === x ? '' : x + (x === 'S' ? '2' : f.tier && f.tier[0] !== 'S' ? f.tier[1] : '3'); rerender(); }} data-t=${'band-' + x}><b>${x}</b><span>${P.TIER_SHORT[x]}</span></div>`)}</div>
    ${!L ? html`<div class="lnote" style="margin-top:6px">Pick a budget to set the indicator, or leave it empty.</div>`
      : L === 'S' ? html`<div class="llab">Budget level</div>${Seg(Object.keys(P.S_LEVELS).map(k => [k, k]), f.tier, k => { f.tier = k; rerender(); }, 'sLvl')}`
      : html`<div class="llab">How long</div>${Seg(['1', '2', '3', '4'].map(n => [L + n, P.LEN_SHORT[n]]), f.tier, k => { f.tier = k; rerender(); }, 'len')}`}
    ${L ? html`<div class="ptres" style=${`--c:${P.TIER_COLOR[L]}`} data-t="tierRes">${TierBadge(f.tier, true)}<div><b>${P.tierText(f.tier)}</b><span>${L === 'S' ? 'S is set by budget only.' : 'Budget first, then how long.'}</span></div></div>` : null}
  </div>`;
}
export function openWish(l, iso) {
  const dd = P.status(iso) === 'wish' ? P.dreamOf(iso) : null; if (dd && dd.isos.length > 1) return openDream(l, dd); // part of a dream: edit the whole dream
  const c = P.BY[iso], pl = P.place(iso);
  const isWish = pl && pl.PlStatus === 'wish';
  const f = { pri: (pl && pl.PlPri) || 'M', tier: (isWish && P.isTier(pl.PlTier)) ? pl.PlTier : '', see: pl && pl.PlSee ? String(pl.PlSee).split('|').join(', ') : '', note: (pl && pl.PlNote) || '', busy: '' };
  openSheet(l, { title: (isWish ? 'Edit · ' : 'Add to Wanderlist · ') + c.name, body: () => html`<div data-t="wishForm">
      <div style="display:flex;gap:12px;align-items:center">${Flag(iso, 30)}<div><b style=${`font-size:16px;color:${K.text}`}>${c.name}</b><div class="lsub" style="margin:0">${c.cont}${c.cap ? ' · ' + c.cap : ''}</div></div></div>
      <div class="llab">Priority</div>${Seg([['H', 'High'], ['M', 'Medium'], ['L', 'Low']], f.pri, k => { f.pri = k; rerender(); }, 'wPri')}
      <div class="llab">Tier · budget</div>${TierPicker(f)}
      <div class="llab">Places to see · separate with commas</div><input class="lin" placeholder="Reykjavík, Vík, Jökulsárlón" value=${f.see} onInput=${e => { f.see = e.target.value; }} data-t="wSee" />
      <div class="llab">Notes</div><textarea class="lin" placeholder="Best season, visa, ideas" value=${f.note} onInput=${e => { f.note = e.target.value; }} data-t="wNote"></textarea>
    </div>`,
  saveLabel: isWish ? 'Save' : 'Add to Wanderlist',
  extra: isWish ? () => html`<button class="lbtn" style="padding:13px 14px;color:${K.red}" data-t="wRemove" onClick=${() => confirmAsk(l, 'Remove ' + c.name + ' from your Wanderlist?', 'Its tier, places and notes are removed too.', 'Remove', () => { psave({ up: { PP_Places: [{ ...P.place(iso), PlStatus: '', PlWhy: '', PlSee: '', PlNote: '', PlYear: 0, PlTier: '', PlGo: '', PlGoYear: 0, PlGoDays: 0 }] } }, 'Wanderlist removed', c.name); closeSheet(l); })}>Remove</button>` : null,
  onSave: () => {
    if (P.isVisited(iso)) { Notify(c.name + ' is already visited, so it can\'t be on the Wanderlist.', 'error'); return; }
    const cur = P.place(iso), was = cur && cur.PlStatus === 'wish';
    const row = { ...(cur || {}), PlIso: iso, PlStatus: 'wish', PlPri: f.pri, PlTier: P.isTier(f.tier) ? f.tier : '', PlSee: f.see.split(',').map(s => s.trim()).filter(Boolean).join('|'), PlNote: f.note.trim(),
      PlSeq: was && cur.PlSeq ? cur.PlSeq : P.nextSeq(), PlPhoto: (cur && cur.PlPhoto) || '', PlAdded: was && cur.PlAdded ? cur.PlAdded : Today(), PlFirst: (cur && cur.PlFirst) || '', PlYear: (cur && cur.PlYear) || 0, PlWhy: (cur && cur.PlWhy) || '',
      PlGo: was ? (cur.PlGo || '') : '', PlGoYear: was ? (cur.PlGoYear || 0) : 0, PlGoDays: was ? (cur.PlGoDays || 0) : 0 };
    psave({ up: { PP_Places: [row] } }, was ? 'Wanderlist edited' : 'Wanderlist added', c.name + (row.PlTier ? ' · ' + row.PlTier : '')); closeSheet(l);
  } });
}
/** + Add / Edit a dream: one or more countries with one priority, tier, places and notes. It goes to Dreaming. */
export function openDream(l, d) {
  const h = d ? d.places[0] : null;
  const f = { isos: d ? d.isos.slice() : [], q: '', pri: d ? d.pri : 'M', tier: d && P.isTier(d.tier) ? d.tier : '', see: h && h.PlSee ? String(h.PlSee).split('|').join(', ') : '', note: (h && h.PlNote) || '' };
  const ok = c => c.iso !== P.homeIso() && !P.isVisited(c.iso) && !f.isos.includes(c.iso) && (P.status(c.iso) !== 'wish' || (d && d.isos.includes(c.iso)));
  openSheet(l, { title: d ? 'Edit · ' + P.dreamName(d) : 'Add to Wanderlist', body: () => {
    const sug = f.q.trim() ? P.search(f.q).filter(ok).slice(0, 6) : [];
    return html`<div data-t="wishForm">
      <div class="llab" style="margin-top:4px">Countries</div>
      <div class="pgw">${f.isos.map((x, i) => html`<span class="pgoc" data-t=${'dC-' + x}>${Flag(x, 16)}${P.BY[x].name}<b onClick=${() => { f.isos.splice(i, 1); rerender(); }} data-t=${'dX-' + x}>×</b></span>`)}</div>
      <div class="psrch" style="margin:8px 0 0"><input placeholder=${f.isos.length ? 'Search to add another country' : 'Search a country'} value=${f.q} onInput=${e => { f.q = e.target.value; rerender(); }} data-t="pickQ" /></div>
      ${sug.length ? html`<div class="psug">${sug.map(c => html`<div class="pcr" data-t=${'pick-' + c.iso} onClick=${() => { f.isos.push(c.iso); f.q = ''; rerender(); }}>${Flag(c.iso, 18)}<div><div class="t" style="font-size:13.5px">${c.name}</div><div class="s">${c.cont}</div></div></div>`)}</div>` : null}
      <div class="llab">Priority</div>${Seg([['H', 'High'], ['M', 'Medium'], ['L', 'Low']], f.pri, k => { f.pri = k; rerender(); }, 'wPri')}
      <div class="llab">Tier · budget</div>${TierPicker(f)}
      <div class="llab">Places to see · separate with commas</div><input class="lin" value=${f.see} onInput=${e => { f.see = e.target.value; }} data-t="wSee" />
      <div class="llab">Notes</div><textarea class="lin" value=${f.note} onInput=${e => { f.note = e.target.value; }} data-t="wNote"></textarea>
    </div>`;
  },
  saveLabel: d ? 'Save' : 'Add to Dreaming',
  onSave: () => {
    if (!f.isos.length) return Notify('Add at least one country.', 'error');
    if (f.isos.length > 1 && !P.srvAtLeast('3.11.1')) return Notify('Update the Apps Script to MansWell 3.11.1 to keep several countries in one dream.', 'error');
    const grp = f.isos.length > 1 ? (d && d.group) || newId('DR') : '';
    let seq = d ? d.seq : P.nextSeq();
    const rows = f.isos.map(x => { const cur = P.place(x), was = cur && cur.PlStatus === 'wish';
      return { ...(cur || {}), PlIso: x, PlStatus: 'wish', PlPri: f.pri, PlTier: P.isTier(f.tier) ? f.tier : '', PlSee: f.see.split(',').map(s => s.trim()).filter(Boolean).join('|'), PlNote: f.note.trim(), PlDream: grp,
        PlSeq: seq++, PlPhoto: (cur && cur.PlPhoto) || '', PlAdded: was && cur.PlAdded ? cur.PlAdded : Today(), PlFirst: (cur && cur.PlFirst) || '', PlYear: (cur && cur.PlYear) || 0, PlWhy: (cur && cur.PlWhy) || '',
        PlGo: was ? (cur.PlGo || '') : '', PlGoYear: was ? (cur.PlGoYear || 0) : 0, PlGoDays: was ? (cur.PlGoDays || 0) : 0 }; });
    const dropped = d ? d.places.filter(p => !f.isos.includes(p.PlIso)).map(p => ({ ...p, ...CLEAR })) : [];
    psave({ up: { PP_Places: [...rows, ...dropped] } }, d ? 'Wanderlist edited' : 'Wanderlist added', f.isos.map(x => P.BY[x].name).join(', ') + (rows[0].PlTier ? ' · ' + rows[0].PlTier : '')); closeSheet(l);
  } });
}
/** What "removed from the Wanderlist" writes on a country. */
export const CLEAR = { PlStatus: '', PlWhy: '', PlSee: '', PlNote: '', PlYear: 0, PlTier: '', PlGo: '', PlGoYear: 0, PlGoDays: 0, PlDream: '' };
/** Confirm I'm going: the dream's countries stay as they are; give the trip a name, dates and who with.
 *  It becomes an upcoming trip (Going + Voyage) and a journey after its end date. */
/** I'm going (simple): the year, how many days and the indicator. It stays in Wanderlist under Going; nothing is created in Voyage. */
export const lenOfDays = n => (n >= 22 ? '1' : n >= 15 ? '2' : n >= 8 ? '3' : '4');
export function openGoing(l, d) {
  if (!d) return;
  const y0 = new Date().getFullYear(), t0 = P.isTier(d.tier) ? d.tier : '';
  const mid = { 1: 24, 2: 18, 3: 10, 4: 5 };
  const f = { year: y0 + 1, days: Number((d.places.find(p => Number(p.PlGoDays)) || {}).PlGoDays) || (t0 && t0[0] !== 'S' ? mid[t0[1]] : 7), L: t0 ? t0[0] : '', s: t0 && t0[0] === 'S' ? t0 : 'S2' };
  const tier = () => (!f.L ? '' : f.L === 'S' ? f.s : f.L + lenOfDays(f.days));
  openSheet(l, { title: 'I\'m going', body: () => { const tr = tier(); return html`<div data-t="goingForm">
      <div class="llab" style="margin-top:4px">Countries</div>
      <div class="pgw">${d.isos.map(x => html`<span class="pgoc" data-t=${'goC-' + x}>${Flag(x, 16)}${P.BY[x].name}</span>`)}</div>
      <div class="llab">Year</div>${Seg([y0, y0 + 1, y0 + 2, y0 + 3].map(y => [y, String(y)]), f.year, y => { f.year = y; rerender(); }, 'goYear')}
      <div class="llab">How many days</div>
      <div class="pstep" data-t="goDays"><span onClick=${() => { f.days = Math.max(1, f.days - 1); rerender(); }} data-t="goDaysMinus">−</span><b data-t="goDaysN">${f.days}</b><span onClick=${() => { f.days = Math.min(90, f.days + 1); rerender(); }} data-t="goDaysPlus">+</span></div>
      <div class="llab">Indicator</div>
      <div class="pband">${P.TIER_LETTERS.map(x => html`<div class=${f.L === x ? 'on' : ''} style=${`--c:${P.TIER_COLOR[x]}`} onClick=${() => { f.L = f.L === x ? '' : x; rerender(); }} data-t=${'goTier-' + x}><b>${x}</b><span>${P.TIER_SHORT[x]}</span></div>`)}</div>
      ${f.L === 'S' ? html`<div class="llab">Budget level</div>${Seg(Object.keys(P.S_LEVELS).map(k => [k, k]), f.s, k => { f.s = k; rerender(); }, 'goS')}` : null}
      ${tr ? html`<div class="ptres" style=${`--c:${P.TIER_COLOR[tr[0]]}`} data-t="goTierRes">${TierBadge(tr, true)}<div><b>${P.tierText(tr)}</b><span>${f.L === 'S' ? 'S is set by budget only.' : 'Length comes from the days you pick.'}</span></div></div>` : null}
      <div class="lnote" style="margin-top:10px">It moves to <b>Going</b> in your Wanderlist.</div>
    </div>`; },
  saveLabel: 'Confirm · I\'m going',
  onSave: () => {
    const tr = tier();
    psave({ up: { PP_Places: d.places.map(p => ({ ...p, PlGo: 'going', PlGoYear: f.year, PlGoDays: f.days, PlTier: tr || p.PlTier || '' })) } }, 'Going', P.dreamName(d) + ' · ' + f.year + ' · ' + f.days + ' days');
    closeSheet(l);
  } });
}
/** Remove an upcoming trip from Going: the trip goes, its countries are back in Dreaming as the same dream. */
export function removeGoing(l, t) {
  confirmAsk(l, 'Remove ' + t.TrName + ' from Going?', 'Its countries go back to Dreaming. Anything planned in Voyage stays until you remove it there.', 'Remove', () => psave({ del: { PP_Trips: [t.TrId], PP_Stops: P.stopsOf(t.TrId).map(s => s.StKey) } }, 'Removed from Going', t.TrName));
}

/* ───────── add / edit a trip ───────── */
export function openTrip(id) { G.ppTrip = id; Navigate('scrPpTrip'); }
export function openTripEdit(l, t, preset = {}) {
  const stops = t ? P.routeOf(t).map(r => ({ iso: r.iso, days: r.days ? String(r.days) : '', places: r.places.join(', ') })) : (preset.isos || []).map(iso => ({ iso, days: '', places: '' }));
  const f = { name: t ? t.TrName : '', start: t ? t.TrStart : '', end: t ? t.TrEnd : '', with: t ? P.withList(t) : ['Solo'], desc: t ? t.TrDesc : '', mom: t ? t.TrMoments : '', notes: t ? t.TrNotes : '', stops, q: '' };
  const dur = () => (f.start && f.end && f.end >= f.start ? P.daysOf({ TrStart: f.start, TrEnd: f.end }) : 0);
  openSheet(l, { title: t ? 'Edit journey' : 'New journey', body: () => {
    const sug = f.q.trim() ? P.search(f.q).filter(c => !f.stops.some(s => s.iso === c.iso) && c.iso !== P.homeIso()).slice(0, 5) : [];
    const d = dur();
    return html`<div data-t="tripForm">
      <div class="llab" style="margin-top:4px">Journey name</div><input class="lin" placeholder="Indochina by land" value=${f.name} onInput=${e => { f.name = e.target.value; }} data-t="tName" />
      <div class="llab">Countries · in the order you went</div>
      ${f.stops.length ? html`<div class="lfx" style="padding:4px 12px">${f.stops.map((s, i) => html`<div class="pstop" data-t=${'stop-' + s.iso}>${Flag(s.iso, 18)}<div class="t">${P.BY[s.iso].name}</div>
        <input class="lin r" style="height:34px;font-size:13px" inputmode="numeric" placeholder="days" value=${s.days} onInput=${e => { s.days = e.target.value.replace(/\D/g, ''); }} data-t=${'stopDays-' + s.iso} />
        <span class="x" onClick=${() => { f.stops.splice(i, 1); rerender(); }} data-t=${'stopX-' + s.iso}>×</span>
        <input class="lin pstopp" placeholder=${'Places in ' + P.BY[s.iso].name + ', e.g. ' + (s.iso === 'VN' ? 'Hanoi, Ha Giang, Sapa' : 'city, city')} value=${s.places} onInput=${e => { s.places = e.target.value; }} data-t=${'stopPl-' + s.iso} /></div>`)}</div>` : null}
      <div class="psrch" style="margin:8px 0 0"><input placeholder=${f.stops.length ? 'Add another country' : 'Search a country'} value=${f.q} onInput=${e => { f.q = e.target.value; rerender(); }} data-t="tCountryQ" /></div>
      ${sug.length ? html`<div class="psug">${sug.map(c => html`<div class="pcr" data-t=${'tAdd-' + c.iso} onClick=${() => { f.stops.push({ iso: c.iso, days: '' }); f.q = ''; rerender(); }}>${Flag(c.iso, 18)}<div><div class="t" style="font-size:13.5px">${c.name}</div><div class="s">${c.cont}</div></div>${StPill(c.iso)}</div>`)}</div>` : null}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div class="llab">From</div><input class="lin" type="date" value=${f.start} max=${Today()} onInput=${e => { f.start = e.target.value; if (!f.end || f.end < f.start) f.end = f.start; rerender(); }} data-t="tStart" /></div>
        <div><div class="llab">To</div><input class="lin" type="date" value=${f.end} min=${f.start} onInput=${e => { f.end = e.target.value; rerender(); }} data-t="tEnd" /></div></div>
      <div class="lnote" style="margin-top:6px" data-t="tDur">${d ? plural(d, 'day') + ' in total' + (f.stops.length > 1 ? '. Days per country are optional.' : '.') : 'The length is worked out from the dates.'}</div>
      <div class="llab">Who with · pick one or more</div><div class="pseg" style="grid-template-columns:repeat(5,1fr)">${P.WITH.map(w => html`<span class=${f.with.includes(w) ? 'on' : ''} data-t=${'tWith-' + w} onClick=${() => { f.with = f.with.includes(w) ? f.with.filter(x => x !== w) : P.WITH.filter(x => x === w || f.with.includes(x)); rerender(); }}>${w}</span>`)}</div>
      <div class="llab">The story</div><textarea class="lin" placeholder="What the trip was about" value=${f.desc} onInput=${e => { f.desc = e.target.value; }} data-t="tDesc"></textarea>
      <div class="llab">My notes</div><textarea class="lin" placeholder="Visa, tips, what to do differently" value=${f.notes} onInput=${e => { f.notes = e.target.value; }} data-t="tNotes"></textarea>
      ${t ? null : html`<div class="lnote" style="margin-top:10px">Add photos on the journey page after saving.</div>`}
    </div>`;
  },
  saveLabel: 'Save journey',
  onSave: () => {
    const name = f.name.trim();
    if (!name) return Notify('Give the journey a name.', 'error');
    if (!f.stops.length) return Notify('Add at least one country.', 'error');
    if (!f.start || !f.end) return Notify('Choose the dates.', 'error');
    if (f.end < f.start) return Notify('The journey ends before it starts.', 'error');
    if (!f.with.length) return Notify('Choose who you went with.', 'error');
    if (f.start > Today()) return Notify('Journeys are trips you have taken. Put future ones on your Wanderlist.', 'error');
    const d = dur(), sum = f.stops.reduce((s, x) => s + (Number(x.days) || 0), 0);
    if (sum > d) return Notify('The days per country add up to ' + sum + ', but the journey is ' + d + ' days.', 'error');
    const id = t ? t.TrId : newId('TR');
    const row = { TrId: id, TrName: name, TrStart: f.start, TrEnd: f.end, TrWith: f.with.join(', '), TrDesc: f.desc.trim(), TrMoments: f.mom.trim(), TrNotes: f.notes.trim(), TrRoute: '', TrCover: t ? t.TrCover : '', TrAdded: t ? t.TrAdded : new Date().toISOString(), TrPlan: t ? t.TrPlan || '' : '' };
    const keep = f.stops.map((s, i) => ({ StKey: id + '|' + s.iso, StTrip: id, StIso: s.iso, StDays: Number(s.days) || 0, StSeq: i + 1, StRoute: P.splitPlaces(s.places).join(', ') }));
    const gone = t ? P.stopsOf(id).filter(s => !keep.some(k => k.StKey === s.StKey)).map(s => s.StKey) : [];
    psave({ up: { PP_Trips: [row], PP_Stops: keep }, del: gone.length ? { PP_Stops: gone } : {} }, t ? 'Journey edited' : 'Journey added', name + ' · ' + keep.map(k => k.StIso).join(', '));
    closeSheet(l);
    if (!t) openTrip(id);
  } });
}
/** Delete a trip (password): its photos go to the Drive bin, its countries go back to wishlist / not yet unless another trip has them. */
export function deleteTrip(l, t) {
  askPassword(l, 'delete ' + t.TrName + ' (' + plural(P.photosOf(t.TrId).length, 'photo') + ')', () => guard(async () => {
    if (!canWrite()) return;
    const ph = P.photosOf(t.TrId).map(p => p.PhId);
    if (ph.length) { if (!navigator.onLine) { Notify('Deleting a trip with photos needs the internet.', 'error'); return; } await PH.remove(ph); }
    await save({ del: { PP_Trips: [t.TrId], PP_Stops: P.stopsOf(t.TrId).map(s => s.StKey), PP_Photos: ph }, log: [{ AuAction: 'Atlas · Journey deleted', AuRef: 'PASSPORT', AuDetail: t.TrName }] });
    go('scrPpJourneys');
  }));
}

/* ───────── settings ───────── */
export function openSettings(l) {
  const f = { home: P.homeIso() };
  openSheet(l, { title: 'Atlas settings', body: () => html`<div data-t="ppSettings">
      <div class="llab" style="margin-top:4px">Home country</div>
      <select class="lin" value=${f.home} onChange=${e => { f.home = e.target.value; }} data-t="ppHome">${P.COUNTRIES.filter(c => !c.ex).map(c => html`<option value=${c.iso} selected=${c.iso === f.home}>${c.name}</option>`)}</select>
      <div class="lnote" style="margin-top:6px">Shown on the map, never counted as visited.</div>
      <div class="lfx" style="margin-top:14px"><div class="lnote"><b>Where your travel data lives.</b> In the same Google Sheet, in its own tabs (PP_…). Photos are saved privately in your Google Drive › <b>MansWell Passport</b>, one folder per journey. Atlas never reads or changes your money.</div></div>
    </div>`,
  onSave: () => { psave({ up: { PP_Settings: [P.prow('home', f.home)] } }, 'Home country', P.BY[f.home].name); closeSheet(l); } });
}
export { P, PH, store };
