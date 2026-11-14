// MansWell Passport · UI kit: the shell (header, five tabs), flags, the world map, and the sheets every tab shares
// (one country, add/edit a trip, a wish, pick a country, photo viewer, confirm). Same look and theme as Lens.
import { html, K, DB, NAV, I, Brand, Navigate, rerender, save, Notify, guard, Today, G, store } from '../core.js';
import { syncNow, PasswordDialog, askPassword } from '../shared.js';
import { css as lensCss, Sheet, openSheet, closeSheet, oa, ta, Cap, newId } from '../lens/ui.js';
import * as P from './engine.js';
import { MAP_W, MAP_H, SHAPES, OTHER, DOTS } from './geo.js';
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
.pstamps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.pstp{aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;position:relative;border:2px solid var(--s);color:var(--s);transform:rotate(var(--r));cursor:pointer}
.pstp:before{content:'';position:absolute;inset:4px;border-radius:50%;border:1px dashed var(--s);opacity:.7}.pstp.sq{border-radius:13px}.pstp.sq:before{border-radius:9px}
.pstp b{font:800 16px Inter,system-ui;letter-spacing:1px;display:block}.pstp span{font-size:7.5px;font-weight:700;letter-spacing:.8px;display:block}
.pstp.lock{--s:${K.line2};color:${K.mute}}
.pview{position:absolute;inset:0;z-index:60;background:rgba(0,0,0,.94);display:flex;flex-direction:column}
.pview .top{display:flex;justify-content:space-between;align-items:center;padding:16px 16px 8px;color:#fff;font-size:14px}.pview .top span{cursor:pointer;padding:6px}
.pview .im{flex:1;display:grid;place-items:center;padding:6px}.pview .im img{max-width:100%;max-height:100%;border-radius:6px}
.pview .bt{display:flex;gap:8px;padding:12px 16px 30px}.pview .bt button{flex:1;padding:12px;border-radius:12px;border:0;font:600 13px inherit;font-family:inherit;background:rgba(255,255,255,.1);color:#fff;cursor:pointer}.pview .bt button.d{color:#FF7A7E}
.pconf{position:absolute;inset:0;z-index:70;display:grid;place-items:center}.pconf .dim{position:absolute;inset:0;background:rgba(0,0,0,.6)}
.pconf .bx{position:relative;width:310px;background:${K.panel};border-radius:18px;padding:20px;box-shadow:inset 0 0 0 1px ${K.line2};color:${K.text}}
.pconf .bx b{display:block;font-size:16px}.pconf .bx p{font-size:13px;color:${K.sub};line-height:1.5;margin:8px 0 16px}.pconf .row{display:flex;gap:8px}
.pseg{display:grid;gap:4px;background:${K.field};border-radius:12px;padding:4px;box-shadow:inset 0 0 0 1px ${ta(.06)}}
.pseg span{text-align:center;font-size:12.5px;font-weight:600;color:${K.sub};padding:9px 0;border-radius:9px;cursor:pointer}.pseg span.on{background:${oa(.14)};color:${K.or};box-shadow:inset 0 0 0 1px ${oa(.5)}}
.pseg.dis span{cursor:default;opacity:.75}
textarea.lin{height:auto;min-height:74px;padding:10px 12px;line-height:1.45;font-weight:500;resize:vertical}
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
export function Page(l, active, kids, id) {
  if (G.ppOpenSettings) { G.ppOpenSettings = false; setTimeout(() => openSettings(l), 0); }
  return html`<div>
    <style>${css()}</style>
    ${Header(l)}
    <div class="lz" data-t=${id} id=${id}>${UpdateNote()}${kids}</div>
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
  const dots = Object.entries(DOTS).filter(([iso]) => P.BY[iso]);
  const selC = K.light ? K.text : '#FFE2B8';
  return html`<div class=${'pmap' + (o.live ? ' live' : '')} data-t=${'map-' + key} onClick=${tapStatic} style=${`height:${o.h || 180}px`}>
    <svg viewBox=${vbOf(st)} preserveAspectRatio="xMidYMid meet" onPointerDown=${down} onPointerMove=${move} onPointerUp=${up} onPointerCancel=${up} onWheel=${wheel}>
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
export const Legend = (s, extra) => html`<div class="pleg"><span><i style=${`background:${K.or}`}></i>Visited ${s ? s.n + s.extra : ''}</span><span><i style=${`background:${WISHC()}`}></i>Wanderlist ${s ? s.wish : ''}</span><span><i style=${`background:${K.light ? 'rgba(60,40,20,.45)' : ta(.55)}`}></i>Home</span><span><i style=${`background:${K.light ? 'rgba(60,40,20,.13)' : ta(.13)}`}></i>Not yet</span>${extra || null}</div>`;

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
  l.pview = { ph, o, src: null, err: '' }; rerender();
  PH.full(ph.PhId).then(s => { if (l.pview && l.pview.ph === ph) { l.pview.src = s; rerender(); } }).catch(e => { if (l.pview) { l.pview.err = e.message; rerender(); } });
}
function Viewer(l) {
  const v = l.pview; if (!v) return null;
  const close = () => { l.pview = null; rerender(); };
  const t = v.ph.PhTrip && P.trip(v.ph.PhTrip);
  const prev = v.src || PH.thumb(v.ph.PhId);
  return html`<div class="pview" data-t="viewer">
    <div class="top"><span onClick=${close} data-t="viewerClose">‹ Back</span><span style="font-size:12px;opacity:.8">${t ? t.TrName : ''}${v.ph.PhTaken ? ' · ' + P.fmtDay(v.ph.PhTaken) : ''}</span></div>
    <div class="im">${prev ? html`<img src=${prev} alt="" />` : html`<span style="color:#aaa;font-size:13px">${v.err || 'Loading…'}</span>`}</div>
    <div class="bt">
      ${t && v.o.cover !== false ? html`<button onClick=${() => { psave({ up: { PP_Trips: [{ ...t, TrCover: v.ph.PhId }] } }, 'Trip cover', t.TrName); close(); }} data-t="setCover">${t.TrCover === v.ph.PhId ? '✓ Cover' : 'Set as cover'}</button>` : null}
      ${v.o.onOpenTrip && t ? html`<button onClick=${() => { close(); v.o.onOpenTrip(t); }} data-t="openTrip">Open trip</button>` : null}
      ${v.o.del !== false ? html`<button class="d" data-t="photoDel" onClick=${() => confirmAsk(l, 'Delete this photo?', 'It is removed from the trip and moved to the bin in your Google Drive.', 'Delete', () => guard(async () => {
        if (!canWrite()) return;
        await PH.remove([v.ph.PhId]); await save({ del: { PP_Photos: [v.ph.PhId] }, up: t && t.TrCover === v.ph.PhId ? { PP_Trips: [{ ...t, TrCover: '' }] } : {}, log: [{ AuAction: 'Atlas · Photo deleted', AuRef: 'PASSPORT', AuDetail: t ? t.TrName : '' }] }); close();
      }))}>Delete</button>` : null}
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
        ${st === 'wish' ? html`<div style="margin-top:9px;display:flex;gap:8px"><span class="lbtn o" onClick=${() => { closeSheet(l); openWish(l, iso); }} data-t="cEditWish">Edit</span>${P.isGoing(pl) ? null : html`<span class="lbtn" onClick=${() => { closeSheet(l); openGoing(l, iso); }} data-t="cGoing">I'm going</span>`}</div>` : null}</div>` : null}
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
/** Step 2: you're going. Year and planned days; it then shows on Odyssey. */
export function openGoing(l, iso) {
  const c = P.BY[iso], pl = P.place(iso), y0 = new Date().getFullYear();
  const f = { year: pl && pl.PlGoYear ? pl.PlGoYear : y0 + 1, days: pl && pl.PlGoDays ? String(pl.PlGoDays) : '' };
  const yrs = [y0, y0 + 1, y0 + 2, y0 + 3];
  openSheet(l, { title: c.name + ' · I\'m going', body: () => html`<div data-t="goingForm">
      <div style="display:flex;gap:12px;align-items:center">${Flag(iso, 30)}<div><b style=${`font-size:16px;color:${K.text}`}>${c.name}</b><div class="lsub" style="margin:0">${P.isTier(pl.PlTier) ? pl.PlTier + ' · ' + P.tierText(pl.PlTier) : 'No tier yet'}</div></div></div>
      <div class="llab">Year</div>${Seg(yrs.map(y => [y, String(y)]), f.year, k => { f.year = k; rerender(); }, 'goYear')}
      <div class="llab">Planned days</div><input class="lin" inputmode="numeric" placeholder="e.g. 14" value=${f.days} onInput=${e => { f.days = e.target.value.replace(/\D/g, '').slice(0, 3); }} data-t="goDays" />
      <div class="lnote" style="margin-top:10px">It moves to <b>Going</b> and shows on Odyssey. When you're back, add the journey and ${c.name} becomes Visited by itself.</div>
    </div>`,
  saveLabel: P.isGoing(pl) ? 'Save' : 'Confirm · I\'m going',
  extra: P.isGoing(pl) ? () => html`<button class="lbtn" style="padding:13px 12px" data-t="goUndo" onClick=${() => { psave({ up: { PP_Places: [{ ...P.place(iso), PlGo: '', PlGoYear: 0, PlGoDays: 0 }] } }, 'Back to dreaming', c.name); closeSheet(l); }}>Not going</button>` : null,
  onSave: () => {
    const d = Number(f.days) || 0; if (!d || d > 365) return Notify('Enter how many days you plan, like 14.', 'error');
    psave({ up: { PP_Places: [{ ...P.place(iso), PlGo: 'going', PlGoYear: Number(f.year), PlGoDays: d }] } }, 'Going', c.name + ' · ' + f.year + ' · ' + d + ' days'); closeSheet(l);
  } });
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
      <div class="llab">Memorable moments · one per line</div><textarea class="lin" placeholder=${'Sunrise at Angkor Wat\nNight train to Hanoi'} value=${f.mom} onInput=${e => { f.mom = e.target.value; }} data-t="tMom"></textarea>
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
    const row = { TrId: id, TrName: name, TrStart: f.start, TrEnd: f.end, TrWith: f.with.join(', '), TrDesc: f.desc.trim(), TrMoments: f.mom.trim(), TrNotes: f.notes.trim(), TrRoute: '', TrCover: t ? t.TrCover : '', TrAdded: t ? t.TrAdded : new Date().toISOString() };
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
