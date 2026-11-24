// node test-planner.js : tests the pure logic block (/*LOGIC*/ ... /*ENDLOGIC*/) of index.html
var fs=require('fs'),assert=require('assert'),src=fs.readFileSync(__dirname+'/index.html','utf8');
var m=src.match(/\/\*LOGIC\*\/([\s\S]*?)\/\*ENDLOGIC\*\//);assert(m,'logic block');
var L=new Function(m[1]+';return{SIG_THR,SIG_CONF,SIG_W,SIG_NAME,sigThr,sigTol,sigBase,sigScore,sigStep,sigRaw,m15Move,aroonAgree,SV,SCALP,migrateC,sigStrength,aroonSigText,aroonSeg,aroonRow,aroon,aroonLabel,aroonNote,balKey,CS,plUsd,planCap,pnDefaultsFor,srcOf,touchCount,paperExpire,lbSpec,swings,fvgScan,lbLevels,planCount,rankSelect,paperOpen,paperClose,balGet,balAdd,balReset,closedRow,groupClose,plSummary,ptFmt,planResultRow,GD_AUTH,authCheck,authSessOk,pnCalc,pushHist,histAdd,histGet,hKey,HCAP,zoneStrat,planWhy,sigInfo,OT,pbEma,pbAtr,pbAgg,pbDir,pbStep,pbWalk,pbWhy,pbPlan,pbKey,pbStoreGet,pbStoreSet,pbPaperEval,PB_CAP,SW_BUF,SW_N,SW_K,SW_ATR,SW_NAME,swSwings,swLabel,swDir,swEvents,swLastLhHl,swAtr,swZones,swFvg,swLive,swInZone,swIsSweep,swTarget,swPlan,swChart,swEvaluate,swNorm,swClosed,swFlipBars,swPhtHm,FEED_TO_MS,FEED_STICK_MS,feedInit,feedPaperPaused,feedTryPrimary,feedFetch}')();var n=0;
function t(name,fn){fn();n++;console.log('ok',name)}
var base={price:4000,off:0,lot:0.01,slD:15,tpD:30,acct:80,dp:2,xau:true};
function c(k,o){var x={};for(var i in base)x[i]=base[i];x.k=k;if(o)for(var j in o)x[j]=o[j];return L.pnCalc(x)}
var DEF={mb:0,ms:0,bl:-10,sl:10,bs:10,ss:-10};
t('default offsets',function(){L.OT.forEach(function(o){assert.strictEqual(o[3],DEF[o[0]])})});
// [type, offset, entry, sl, tp]
[['mb',0,4000,3985,4030],['ms',0,4000,4015,3970],['bl',-10,3990,3975,4020],['sl',10,4010,4025,3980],['bs',10,4010,3995,4040],['ss',-10,3990,4005,3960]].forEach(function(r){
 t('type '+r[0]+' prices & direction',function(){var x=c(r[0],{off:r[1]});assert.strictEqual(x.ent,r[2]);assert.strictEqual(x.sl,r[3]);assert.strictEqual(x.tp,r[4]);
  var buy=r[0]=='mb'||r[0]=='bl'||r[0]=='bs';if(buy){assert(x.sl<x.ent&&x.tp>x.ent)}else{assert(x.sl>x.ent&&x.tp<x.ent)}
  assert.strictEqual(x.risk,15);assert.strictEqual(x.rew,30);assert.strictEqual(x.rr,2)})});
t('market ignores offset',function(){var x=c('mb',{off:99});assert.strictEqual(x.ent,4000)});
t('$ math 0.01 lot = $1 per $1; 0.05 lot SL 20',function(){var x=c('ms',{lot:0.05,slD:20,tpD:40,acct:1000});assert.strictEqual(x.risk,100);assert.strictEqual(x.rew,200);assert.deepStrictEqual(x.warn,[])});
t('no warnings when safe (SL 10, lot .01, acct 200)',function(){var x=c('bl',{slD:10,tpD:20,acct:200,off:-10});assert.strictEqual(x.risk,10);assert.deepStrictEqual(x.warn,[])});
t('warn risk>10% (default $15 on $80)',function(){var x=c('bl',{off:-10});assert(x.warn.some(function(w){return /over 10%/.test(w)}))});
t('risk exactly 10% is OK',function(){var x=c('bl',{off:-10,slD:10,tpD:20,acct:100});assert.strictEqual(x.risk,10);assert(!x.warn.some(function(w){return /over 10%/.test(w)}))});
t('warn lot>=0.03 on $80 (and $50), not on $200',function(){assert(c('mb',{lot:0.03}).warn.some(function(w){return /too big/.test(w)}));assert(c('mb',{lot:0.03,acct:50}).warn.some(function(w){return /too big/.test(w)}));assert(!c('mb',{lot:0.03,acct:200}).warn.some(function(w){return /too big/.test(w)}));assert(!c('mb',{lot:0.02}).warn.some(function(w){return /too big/.test(w)}))});
t('warn SL<10',function(){assert(c('mb',{slD:9.99,tpD:20}).warn.some(function(w){return /tighter than \$10/.test(w)}));assert(!c('mb',{slD:10,tpD:20,acct:500}).warn.some(function(w){return /tighter/.test(w)}))});
t('wrong-side offset warns',function(){assert(c('bl',{off:10}).warn.some(function(w){return /must be below/.test(w)}));assert(c('sl',{off:-10}).warn.some(function(w){return /must be above/.test(w)}));assert(c('bs',{off:-5}).warn.some(function(w){return /must be above/.test(w)}));assert(c('ss',{off:5}).warn.some(function(w){return /must be below/.test(w)}));assert(!c('ss',{off:-10}).warn.some(function(w){return /must be/.test(w)}))});
t('bad inputs',function(){assert(c('mb',{slD:0}).warn.length>0);assert(c('mb',{lot:0}).warn.some(function(w){return /Lot/.test(w)}));assert.strictEqual(c('mb',{price:null}).ok,false)});
t('rounding to symbol precision',function(){var x=c('bl',{price:4000.123,off:-10.005,dp:2});assert.strictEqual(x.ent,3990.12);var y=c('mb',{price:1.08123,slD:0.0015,tpD:0.003,dp:5,xau:false});assert.strictEqual(y.sl,1.07973);assert.strictEqual(y.tp,1.08423)});
t('planner $ math for non-XAU symbols (contract specs)',function(){
 var e=c('mb',{sym:'EURUSD',price:1.08,slD:0.005,tpD:0.01,dp:5,acct:200});assert.strictEqual(e.risk,5);assert.strictEqual(e.rew,10);assert(!e.warn.some(function(w){return /tighter/.test(w)}),'SL<$10 rule is XAU-only');
 var j2=c('mb',{sym:'USDJPY',price:150,slD:1.5,tpD:3,dp:3,acct:200});assert.strictEqual(j2.risk,10);assert.strictEqual(j2.rew,20);
 var b=c('ms',{sym:'BTCUSD',price:60000,slD:500,tpD:1000,dp:2,acct:200});assert.strictEqual(b.risk,5);assert.strictEqual(b.rew,10);
 var o=c('mb',{sym:'USOIL',price:80,slD:1,tpD:2,dp:3,acct:200});assert.strictEqual(o.risk,10);
 var u=c('mb',{sym:'US30',price:40000,slD:50,tpD:100,dp:2,acct:200});assert.strictEqual(u.risk,0.5);
 var big=c('mb',{sym:'EURUSD',price:1.08,slD:0.02,tpD:0.04,dp:5,acct:80});assert(big.warn.some(function(w){return /over 10%/.test(w)}))});
// history cap
t('history cap 30, newest first, oldest dropped',function(){var a=[];for(var i=1;i<=35;i++)a=L.pushHist(a,{i:i});assert.strictEqual(a.length,30);assert.strictEqual(a[0].i,35);assert.strictEqual(a[29].i,6)});
function mem(){var d={};return{getItem:function(k){return k in d?d[k]:null},setItem:function(k,v){d[k]=v},d:d}}
t('history stored per user, capped, survives reload',function(){var st=mem();for(var i=1;i<=40;i++)L.histAdd(st,'Daniel',{i:i,str:'x'});L.histAdd(st,'mophet',{i:1});
 assert.strictEqual(L.histGet(st,'daniel').length,30);assert.strictEqual(L.histGet(st,'daniel')[0].i,40);assert.strictEqual(L.histGet(st,'daniel')[29].i,11);assert.strictEqual(L.histGet(st,'mophet').length,1);assert.strictEqual(L.histAdd(st,'',{i:1}).length,0);assert.deepStrictEqual(Object.keys(st.d).sort(),['gdH3_daniel','gdH3_mophet'])});
t('oversized stored array is trimmed on read',function(){var st=mem(),a=[];for(var i=0;i<50;i++)a.push({i:i});st.setItem('gdH3_x',JSON.stringify(a));assert.strictEqual(L.histGet(st,'x').length,30);assert.strictEqual(L.histAdd(st,'x',{i:99}).length,30)});
t('corrupt storage is safe',function(){var st=mem();st.setItem('gdH3_x','{bad');assert.deepStrictEqual(L.histGet(st,'x'),[])});
// strategy labels
t('zone → strategy',function(){assert.strictEqual(L.zoneStrat('S1 pivot'),'Pivot bounce');assert.strictEqual(L.zoneStrat('P pivot'),'Pivot bounce');assert.strictEqual(L.zoneStrat('Day high'),'Day high/low reject');assert.strictEqual(L.zoneStrat('Day low'),'Day high/low reject');assert.strictEqual(L.zoneStrat('Bull FVG'),'FVG retest');assert.strictEqual(L.zoneStrat('Bear FVG'),'FVG retest');assert.strictEqual(L.zoneStrat('Round 4,000.00'),'Round-number reject')});
var SC=function(sc){return{score:sc,parts:[]}};
t('signal strategy label + reason',function(){var up={'1h':{d:1},'4h':{d:1}},a=L.sigInfo('BUY',SC(1.23),up);assert.strictEqual(a.name,'Momentum (30s-weighted, 1-10 min)');assert(/score \+1\.23/.test(a.why)&&/with 1H\/4H trend/.test(a.why));
 assert(/against 1H\/4H trend/.test(L.sigInfo('SELL',SC(-1.5),up).why));assert(!/trend/.test(L.sigInfo('BUY',SC(1.1),{'1h':{d:1},'4h':{d:-1}}).why));var w=L.sigInfo('WAIT',SC(0.4),up);assert.strictEqual(w.name,'No signal');assert(/inside ±1/.test(w.why))});
t('plan reason is one line, mentions trend + zone',function(){var w=L.planWhy(1,'S1 pivot',4800,2.1,function(x){return x.toFixed(2)});assert(!/\n/.test(w));assert(/Trend up on 1H\+4H/.test(w)&&/S1 pivot 4800\.00/.test(w)&&/R:R 1:2\.1/.test(w))});
// ---- past P/L log ----
function rowE(o){var b={sym:'XAUUSD',d:1,lot:0.01,ent:3500,ext:3510,xau:true,dp:2,str:'Manual',ot:Date.UTC(2026,10,20,1,0),t:Date.UTC(2026,10,20,3,30)};for(var k in o)b[k]=o[k];return L.closedRow(b)}
t('P/L BUY win: 10 pts x 0.01 lot = $10',function(){var r=rowE({});assert.strictEqual(r.k,'closed');assert.strictEqual(r.ty,'BUY');assert.strictEqual(r.pts,10);assert.strictEqual(r.pl,10)});
t('P/L BUY loss',function(){var r=rowE({ext:3485.5});assert.strictEqual(r.pts,-14.5);assert.strictEqual(r.pl,-14.5)});
t('P/L SELL win (price down)',function(){var r=rowE({d:-1,ext:3490});assert.strictEqual(r.ty,'SELL');assert.strictEqual(r.pts,10);assert.strictEqual(r.pl,10)});
t('P/L SELL loss (price up)',function(){var r=rowE({d:-1,ext:3520.25});assert.strictEqual(r.pts,-20.25);assert.strictEqual(r.pl,-20.25)});
t('P/L scales with lot (0.05 -> x5) and rounds to cents',function(){assert.strictEqual(rowE({lot:0.05}).pl,50);assert.strictEqual(rowE({lot:0.03,ext:3500.33}).pl,0.99)});
t('P/L breakeven = 0',function(){var r=rowE({ext:3500});assert.strictEqual(r.pts,0);assert.strictEqual(r.pl,0)});
t('non-XAU rows have $ P/L (EURUSD 25 pips x 0.01 lot = $2.50)',function(){var r=rowE({sym:'EURUSD',dp:5,ent:1.08,ext:1.0825});assert.strictEqual(r.pts,0.0025);assert.strictEqual(r.pl,2.5)});
t('row stores strategy, lot, times',function(){var r=rowE({str:'Pivot bounce'});assert.strictEqual(r.str,'Pivot bounce');assert.strictEqual(r.lot,0.01);assert.strictEqual(r.ot,Date.UTC(2026,10,20,1,0));assert.strictEqual(r.t,Date.UTC(2026,10,20,3,30))});
t('ptFmt shows PHT (UTC+8)',function(){assert.strictEqual(L.ptFmt(Date.UTC(2026,10,20,1,0)),'11-20 09:00');assert.strictEqual(L.ptFmt(Date.UTC(2026,10,20,17,5)),'11-21 01:05');assert.strictEqual(L.ptFmt(null),'—')});
t('groupClose: avg entry per side, summed lot',function(){var es=[{d:1,p:3500,lot:0.01,str:'A',ot:1000},{d:1,p:3510,lot:0.01,str:'A',ot:500},{d:-1,p:3520,lot:0.02,str:'B',ot:900}];
 var rs=L.groupClose(es,{sym:'XAUUSD',ext:3515,xau:true,dp:2,t:5000});assert.strictEqual(rs.length,2);var b=rs.filter(function(r){return r.d>0})[0],s=rs.filter(function(r){return r.d<0})[0];
 assert.strictEqual(b.ent,3505);assert.strictEqual(b.lot,0.02);assert.strictEqual(b.pts,10);assert.strictEqual(b.pl,20);assert.strictEqual(b.ot,500);assert.strictEqual(b.str,'A');
 assert.strictEqual(s.ent,3520);assert.strictEqual(s.lot,0.02);assert.strictEqual(s.pts,5);assert.strictEqual(s.pl,10)});
t('groupClose: mixed strategies -> Mixed; missing lot -> 0.01; missing ot ok',function(){var rs=L.groupClose([{d:1,p:100,str:'A'},{d:1,p:102,str:'B'}],{sym:'XAUUSD',ext:101,xau:true,dp:2,t:1});assert.strictEqual(rs.length,1);assert.strictEqual(rs[0].str,'Mixed');assert.strictEqual(rs[0].lot,0.02);assert.strictEqual(rs[0].ot,null);assert.strictEqual(rs[0].ent,101);assert.strictEqual(rs[0].pl,0)});
t('plan result rows: TP1/TP2/SL with R, BUY and SELL',function(){var P={d:1,ent:3500,sl:3490,t1:3515,t2:3530,rk:10,str:'FVG retest',why:'w',fl:1000,lot:0.01};
 var a=L.planResultRow(P,'TP1 hit',{sym:'XAUUSD',xau:true,dp:2,t:2000}),b=L.planResultRow(P,'TP2 hit',{sym:'XAUUSD',xau:true,dp:2,t:2000}),c2=L.planResultRow(P,'SL hit',{sym:'XAUUSD',xau:true,dp:2,t:2000});
 assert.strictEqual(a.ext,3515);assert.strictEqual(a.pl,15);assert.strictEqual(a.r,1.5);assert.strictEqual(a.res,'TP1');assert.strictEqual(b.pl,30);assert.strictEqual(b.r,3);assert.strictEqual(c2.ext,3490);assert.strictEqual(c2.pl,-10);assert.strictEqual(c2.r,-1);assert.strictEqual(c2.res,'SL');assert.strictEqual(c2.ot,1000);assert.strictEqual(c2.str,'FVG retest');
 var S={d:-1,ent:3500,sl:3510,t1:3485,t2:3470,rk:10,str:'Pivot bounce',lot:0.02},s1=L.planResultRow(S,'TP2 hit',{sym:'XAUUSD',xau:true,dp:2,t:1}),s2=L.planResultRow(S,'SL hit',{sym:'XAUUSD',xau:true,dp:2,t:1});assert.strictEqual(s1.pl,60);assert.strictEqual(s1.r,3);assert.strictEqual(s2.pl,-20);assert.strictEqual(s2.r,-1);assert.strictEqual(s2.ty,'SELL')});
t('summary: total, wins, losses, win rate; planner rows excluded',function(){var rows=[rowE({}),rowE({ext:3485.5}),rowE({d:-1,ext:3490}),rowE({ext:3500}),{k:'calc',ty:'BUY LIMIT'},{k:'plan',ty:'BUY LIMIT'}],s=L.plSummary(rows);
 assert.strictEqual(s.n,4);assert.strictEqual(s.total,5.5);assert.strictEqual(s.wins,2);assert.strictEqual(s.losses,1);assert.strictEqual(s.flat,1);assert.strictEqual(s.rate,2/3)});
t('summary: empty, and mixed-symbol rows add up in USD',function(){var e=L.plSummary([]);assert.strictEqual(e.n,0);assert.strictEqual(e.total,0);assert.strictEqual(e.rate,null);
 var s=L.plSummary([rowE({}),rowE({sym:'EURUSD',dp:5,ent:1.08,ext:1.07})]);assert.strictEqual(s.total,0);assert.strictEqual(s.wins,1);assert.strictEqual(s.losses,1);assert.strictEqual(s.noUsd,0)});
t('P/L log obeys the 30 cap, newest first, summary only over stored rows',function(){var st=mem();for(var i=1;i<=35;i++)L.histAdd(st,'dan',rowE({ext:3500+i,t:i}));var a=L.histGet(st,'dan');assert.strictEqual(a.length,30);assert.strictEqual(a[0].pts,35);assert.strictEqual(a[29].pts,6);
 var s=L.plSummary(a);assert.strictEqual(s.n,30);assert.strictEqual(s.wins,30);var tot=0;for(var j=6;j<=35;j++)tot+=j;assert.strictEqual(s.total,+tot.toFixed(2))});
// ---- multi-plan: lookback windows ----
var NOW=Date.UTC(2026,10,20,6,0),H=3600e3,D=864e5;
function bar(t,o,h,l,c){return{openTime:new Date(t).toISOString(),open:o,high:h,low:l,close:c,isOpen:false}}
function series(iv,n,f){var step={'5m':300e3,'1h':H,'4h':4*H,'1d':D}[iv],a=[];for(var i=n-1;i>=0;i--){var t=NOW-i*step-step;a.push(f(t,n-1-i))}return a}
var DATA={'5m':series('5m',400,function(t,i){var b=3500+Math.sin(i/9)*10;return bar(t,b,b+2,b-2,b+0.5)}),'1h':series('1h',200,function(t,i){var b=3500+Math.sin(i/6)*20;return bar(t,b,b+3,b-3,b)}),'4h':series('4h',60,function(t,i){var b=3500+i;return bar(t,b,b+5,b-5,b+1)}),'1d':series('1d',40,function(t,i){var b=3400+i*3;return bar(t,b,b+30,b-30,b+4)})};
t('lookback specs: 24h / 7d / 30d (and unknown -> 24h)',function(){var a=L.lbSpec('24h'),b=L.lbSpec('7d'),c=L.lbSpec('30d');assert.deepStrictEqual([a.w,a.ms,a.range,a.swing,a.fvg],['24h',D,'5m','1h',['1h','4h']]);assert.deepStrictEqual([b.w,b.ms,b.range,b.swing,b.fvg],['7d',7*D,'1h','4h',['4h','1d']]);assert.deepStrictEqual([c.w,c.ms,c.range,c.swing,c.fvg],['30d',30*D,'1d','1d',['1d']]);assert.strictEqual(L.lbSpec('zzz').w,'24h');assert.strictEqual(a.n5,288);assert.strictEqual(b.n5,2016);assert.strictEqual(c.n5,8640)});
t('24h window: range from 5m bars of the last 24h only (older bars ignored)',function(){var d={'5m':DATA['5m'].slice(),'1h':DATA['1h'],'4h':DATA['4h'],'1d':DATA['1d']};d['5m'][0]=bar(NOW-30*H,3000,9000,100,3000);var r=L.lbLevels(L.lbSpec('24h'),d,NOW,1);assert(r.hi<3600&&r.lo>3400,'old spike ignored');assert(r.n<=289&&r.n>=287);assert.strictEqual(r.src.range,'5m');assert.strictEqual(r.src.swing,'1h')});
t('7d window: range from 1h bars (168), swings from 4h, FVG from 4h/1d',function(){var r=L.lbLevels(L.lbSpec('7d'),DATA,NOW,1);assert(r.n>=167&&r.n<=169);assert.strictEqual(r.src.range,'1h');assert.strictEqual(r.src.swing,'4h');assert.deepStrictEqual(r.src.fvg,['4h','1d']);var hs=DATA['1h'].filter(function(b){return Date.parse(b.openTime)>=NOW-7*D});assert.strictEqual(r.hi,Math.max.apply(0,hs.map(function(b){return b.high})))});
t('30d window: only daily bars, 30 of them',function(){var r=L.lbLevels(L.lbSpec('30d'),DATA,NOW,1);assert(r.n>=29&&r.n<=30);assert.strictEqual(r.src.range,'1d');assert.strictEqual(r.src.swing,'1d');assert.deepStrictEqual(r.src.fvg,['1d']);assert.strictEqual(r.lo,Math.min.apply(0,DATA['1d'].filter(function(b){return Date.parse(b.openTime)>=NOW-30*D}).map(function(b){return b.low})))});
t('windows give different ranges (24h < 7d < 30d on trending data)',function(){var a=L.lbLevels(L.lbSpec('24h'),DATA,NOW,1),b=L.lbLevels(L.lbSpec('7d'),DATA,NOW,1),c=L.lbLevels(L.lbSpec('30d'),DATA,NOW,1);assert(a.hi-a.lo<c.hi-c.lo);assert(b.hi-b.lo<c.hi-c.lo+1)});
t('swings: fractal highs/lows, last k bars unconfirmed',function(){var v=[5,6,9,6,5,4,2,4,5,6,8],bs=v.map(function(x,i){return bar(NOW+i*H,x,x+0.1,x-0.1,x)});var s=L.swings(bs,2);var hs=s.filter(function(x){return x.k=='H'}),ls=s.filter(function(x){return x.k=='L'});assert.strictEqual(hs.length,1);assert(Math.abs(hs[0].p-9.1)<1e-9);assert.strictEqual(ls.length,1);assert(Math.abs(ls[0].p-1.9)<1e-9);assert.deepStrictEqual(L.swings(bs.slice(0,3),2),[])});
t('fvgScan: bull and bear gaps, filled gaps dropped',function(){var c=[bar(0,10,11,9,10),bar(1,11,14,11,13),bar(2,14,16,13,15),bar(3,15,17,13.9,16)];var g=L.fvgScan(c,0.1);assert.strictEqual(g.length,1);assert.strictEqual(g[0].t,1);assert.strictEqual(g[0].lo,11);assert.strictEqual(g[0].hi,13);
 var c2=c.concat([bar(4,16,16,10.5,11)]);assert.strictEqual(L.fvgScan(c2,0.1).length,0);var bc=[bar(0,20,21,19,20),bar(1,19,19,16,17),bar(2,17,17,15,16),bar(3,16,16.5,15.5,16)];var gb=L.fvgScan(bc,0.1);assert.strictEqual(gb.length,1);assert.strictEqual(gb[0].t,-1);assert.strictEqual(gb[0].lo,17);assert.strictEqual(gb[0].hi,19)});
// ---- count rule ----
t('count rule: quiet=3, ranging=3, normal=4, volatile=5, trending=5',function(){var n5=288,a=1,sq=Math.sqrt(n5);function N(r,tr){var rg=r*a*sq;return L.planCount({hi:rg,lo:0,net:tr*rg},a,n5)}
 assert.strictEqual(N(0.7,0.4),3);assert.strictEqual(N(1.3,0.1),3);assert.strictEqual(N(1.3,0.4),4);assert.strictEqual(N(1.0,0.5),4);assert.strictEqual(N(2.0,0.1),5);assert.strictEqual(N(1.3,0.7),5);assert.strictEqual(N(0.7,0.8),3);assert.strictEqual(L.planCount({hi:5,lo:5,net:0},1,288),3);assert.strictEqual(L.planCount(null,1,288),3)});
t('count rule works with each window size',function(){['24h','7d','30d'].forEach(function(w){var sp=L.lbSpec(w),sq=Math.sqrt(sp.n5),a=2;assert.strictEqual(L.planCount({hi:0.8*a*sq,lo:0,net:0.4*0.8*a*sq},a,sp.n5),3,w);assert.strictEqual(L.planCount({hi:1.3*a*sq,lo:0,net:0.4*1.3*a*sq},a,sp.n5),4,w);assert.strictEqual(L.planCount({hi:2*a*sq,lo:0,net:0.4*2*a*sq},a,sp.n5),5,w)})});
// ---- selection / spacing ----
function cd(p,k,n,tc){return{p:p,f:p,k:k,n:n||k,touches:tc||0}}
var OK=function(){return true};
t('select: ranked by confluence, never more than N, side/dup-free',function(){var cs=[cd(3490,'pivot','S1 pivot'),cd(3490.2,'fvg','Bull FVG'),cd(3480,'round','Round 3480'),cd(3470,'swing','Swing low'),cd(3460,'range','Range low (24h)'),cd(3450,'dayhl','Day low')];
 var r=L.rankSelect(cs,{m:3500,d:1,a:1,N:3,sp:0.5,ok:OK});assert.strictEqual(r.length,3);assert.strictEqual(r[0].k=='pivot'||r[0].k=='fvg',true);assert(r[0].kinds.length>=2,'confluence first');assert(/ \+ /.test(r[0].zn))});
t('select: spacing >= 0.5 ATR, no duplicates',function(){var cs=[cd(3490,'pivot'),cd(3490.3,'round'),cd(3489.6,'swing'),cd(3489.2,'fvg'),cd(3480,'dayhl')];var r=L.rankSelect(cs,{m:3500,d:1,a:2,N:5,sp:0.5,ok:OK});for(var i=0;i<r.length;i++)for(var j=i+1;j<r.length;j++)assert(Math.abs(r[i].p-r[j].p)>=0.5*2-1e-9);assert.strictEqual(r.length,2)});
t('select: fewer zones than N -> fewer plans, nothing invented',function(){var r=L.rankSelect([cd(3490,'pivot'),cd(3470,'swing')],{m:3500,d:1,a:1,N:5,sp:0.5,ok:OK});assert.strictEqual(r.length,2);assert.deepStrictEqual(L.rankSelect([],{m:3500,d:1,a:1,N:5,sp:0.5,ok:OK}),[])});
t('select: ok() filter (e.g. R:R) drops candidates',function(){var cs=[cd(3490,'pivot'),cd(3470,'swing'),cd(3450,'range')];var r=L.rankSelect(cs,{m:3500,d:1,a:1,N:3,sp:0.5,ok:function(c){return c.p!=3470}});assert.deepStrictEqual(r.map(function(x){return x.p}).sort(),[3450,3490])});
t('select: touches raise strength, near beats far on ties, SELL side works',function(){var r=L.rankSelect([cd(3490,'pivot','a',0),cd(3470,'pivot','b',3)],{m:3500,d:1,a:1,N:1,sp:0.5,ok:OK});assert.strictEqual(r[0].p,3470);var r2=L.rankSelect([cd(3510,'pivot'),cd(3560,'pivot')],{m:3500,d:-1,a:1,N:1,sp:0.5,ok:OK});assert.strictEqual(r2[0].p,3510);assert.strictEqual(L.rankSelect([cd(3490,'pivot')],{m:3500,d:-1,a:1,N:3,sp:0.5,ok:OK}).length,0)});
t('select: quiet=3 / normal=4 / volatile=5 caps the list',function(){var cs=[];for(var i=1;i<=8;i++)cs.push(cd(3500-i*10,'pivot'));[3,4,5].forEach(function(N){assert.strictEqual(L.rankSelect(cs,{m:3500,d:1,a:1,N:N,sp:0.5,ok:OK}).length,N)})});
t('strategy labels for new zone types',function(){assert.strictEqual(L.zoneStrat('Swing low'),'Swing high/low reject');assert.strictEqual(L.zoneStrat('Range high (24h)'),'Range edge reject');assert.strictEqual(L.zoneStrat('S1 pivot + Round 3,500.00'),'Pivot bounce');assert.strictEqual(L.zoneStrat('Round 3,500.00 + Bull FVG'),'FVG retest');assert.strictEqual(L.zoneStrat('Swing low + Range low (7d)'),'Swing high/low reject')});
// ---- paper trading ----
function pl(d){return {d:d,ent:3500,sl:3500-d*10,t1:3500+d*15,t2:3500+d*30,rk:10,str:'FVG retest',why:'w',fl:1000}}
var PC={sym:'XAUUSD',xau:true,dp:2,t:5000};
t('paper BUY: open at entry, TP1 closes half, TP2 closes the rest',function(){var p=pl(1);var pt=L.paperOpen(p,0.02,1000);assert.strictEqual(pt.lot,0.02);var a=L.paperClose(p,'TP1 hit',PC),b=L.paperClose(p,'TP2 hit',PC);assert.strictEqual(a.length,1);assert.strictEqual(a[0].lot,0.01);assert.strictEqual(a[0].pl,15);assert.strictEqual(a[0].res,'TP1');assert.strictEqual(a[0].r,1.5);assert(a[0].paper);assert.strictEqual(b[0].lot,0.01);assert.strictEqual(b[0].pl,30);assert.strictEqual(b[0].r,3);assert.strictEqual(L.paperClose(p,'SL hit',PC).length,0)});
t('paper SELL: TP1/TP2 profit, SL loss',function(){var p=pl(-1);L.paperOpen(p,0.01,1000);var a=L.paperClose(p,'TP1 hit',PC);assert.strictEqual(a[0].ty,'SELL');assert.strictEqual(a[0].lot,0.005);assert.strictEqual(a[0].pl,7.5);var q=pl(-1);L.paperOpen(q,0.01,1);var s=L.paperClose(q,'SL hit',PC);assert.strictEqual(s[0].pl,-10);assert.strictEqual(s[0].r,-1);assert.strictEqual(s[0].ext,3510)});
t('paper BUY SL: full loss; SL after TP1 only closes the remaining half',function(){var p=pl(1);L.paperOpen(p,0.01,1);var s=L.paperClose(p,'SL hit',PC);assert.strictEqual(s[0].pl,-10);assert.strictEqual(s[0].ty,'BUY');var q=pl(1);L.paperOpen(q,0.01,1);var a=L.paperClose(q,'TP1 hit',PC),b=L.paperClose(q,'SL hit',PC);assert.strictEqual(a[0].pl,7.5);assert.strictEqual(b[0].pl,-5);assert.strictEqual(+(a[0].pl+b[0].pl).toFixed(2),2.5)});
t('paper: no trade opened -> nothing closes (unfilled / expired)',function(){var p=pl(1);assert.strictEqual(L.paperClose(p,'SL hit',PC).length,0);assert.strictEqual(L.paperClose(p,'TP2 hit',PC).length,0)});
t('paper non-XAU: $ via contract size',function(){var p={d:1,ent:1.08,sl:1.07,t1:1.095,t2:1.11,rk:0.01,str:'x',fl:1};L.paperOpen(p,0.01,1);var r=L.paperClose(p,'SL hit',{sym:'EURUSD',dp:5,t:2});assert.strictEqual(r[0].pl,-10);assert.strictEqual(r[0].pts,-0.01)});
t('paper balance: starts at account, updated by P/L both ways, reset, per user',function(){var st=mem();assert.strictEqual(L.balGet(st,'dan',80).bal,80);L.balAdd(st,'dan',15,80);assert.strictEqual(L.balGet(st,'dan',80).bal,95);L.balAdd(st,'dan',-30.25,80);assert.strictEqual(L.balGet(st,'dan',80).bal,64.75);L.balAdd(st,'dan',null,80);assert.strictEqual(L.balGet(st,'dan',80).bal,64.75);assert.strictEqual(L.balGet(st,'other',50).bal,50);L.balReset(st,'dan',120);assert.strictEqual(L.balGet(st,'dan',80).bal,120);assert.strictEqual(L.balGet(st,'dan',80).start,120);L.balAdd(st,'dan',-200,80);assert.strictEqual(L.balGet(st,'dan',80).bal,-80)});
t('paper full cycle: rows summarise + balance matches',function(){var st=mem(),p=pl(1),q=pl(-1),rows=[];L.paperOpen(p,0.01,1);L.paperOpen(q,0.01,1);rows=rows.concat(L.paperClose(p,'TP1 hit',PC),L.paperClose(p,'TP2 hit',PC),L.paperClose(q,'SL hit',PC));rows.forEach(function(r){L.balAdd(st,'dan',r.pl,80)});var s=L.plSummary(rows);assert.strictEqual(s.total,12.5);assert.strictEqual(s.wins,2);assert.strictEqual(s.losses,1);assert.strictEqual(L.balGet(st,'dan',80).bal,92.5)});
t('select: taken prices (existing plans) are skipped by spacing',function(){var cs=[cd(3490,'pivot'),cd(3480,'pivot'),cd(3470,'pivot')];var r=L.rankSelect(cs,{m:3500,d:1,a:1,N:3,sp:0.5,taken:[3490.2],ok:OK});assert.deepStrictEqual(r.map(function(x){return x.p}).sort(),[3470,3480])});
t('touchCount: bars whose high/low are near the level',function(){var bs=[bar(0,10,12,9,11),bar(1,11,13,10,12),bar(2,12,12.1,11,12)];assert.strictEqual(L.touchCount(12,bs,0.2),2);assert.strictEqual(L.touchCount(9,bs,0.2),1);assert.strictEqual(L.touchCount(50,bs,0.2),0)});
t('paper time exit at expiry: closes remaining at market, both sides',function(){var p=pl(1);L.paperOpen(p,0.01,1);var r=L.paperExpire(p,3504,PC);assert.strictEqual(r[0].res,'Expired');assert.strictEqual(r[0].pl,4);assert.strictEqual(r[0].r,0.4);assert.strictEqual(L.paperExpire(p,3504,PC).length,0);var q=pl(-1);L.paperOpen(q,0.01,1);assert.strictEqual(L.paperExpire(q,3504,PC)[0].pl,-4);assert.strictEqual(L.paperExpire(pl(1),3504,PC).length,0)});
// ---- contract specs ----
var SPEC={XAUUSD:100,XAGUSD:5000,XPTUSD:100,EURUSD:100000,GBPUSD:100000,AUDUSD:100000,NZDUSD:100000,USDJPY:100000,USDCAD:100000,USDCHF:100000,BTCUSD:1,ETHUSD:1,US30:1,USTEC:1,US500:1,USOIL:1000,AAPL:1,TSLA:1,NVDA:1,MSFT:1};
t('contract sizes for all 20 symbols (USD-quoted: 1 lot x 1 point)',function(){Object.keys(SPEC).forEach(function(k){assert(L.CS[k],'spec for '+k);var q=L.CS[k].q!='USD';if(!q)assert.strictEqual(L.plUsd(k,1,1,1),SPEC[k],k);assert.strictEqual(L.CS[k].size,SPEC[k],k)});assert.strictEqual(Object.keys(L.CS).length,20)});
t('quote-currency conversion: USDJPY/USDCAD/USDCHF divide by the live rate',function(){assert(Math.abs(L.plUsd('USDJPY',1,1,150)-100000/150)<1e-6);assert(Math.abs(L.plUsd('USDCAD',0.002,0.5,1.4)-0.002*0.5*100000/1.4)<1e-6);assert(Math.abs(L.plUsd('USDCHF',-0.001,1,0.9)+100/0.9)<1e-6);assert.strictEqual(L.plUsd('EURUSD',0.0001,1,1.08),10)});
t('XAU 0.01 lot = $1 per $1 move; unknown symbol -> null',function(){assert.strictEqual(L.plUsd('XAUUSD',1,0.01,3500),1);assert.strictEqual(L.plUsd('XAUUSD',-14.5,0.01,3500),-14.5);assert.strictEqual(L.plUsd('NOPE',1,1,1),null)});
t('closedRow USDJPY: 50 pips x 0.01 lot converted at exit price',function(){var r=rowE({sym:'USDJPY',dp:3,ent:150,ext:150.5});assert.strictEqual(r.pts,0.5);assert.strictEqual(r.pl,3.32);var s=rowE({sym:'USDJPY',d:-1,dp:3,ent:150,ext:150.5});assert.strictEqual(s.pl,-3.32)});
t('closedRow other specs: silver, oil, BTC, stock, index',function(){assert.strictEqual(rowE({sym:'XAGUSD',dp:3,ent:30,ext:30.5}).pl,25);assert.strictEqual(rowE({sym:'USOIL',dp:3,ent:80,ext:81,lot:0.1}).pl,100);assert.strictEqual(rowE({sym:'BTCUSD',dp:2,ent:60000,ext:60500,lot:0.05}).pl,25);assert.strictEqual(rowE({sym:'AAPL',dp:2,ent:200,ext:205,lot:1}).pl,5);assert.strictEqual(rowE({sym:'US500',dp:2,ent:7000,ext:6990,lot:0.2}).pl,-2)});
t('planner defaults scale by symbol price (XAU = 10 / 15)',function(){var g=L.pnDefaultsFor('XAUUSD',3500);assert.deepStrictEqual([g.off,g.slD],[10,15]);var e=L.pnDefaultsFor('EURUSD',1.08);assert(e.slD>0.003&&e.slD<0.006,'eur sl '+e.slD);assert(e.off>0&&e.off<e.slD);var b=L.pnDefaultsFor('BTCUSD',60000);assert(b.slD>200&&b.slD<300)});
// ---- distance cap ----
t('plan cap: 3x 4h ATR scaled by expiry; falls back to 5m ATR',function(){assert.strictEqual(L.planCap(40,10,4),120);assert.strictEqual(+L.planCap(40,10,16).toFixed(6),240);assert.strictEqual(L.planCap(40,10,1),60);var f=L.planCap(null,10,4);assert(Math.abs(f-3*10*Math.sqrt(48))<1e-6);assert.strictEqual(L.planCap(null,null,4),Infinity)});
t('select: candidates beyond the distance cap are dropped (fewer plans, never invented)',function(){var cs=[cd(3490,'pivot'),cd(3450,'pivot'),cd(3350,'pivot'),cd(3300,'swing')];var r=L.rankSelect(cs,{m:3500,d:1,a:1,N:5,sp:0.5,maxDist:120,ok:OK});assert.deepStrictEqual(r.map(function(x){return x.p}).sort(),[3450,3490]);assert.strictEqual(L.rankSelect(cs,{m:3500,d:1,a:1,N:5,sp:0.5,maxDist:10,ok:OK}).length,1);assert.strictEqual(L.rankSelect(cs,{m:3500,d:-1,a:1,N:5,sp:0.5,maxDist:120,ok:OK}).length,0);assert.strictEqual(L.rankSelect(cs,{m:3500,d:1,a:1,N:5,sp:0.5,ok:OK}).length,4)});
t('cap uses reachable zones only for confluence (far zone cannot boost a near one)',function(){var r=L.rankSelect([cd(3495,'pivot'),cd(3494.8,'fvg')],{m:3500,d:1,a:1,N:2,sp:0.5,maxDist:5.1,ok:OK});assert.strictEqual(r.length,1);assert.strictEqual(r[0].kinds.length,1);var r2=L.rankSelect([cd(3495,'pivot'),cd(3494.8,'fvg')],{m:3500,d:1,a:1,N:2,sp:0.5,maxDist:6,ok:OK});assert.strictEqual(r2[0].kinds.length,2)});
// ---- separate balances: auto vs manual ----
t('srcOf: explicit src, else paper flag, else manual',function(){assert.strictEqual(L.srcOf({src:'auto'}),'auto');assert.strictEqual(L.srcOf({src:'manual',paper:true}),'manual');assert.strictEqual(L.srcOf({paper:true}),'auto');assert.strictEqual(L.srcOf({}),'manual')});
t('rows carry src: paper plan rows = auto, manual close rows = manual',function(){var p=pl(1);L.paperOpen(p,0.01,1);assert.strictEqual(L.paperClose(p,'SL hit',PC)[0].src,'auto');var q=pl(1);L.paperOpen(q,0.01,1);assert.strictEqual(L.paperExpire(q,3504,PC)[0].src,'auto');assert.strictEqual(L.groupClose([{d:1,p:100}],{sym:'XAUUSD',ext:101,dp:2,t:1})[0].src,'manual')});
t('auto and manual balances are separate, each starts at the account',function(){var st=mem();assert.strictEqual(L.balGet(st,'dan',80,'a').bal,80);assert.strictEqual(L.balGet(st,'dan',80,'m').bal,80);L.balAdd(st,'dan',15,80,'a');L.balAdd(st,'dan',-5,80,'m');assert.strictEqual(L.balGet(st,'dan',80,'a').bal,95);assert.strictEqual(L.balGet(st,'dan',80,'m').bal,75);L.balReset(st,'dan',120,'a');assert.strictEqual(L.balGet(st,'dan',80,'a').bal,120);assert.strictEqual(L.balGet(st,'dan',80,'m').bal,75);assert.notStrictEqual(L.balKey('dan','a'),L.balKey('dan','m'))});
t('balance keeps its own total P/L, wins, losses (win rate) since reset',function(){var st=mem();[10,-4,6,-2,0].forEach(function(v){L.balAdd(st,'dan',v,80,'a')});var o=L.balGet(st,'dan',80,'a');assert.strictEqual(o.bal,90);assert.strictEqual(+(o.bal-o.start).toFixed(2),10);assert.strictEqual(o.w,2);assert.strictEqual(o.l,2);L.balAdd(st,'dan',3,80,'m');var m=L.balGet(st,'dan',80,'m');assert.strictEqual(m.w,1);assert.strictEqual(m.l,0);L.balReset(st,'dan',80,'a');var z=L.balGet(st,'dan',80,'a');assert.strictEqual(z.w,0);assert.strictEqual(z.l,0);assert.strictEqual(L.balGet(st,'dan',80,'m').w,1)});
t('Past P/L filter All / Auto / Manual',function(){var rows=[rowE({}),Object.assign(rowE({ext:3490}),{src:'auto',paper:true}),Object.assign(rowE({ext:3520}),{src:'auto',paper:true}),{k:'calc',ty:'BUY LIMIT'}];var all=L.plSummary(rows),au=L.plSummary(rows.filter(function(r){return L.srcOf(r)=='auto'&&r.k=='closed'})),ma=L.plSummary(rows.filter(function(r){return L.srcOf(r)=='manual'&&r.k=='closed'}));assert.strictEqual(all.n,3);assert.strictEqual(au.n,2);assert.strictEqual(ma.n,1);assert.strictEqual(au.total,10);assert.strictEqual(ma.total,10);assert.strictEqual(all.total,20)});
var PW=process.env.GD_PW;
async function authTests(){
 if(!PW){console.log('SKIP auth tests (set GD_PW to run)');return}
 var ok=await L.authCheck('Dan',PW);assert(ok&&ok===L.GD_AUTH.h);n++;console.log('ok auth: correct password');
 assert.strictEqual(await L.authCheck('dan ',PW),ok);n++;console.log('ok auth: username case/space-insensitive');
 assert.strictEqual(await L.authCheck('Dan',PW+'x'),null);assert.strictEqual(await L.authCheck('Dan',PW.toLowerCase()),null);assert.strictEqual(await L.authCheck('Dan',''),null);n++;console.log('ok auth: wrong password rejected');
 assert.strictEqual(await L.authCheck('daniel',PW),null);assert.strictEqual(await L.authCheck('',PW),null);n++;console.log('ok auth: wrong username rejected');
 assert(L.authSessOk({u:'dan',k:L.GD_AUTH.h}));assert(!L.authSessOk({u:'dan',k:'x'}));assert(!L.authSessOk({u:'dan'}));assert(!L.authSessOk(null));n++;console.log('ok auth: stored session must carry the hash');
 assert(src.split(L.GD_AUTH.name).join('').toLowerCase().indexOf(PW.toLowerCase())<0,'no plaintext in source (besides the display name)');assert(/^[0-9a-f]{32}$/.test(L.GD_AUTH.salt)&&L.GD_AUTH.it>=100000);n++;console.log('ok auth: salted PBKDF2, no plaintext in source')}

// Aroon(14)
function bars(hs,ls){return hs.map(function(h,i){return{high:h,low:ls[i]}})}
function flat(n){var h=[],l=[];for(var i=0;i<n;i++){h.push(100);l.push(50)}return{h:h,l:l}}
t('aroon: high on newest bar → Up 100; low 14 bars ago → Down 0',function(){var f=flat(15);f.h[14]=120;f.l[0]=40;var a=L.aroon(bars(f.h,f.l),14);assert.strictEqual(a.up,100);assert.strictEqual(a.down,0)});
t('aroon: high 14 bars ago → Up 0; low on newest → Down 100',function(){var f=flat(15);f.h[0]=120;f.l[14]=40;var a=L.aroon(bars(f.h,f.l),14);assert.strictEqual(a.up,0);assert.strictEqual(a.down,100)});
t('aroon: exact values for high 3 bars ago, low 7 bars ago',function(){var f=flat(15);f.h[11]=130;f.l[7]=30;var a=L.aroon(bars(f.h,f.l),14);assert.strictEqual(a.up,100*(14-3)/14);assert.strictEqual(a.down,100*(14-7)/14)});
t('aroon: only the last 15 bars count (older extremes ignored)',function(){var f=flat(30);f.h[0]=999;f.l[0]=1;f.h[20]=130;f.l[28]=30;var a=L.aroon(bars(f.h,f.l),14);assert.strictEqual(a.up,100*(14-9)/14);assert.strictEqual(a.down,100*(14-1)/14)});
t('aroon: ties use the most recent extreme',function(){var f=flat(15);var a=L.aroon(bars(f.h,f.l),14);assert.strictEqual(a.up,100);assert.strictEqual(a.down,100)});
t('aroon: needs 15 bars, else null',function(){assert.strictEqual(L.aroon(bars(flat(14).h,flat(14).l),14),null);assert.strictEqual(L.aroon([],14),null);assert.strictEqual(L.aroon(null,14),null)});
t('aroon: rising series → Up 100, Down 0 (uptrend)',function(){var h=[],l=[];for(var i=0;i<20;i++){h.push(100+i);l.push(90+i)}var a=L.aroon(bars(h,l),14);assert.strictEqual(a.up,100);assert.strictEqual(a.down,0);assert.strictEqual(L.aroonLabel(a.up,a.down).k,'up')});
t('aroon: falling series → downtrend',function(){var h=[],l=[];for(var i=0;i<20;i++){h.push(100-i);l.push(90-i)}var a=L.aroon(bars(h,l),14);assert.strictEqual(a.up,0);assert.strictEqual(a.down,100);assert.strictEqual(L.aroonLabel(a.up,a.down).k,'dn')});
t('aroon label wording',function(){assert.strictEqual(L.aroonLabel(100,0).t,'Uptrend: buyers in control');assert.strictEqual(L.aroonLabel(0,100).t,'Downtrend: sellers in control');assert.strictEqual(L.aroonLabel(50,50).t,'No clear trend: wait');assert.strictEqual(L.aroonLabel(null,null).t,'No clear trend: wait')});
t('aroon label boundaries: 70/30 are NOT enough (strict)',function(){
 assert.strictEqual(L.aroonLabel(70,29).k,'none');assert.strictEqual(L.aroonLabel(71,30).k,'none');assert.strictEqual(L.aroonLabel(70,30).k,'none');
 assert.strictEqual(L.aroonLabel(71,29).k,'up');assert.strictEqual(L.aroonLabel(70.01,29.99).k,'up');
 assert.strictEqual(L.aroonLabel(29,70).k,'none');assert.strictEqual(L.aroonLabel(30,71).k,'none');assert.strictEqual(L.aroonLabel(30,70).k,'none');
 assert.strictEqual(L.aroonLabel(29,71).k,'dn');assert.strictEqual(L.aroonLabel(29.99,70.01).k,'dn');
 assert.strictEqual(L.aroonLabel(100,100).k,'none');assert.strictEqual(L.aroonLabel(0,0).k,'none')});
t('aroon note says confirm, not predict',function(){assert(/confirms a trend/i.test(L.aroonNote)&&/can.t predict/i.test(L.aroonNote)&&!/biquote/i.test(L.aroonNote))});

// weighted multi-window momentum (30s .40, 1m .20, 2m .15, 5m .15, 10m .10)
function run(ps,thr,st){st=st||{s:'WAIT',c:null,n:0};var out=[];ps.forEach(function(p){st=L.sigStep(st,p,thr==null?L.SIG_THR:thr);out.push(st.s)});return out}
t('weights, windows, label, trigger',function(){assert.deepStrictEqual(L.SIG_W.map(function(x){return x.ms}),[30000,60000,120000,300000,600000]);assert.deepStrictEqual(L.SIG_W.map(function(x){return x.w}),[0.4,0.2,0.15,0.15,0.1]);assert(Math.abs(L.SIG_W.reduce(function(s,x){return s+x.w},0)-1)<1e-12);assert.strictEqual(L.SIG_THR,1);assert.strictEqual(L.SIG_CONF,2);assert.strictEqual(L.SIG_NAME,'Momentum (30s-weighted, 1-10 min)')});
t('per-window threshold = 0.02% x sqrt(window/10min)',function(){L.SIG_W.forEach(function(x){assert(Math.abs(L.sigThr(x.ms)-0.02*Math.sqrt(x.ms/600000))<1e-12)});assert.strictEqual(L.sigThr(600000),0.02);assert(Math.abs(L.sigThr(30000)-0.004472)<1e-6);assert(Math.abs(L.sigThr(60000)-0.006325)<1e-6);assert(Math.abs(L.sigThr(120000)-0.008944)<1e-6);assert(Math.abs(L.sigThr(300000)-0.014142)<1e-6)});
// history where price p0 was px at each window base and now is m
function H5(now,px){var h=[];L.SIG_W.forEach(function(x,i){h.push([now-x.ms-1000,px[i]])});h.sort(function(a,b){return a[0]-b[0]});return h}
t('score: every window moves exactly its own threshold → score 1 (BUY boundary)',function(){var now=1e6,m=100,px=L.SIG_W.map(function(x){return m/(1+L.sigThr(x.ms)/100)});var r=L.sigScore(H5(now,px),now,m);assert(Math.abs(r.score-1)<1e-9);assert.strictEqual(r.parts.length,5);r.parts.forEach(function(p){assert(Math.abs(p.z-1)<1e-9)})});
t('score: only the 30s window moves 1x → 0.40; 2x → 0.80; all-zero → 0',function(){var now=1e6,m=100,flat=[m,m,m,m,m];assert.strictEqual(L.sigScore(H5(now,flat),now,m).score,0);var a=flat.slice();a[0]=m/(1+L.sigThr(30000)/100);assert(Math.abs(L.sigScore(H5(now,a),now,m).score-0.4)<1e-9);a[0]=m/(1+2*L.sigThr(30000)/100);assert(Math.abs(L.sigScore(H5(now,a),now,m).score-0.8)<1e-9)});
t('score: each window contributes its weight (1m .2, 2m .15, 5m .15, 10m .1)',function(){var now=1e6,m=100;[1,2,3,4].forEach(function(i){var a=[m,m,m,m,m];a[i]=m/(1+L.sigThr(L.SIG_W[i].ms)/100);assert(Math.abs(L.sigScore(H5(now,a),now,m).score-L.SIG_W[i].w)<1e-9)})});
t('score: falling price gives negative score, symmetric',function(){var now=1e6,m=100,px=L.SIG_W.map(function(x){return m*(1+L.sigThr(x.ms)/100)});var r=L.sigScore(H5(now,px),now,m);assert(r.score<-0.99&&r.score>-1.01);assert(r.parts.every(function(p){return p.p<0}))});
t('score: windows without history count 0 (no fake move)',function(){var now=1e6,m=100;var r=L.sigScore([[now-31000,m/(1+L.sigThr(30000)/100)]],now,m);assert(Math.abs(r.score-0.4)<1e-9);assert.strictEqual(r.parts[4].p,0);assert.strictEqual(L.sigScore([],now,m).score,0)});
t('sigRaw: ±1 triggers (inclusive), just below is WAIT',function(){assert.strictEqual(L.sigRaw(1,1,'WAIT'),'BUY');assert.strictEqual(L.sigRaw(-1,1,'WAIT'),'SELL');assert.strictEqual(L.sigRaw(0.9999,1,'WAIT'),'WAIT');assert.strictEqual(L.sigRaw(-0.9999,1,'WAIT'),'WAIT');assert.strictEqual(L.sigRaw(0,1,'WAIT'),'WAIT')});
t('signal needs 2 ticks in a row to turn BUY / SELL',function(){assert.deepStrictEqual(run([2,2,2]),['WAIT','BUY','BUY']);assert.deepStrictEqual(run([-2,-2,-2]),['WAIT','SELL','SELL']);assert.deepStrictEqual(run([2]),['WAIT'])});
t('one-tick blip does not flip the signal',function(){assert.deepStrictEqual(run([3,0,3,0,3,0]),['WAIT','WAIT','WAIT','WAIT','WAIT','WAIT']);assert.deepStrictEqual(run([3,0,0,0]),['WAIT','WAIT','WAIT','WAIT'])});
t('alternating noise around the trigger never flips',function(){var p=[];for(var i=0;i<40;i++)p.push(i%2?1.3:-1.3);assert(run(p).every(function(x){return x=='WAIT'}))});
t('hysteresis: BUY holds while score >= 0.5, drops after 2 ticks below',function(){assert.deepStrictEqual(run([2,2,0.6,0.4,0.4,0.4]),['WAIT','BUY','BUY','BUY','WAIT','WAIT']);assert.deepStrictEqual(run([2,2,0.5,0.5,0.5,0.5]).slice(1),['BUY','BUY','BUY','BUY','BUY']);assert.deepStrictEqual(run([2,2,0.4,0.9,0.4,0.9]).slice(1),['BUY','BUY','BUY','BUY','BUY'])});
t('hysteresis: dips between 0.5 and 1 keep BUY indefinitely',function(){var p=[2,2];for(var i=0;i<20;i++)p.push(0.7);assert(run(p).slice(1).every(function(x){return x=='BUY'}))});
t('BUY → SELL needs 2 straight SELL ticks',function(){var st={s:'BUY',c:null,n:0};assert.deepStrictEqual(run([-2,-2],null,st),['BUY','SELL']);st={s:'BUY',c:null,n:0};assert.deepStrictEqual(run([-2,2,-2,2,-2],null,st),['BUY','BUY','BUY','BUY','BUY'])});
t('SELL holds symmetric, and exits to WAIT after 2 ticks inside the band',function(){var st={s:'SELL',c:null,n:0};assert.deepStrictEqual(run([-0.6,-0.6,-0.6],null,st),['SELL','SELL','SELL']);st={s:'SELL',c:null,n:0};assert.deepStrictEqual(run([-0.4,-0.4,-0.4],null,st),['SELL','WAIT','WAIT'])});
t('sigStep does not mutate its input',function(){var st={s:'WAIT',c:null,n:0},a=L.sigStep(st,5,1);assert.deepStrictEqual(st,{s:'WAIT',c:null,n:0});assert.notStrictEqual(a,st)});
function hist(now,step,span,px){var h=[];for(var t0=now-span;t0<=now;t0+=step)h.push([t0,px(t0)]);return h}
t('sigBase: 1.5s ticks → base entry is the last one at least `ms` old, for every window',function(){var now=1e6,h=hist(now,1500,900000,function(t){return 100+(t-now)/1e6});L.SIG_W.forEach(function(x){var b=L.sigBase(h,now,x.ms,L.sigTol(x.ms));assert(b&&b[0]<=now-x.ms&&now-b[0]<x.ms+1500)})});
t('sigBase: no history old enough, or stale base → null',function(){var now=1e6;assert.strictEqual(L.sigBase([],now,30000,10000),null);assert.strictEqual(L.sigBase([[now-10000,1],[now,1]],now,30000,10000),null);assert.strictEqual(L.sigBase([[now-90000,1],[now,1]],now,30000,10000),null);assert.notStrictEqual(L.sigBase([[now-35000,1],[now,1]],now,30000,10000),null)});
t('sigBase: exact boundary and tolerance; sigTol grows with window',function(){var now=1e6;assert.notStrictEqual(L.sigBase([[now-30000,1]],now,30000,10000),null);assert.notStrictEqual(L.sigBase([[now-40000,1]],now,30000,10000),null);assert.strictEqual(L.sigBase([[now-40001,1]],now,30000,10000),null);assert.strictEqual(L.sigTol(30000),10000);assert(L.sigTol(600000)>=60000)});
t('15 min of 1.5s history covers the full 10-min window (>=600 points)',function(){var now=1e6,h=hist(now,1500,900000,function(){return 1});assert(h.length>=600);assert(L.sigBase(h,now,600000,L.sigTol(600000)))});
t('new signals are labelled with the blend name; no relabel code',function(){assert.strictEqual(L.sigInfo('BUY',SC(2),{}).name,'Momentum (30s-weighted, 1-10 min)');assert(!/relabel/i.test(src))});
t('history read preserves old saved strategy labels',function(){var st=mem();st.setItem('gdH3_u',JSON.stringify([{str:'Momentum (10-min move)'},{str:'Momentum (2-min move)'},{str:'Pivot bounce'}]));var h=L.histGet(st,'u');assert.strictEqual(h[0].str,'Momentum (10-min move)');assert.strictEqual(h[1].str,'Momentum (2-min move)');assert.strictEqual(h[2].str,'Pivot bounce')});
t('no old momentum labels in page; no biquote',function(){assert(/id="str"/.test(src));assert(/id="arow"/.test(src));assert(!/10-min move|Momentum \(10|Momentum \(2-min|Momentum \(30-sec/i.test(src));assert(!/biquote/i.test(src));assert(src.indexOf('Momentum (30s-weighted, 1-10 min)')>0)});

// Aroon top row segment
t('aroonSeg: values rounded, colour kind and tag',function(){
 assert.deepStrictEqual(L.aroonSeg({up:14.28,down:100}),{u:'14',d:'100',k:'dn',tag:'SELL'});assert.deepStrictEqual(L.aroonSeg({up:40,down:100}),{u:'40',d:'100',k:'none',tag:'WAIT'});
 assert.deepStrictEqual(L.aroonSeg({up:100,down:0}),{u:'100',d:'0',k:'up',tag:'BUY'});
 assert.deepStrictEqual(L.aroonSeg({up:0,down:100}),{u:'0',d:'100',k:'dn',tag:'SELL'});
 assert.deepStrictEqual(L.aroonSeg({up:50,down:50}),{u:'50',d:'50',k:'none',tag:'WAIT'});
 assert.strictEqual(L.aroonSeg({up:71,down:29}).tag,'BUY');assert.strictEqual(L.aroonSeg({up:70,down:29}).tag,'WAIT');assert.strictEqual(L.aroonSeg({up:29,down:71}).tag,'SELL');assert.strictEqual(L.aroonSeg({up:30,down:71}).tag,'WAIT')});
t('aroonSeg: missing data shows dashes',function(){var na={u:'–',d:'–',k:'na',tag:'–'};assert.deepStrictEqual(L.aroonSeg(null),na);assert.deepStrictEqual(L.aroonSeg(undefined),na)});
t('aroonRow: 1m, 5m and 1h from AR (1m first), dashes when AR is null or half-loaded',function(){
 var r=L.aroonRow({m1:{up:100,down:0},m5:{up:14,down:100},h1:{up:0,down:50}});assert.deepStrictEqual(Object.keys(r),['m1','m5','h1']);assert.strictEqual(r.m1.tag,'BUY');assert.strictEqual(r.m5.u,'14');assert.strictEqual(r.m5.d,'100');assert.strictEqual(r.h1.u,'0');assert.strictEqual(r.h1.d,'50');
 var n=L.aroonRow(null);assert.strictEqual(n.m1.u,'–');assert.strictEqual(n.m5.u,'–');assert.strictEqual(n.h1.d,'–');var h=L.aroonRow({m5:{up:100,down:0},h1:null});assert.strictEqual(h.m1.tag,'–');assert.strictEqual(h.m5.tag,'BUY');assert.strictEqual(h.h1.tag,'–')});
t('aroonAgree: signal side vs 1m Aroon trend (display only)',function(){var up=L.aroonSeg({up:100,down:0}),dn=L.aroonSeg({up:0,down:100}),wt=L.aroonSeg({up:50,down:50}),na=L.aroonSeg(null);
 assert.strictEqual(L.aroonAgree('BUY',up),'with');assert.strictEqual(L.aroonAgree('SELL',dn),'with');assert.strictEqual(L.aroonAgree('BUY',dn),'against');assert.strictEqual(L.aroonAgree('SELL',up),'against');
 assert.strictEqual(L.aroonAgree('BUY',wt),'none');assert.strictEqual(L.aroonAgree('SELL',wt),'none');assert.strictEqual(L.aroonAgree('BUY',na),'');assert.strictEqual(L.aroonAgree('WAIT',up),'')});

t('aroonSigText: bold card text per timeframe (BUY / SELL / WAIT, dash when no data)',function(){assert.strictEqual(L.aroonSigText({up:100,down:0}),'Aroon signal: BUY');assert.strictEqual(L.aroonSigText({up:0,down:100}),'Aroon signal: SELL');assert.strictEqual(L.aroonSigText({up:50,down:50}),'Aroon signal: WAIT');assert.strictEqual(L.aroonSigText({up:70,down:29}),'Aroon signal: WAIT');assert.strictEqual(L.aroonSigText({up:71,down:30}),'Aroon signal: WAIT');assert.strictEqual(L.aroonSigText({up:71,down:29}),'Aroon signal: BUY');assert.strictEqual(L.aroonSigText({up:29,down:71}),'Aroon signal: SELL');assert.strictEqual(L.aroonSigText({up:30,down:71}),'Aroon signal: WAIT');assert.strictEqual(L.aroonSigText(null),'Aroon signal: –')});
t('aroon row never shows UP/DOWN tags any more',function(){['m5','h1'].forEach(function(k){assert(['BUY','SELL','WAIT','–'].indexOf(L.aroonRow({m1:{up:100,down:0},m5:{up:0,down:100},h1:{up:50,down:50}})[k].tag)>=0)});assert.strictEqual(L.aroonRow({m5:{up:100,down:0},h1:{up:0,down:100}}).m5.tag,'BUY');assert.strictEqual(L.aroonRow({m5:{up:100,down:0},h1:{up:0,down:100}}).h1.tag,'SELL')});

// STRONG / WEAK: STRONG = |blend score| >= 2 AND the 15-min trend agrees with the side; else WEAK
function B(n,c0,c1,k){var a=[];for(var i=0;i<n;i++)a.push({close:i==n-1-k?c0:c1});return a}
t('m15Move: price vs the close 15 one-minute bars back, null when <16 bars',function(){var b=B(100,100,100,15);assert(Math.abs(L.m15Move(b,101)-1)<1e-9);assert(Math.abs(L.m15Move(b,99)+1)<1e-9);assert.strictEqual(L.m15Move(B(15,100,100,15),101),null);assert.strictEqual(L.m15Move([],101),null);assert.strictEqual(L.m15Move(null,101),null);assert.notStrictEqual(L.m15Move(B(16,100,100,15),101),null);var c=[];for(var i=0;i<80;i++)c.push({close:i+10});assert(Math.abs(L.m15Move(c,60)-(60/c[64].close-1)*100)<1e-9);assert.strictEqual(c[64].close,74)});
t('m15Move: not the 30m bar (30 back) and not 14 back',function(){var c=[];for(var i=0;i<100;i++)c.push({close:i==84?100:i==69?200:i==85?300:50});assert(Math.abs(L.m15Move(c,100)-0)<1e-9);var d=[];for(var i=0;i<100;i++)d.push({close:i==84?50:100});assert(Math.abs(L.m15Move(d,100)-100)<1e-9)});
t('strength: WAIT has no label',function(){assert.strictEqual(L.sigStrength('WAIT',3,1).k,'');assert.strictEqual(L.sigStrength('WAIT',0,null).k,'')});
t('strength: STRONG needs |score|>=2 AND 15m trend agreeing (BUY)',function(){assert.strictEqual(L.sigStrength('BUY',2,0.4).k,'STRONG');assert.strictEqual(L.sigStrength('BUY',3.5,0.01).k,'STRONG');assert.strictEqual(L.sigStrength('BUY',1.99,0.4).k,'WEAK');assert.strictEqual(L.sigStrength('BUY',2,-0.4).k,'WEAK');assert.strictEqual(L.sigStrength('BUY',5,-0.01).k,'WEAK')});
t('strength: SELL mirrors with negative score and falling 15m',function(){assert.strictEqual(L.sigStrength('SELL',-2,-0.4).k,'STRONG');assert.strictEqual(L.sigStrength('SELL',-1.99,-0.4).k,'WEAK');assert.strictEqual(L.sigStrength('SELL',-2,0.4).k,'WEAK');assert.strictEqual(L.sigStrength('SELL',-5,-0.0001).k,'STRONG')});
t('strength: 15m exactly flat or unknown → WEAK',function(){assert.strictEqual(L.sigStrength('BUY',4,0).k,'WEAK');assert.strictEqual(L.sigStrength('SELL',-4,0).k,'WEAK');assert.strictEqual(L.sigStrength('BUY',4,null).k,'WEAK');assert.strictEqual(L.sigStrength('SELL',-4,null).k,'WEAK')});
t('strength: keeps the 15m value for display',function(){assert.strictEqual(L.sigStrength('BUY',2,0.5).m15,0.5);assert.strictEqual(L.sigStrength('BUY',2,null).m15,null)});
t('sigInfo: strength + 15m wording + 1m Aroon tag in the reason, strategy name unchanged',function(){var up=L.aroonSeg({up:100,down:0});var a=L.sigInfo('BUY',SC(2.4),{},L.sigStrength('BUY',2.4,0.3),up);assert.strictEqual(a.name,'Momentum (30s-weighted, 1-10 min)');assert(/^STRONG BUY \(15m trend agrees\) · /.test(a.why));assert(/with 1m Aroon$/.test(a.why));var b=L.sigInfo('SELL',SC(-1.2),{},L.sigStrength('SELL',-1.2,-0.3),up);assert(/^WEAK SELL · /.test(b.why));assert(!/trend agrees/.test(b.why));assert(/against 1m Aroon$/.test(b.why));
 assert(!/1m Aroon/.test(L.sigInfo('BUY',SC(2),{},L.sigStrength('BUY',2,1),L.aroonSeg(null)).why));assert(/1m Aroon: no clear trend$/.test(L.sigInfo('BUY',SC(2),{},L.sigStrength('BUY',2,1),L.aroonSeg({up:50,down:50})).why));
 assert(!/STRONG|WEAK/.test(L.sigInfo('BUY',SC(2),{}).why));assert(!/Aroon/.test(L.sigInfo('WAIT',SC(0.2),{},L.sigStrength('WAIT',0.2,1),up).why))});
// scalping standard defaults + one-time settings migration
t('standard scalping defaults',function(){assert.deepStrictEqual(L.SCALP,{sgb:1,slm:'pct',slv:0.05,t1m:'rr',t1v:1.5,t2m:'rr',t2v:3});assert(L.SV>=2)});
t('migrateC: old saved settings get the new standard once, other keys kept',function(){var old={slm:'atr',slv:1.5,t1m:'atr',t1v:1.5,t2m:'lvl',t2v:0,sgb:2,mx:3,pap:false,lb:'7d',fvg:false};var m=L.migrateC(old);['sgb','slm','slv','t1m','t1v','t2m','t2v'].forEach(function(k){assert.strictEqual(m[k],L.SCALP[k],k)});assert.strictEqual(m.mx,3);assert.strictEqual(m.pap,false);assert.strictEqual(m.lb,'7d');assert.strictEqual(m.fvg,false);assert.strictEqual(m.sv,L.SV);assert.strictEqual(old.slm,'atr')});
t('migrateC: runs only once; later user changes survive',function(){var m=L.migrateC({slm:'atr'});m.slv=0.1;m.t1v=2;var m2=L.migrateC(m);assert.strictEqual(m2.slv,0.1);assert.strictEqual(m2.t1v,2);assert.strictEqual(m2.sv,L.SV)});
t('migrateC: fresh/corrupt settings get the standard; history keys untouched',function(){assert.strictEqual(L.migrateC({}).t1m,'rr');assert.strictEqual(L.migrateC(null).slv,0.05);var o={x:1,sv:0};var m=L.migrateC(o);assert.strictEqual(m.x,1);assert(!/gdH2|gdPL3|gdPA3_|gdPM3_/.test(String(L.migrateC)))});
t('page wires defaults + migration; old 30m labels gone',function(){assert(/for\(var k in SCALP\)DEF\[k\]=SCALP\[k\]/.test(src));assert(/C=migrateC\(C\)/.test(src));assert(!/30m trend|· 30m|m30/.test(src));assert(/\(15m trend agrees\)/.test(src))});


// ---- Pullback recipe A (separate paper-only signal; blend unchanged) ----
function BAR(t,o,h,l,c,open){return{openTime:new Date(t).toISOString(),open:o,high:h,low:l,close:c,isOpen:!!open}}
t('pullback helpers are exported; blend constants unchanged',function(){
 assert.strictEqual(typeof L.pbStep,'function');assert.strictEqual(typeof L.pbPlan,'function');
 assert.strictEqual(L.SIG_THR,1);assert.strictEqual(L.SIG_CONF,2);
 assert.deepStrictEqual(L.SIG_W.map(function(x){return x.w}),[0.4,0.2,0.15,0.15,0.1]);
 assert.strictEqual(L.SIG_NAME,'Momentum (30s-weighted, 1-10 min)');
 assert.deepStrictEqual(L.SCALP,{sgb:1,slm:'pct',slv:0.05,t1m:'rr',t1v:1.5,t2m:'rr',t2v:3});assert.strictEqual(L.SV,2)});
t('pbEma: SMA seed then EMA; short series is null',function(){
 assert.strictEqual(L.pbEma([1,2,3],10),null);
 var flat=[];for(var i=0;i<10;i++)flat.push(100);
 assert.strictEqual(L.pbEma(flat,10),100);
 var k=2/11,e=110*k+100*(1-k);
 assert(Math.abs(L.pbEma(flat.concat([110]),10)-e)<1e-12)});
t('pbAtr: 14-bar ATR is SMA of true range',function(){
 var bs=[],i;for(i=0;i<15;i++)bs.push(BAR(i*300000,10,12,8,10));
 assert.strictEqual(L.pbAtr(bs.slice(0,10),14),null);
 assert(Math.abs(L.pbAtr(bs,14)-4)<1e-12)});
t('pbAgg: three 5m bars make one 15m OHLC',function(){
 var t0=Date.parse('2026-11-21T00:00:00Z');
 var a=L.pbAgg([BAR(t0,10,11,9,10.5),BAR(t0+300000,10.5,14,10,13),BAR(t0+600000,13,13.5,12,12.5)],900000);
 assert.strictEqual(a.length,1);assert.strictEqual(a[0].open,10);assert.strictEqual(a[0].high,14);assert.strictEqual(a[0].low,9);assert.strictEqual(a[0].close,12.5)});
t('pbDir follows 1h Aroon BUY/SELL/WAIT',function(){
 assert.strictEqual(L.pbDir({up:100,down:0}),'BUY');assert.strictEqual(L.pbDir({up:0,down:100}),'SELL');
 assert.strictEqual(L.pbDir({up:50,down:50}),'WAIT');assert.strictEqual(L.pbDir(null),'WAIT')});
t('fire on touch then resume with the 1h trend (BUY)',function(){
 var ema=100,st={s:'WAIT',armed:false,id:null,str:'',dir:'WAIT'};
 st=L.pbStep(st,BAR(1,100,100,99,99.4),ema,'BUY','BUY');
 assert.strictEqual(st.s,'WAIT');assert.strictEqual(st.armed,true);assert.strictEqual(st.fired,false);
 st=L.pbStep(st,BAR(2,99.5,101,99.8,100.8),ema,'BUY','BUY');
 assert.strictEqual(st.s,'BUY');assert.strictEqual(st.fired,true);assert.strictEqual(st.armed,false);assert.strictEqual(st.str,'STRONG')});
t('fire on touch then resume with the 1h trend (SELL)',function(){
 var ema=100,st={s:'WAIT',armed:false};
 st=L.pbStep(st,BAR(1,100,101,99.5,100.6),ema,'SELL','SELL');
 assert.strictEqual(st.s,'WAIT');assert.strictEqual(st.armed,true);
 st=L.pbStep(st,BAR(2,100.2,100.3,99,99.2),ema,'SELL','WAIT');
 assert.strictEqual(st.s,'SELL');assert.strictEqual(st.fired,true);assert.strictEqual(st.str,'WEAK')});
t('no fire against the 1h trend, and none when 1h is WAIT',function(){
 var ema=100,st={s:'WAIT',armed:false},bars=[BAR(1,100,100,99,99),BAR(2,99.5,101,99.8,101)];
 bars.forEach(function(b){st=L.pbStep(st,b,ema,'SELL','SELL')});
 assert.strictEqual(st.s,'WAIT');assert.strictEqual(st.fired,false);
 st={s:'WAIT',armed:false};bars.forEach(function(b){st=L.pbStep(st,b,ema,'WAIT','BUY')});
 assert.strictEqual(st.s,'WAIT');assert.strictEqual(st.fired,false)});
t('no fire on touch without resume, and no fire on resume without a touch',function(){
 var ema=100,st={s:'WAIT',armed:false};
 st=L.pbStep(st,BAR(1,100,100,99,99.2),ema,'BUY','BUY');
 assert.strictEqual(st.armed,true);assert.strictEqual(st.s,'WAIT');assert.strictEqual(st.fired,false);
 st=L.pbStep(st,BAR(2,99,99.5,98.5,99.5),ema,'BUY','BUY');
 assert.strictEqual(st.s,'WAIT');assert.strictEqual(st.fired,false);
 var st2={s:'WAIT',armed:false};
 st2=L.pbStep(st2,BAR(1,101,102,100.2,101),ema,'BUY','BUY');
 assert.strictEqual(st2.armed,false);assert.strictEqual(st2.fired,false);assert.strictEqual(st2.s,'WAIT')});
t('open 1m bar can arm but cannot fire until it closes',function(){
 var st=L.pbStep({s:'WAIT',armed:false},BAR(1,100,100,99,100.8,true),100,'BUY','BUY');
 assert.strictEqual(st.armed,true);assert.strictEqual(st.fired,false);assert.strictEqual(st.s,'WAIT')});
t('STRONG if 15m Aroon agrees, else WEAK',function(){
 var ema=100,mk=function(tag){var s={s:'WAIT',armed:false};s=L.pbStep(s,BAR(1,100,100,99,99),ema,'BUY',tag);return L.pbStep(s,BAR(2,99.5,101,99.5,101),ema,'BUY',tag)};
 assert.strictEqual(mk('BUY').str,'STRONG');assert.strictEqual(mk('SELL').str,'WEAK');assert.strictEqual(mk('WAIT').str,'WEAK')});
t('pbWalk replays a pullback and does not refire until a new arm+resume',function(){
 var ema=100,bars=[BAR(1,101,102,100.5,101),BAR(2,101,101,99,99.2),BAR(3,99.2,101,99.1,100.8),BAR(4,100.8,101.5,100.5,101),BAR(5,101,101,99.4,99.2),BAR(6,99.2,101,99,100.9)];
 var w=L.pbWalk(bars,ema,'BUY','BUY');
 assert.strictEqual(w.fires.length,2);assert.strictEqual(w.fires[0].s,'BUY');assert.strictEqual(w.st.s,'BUY');assert.strictEqual(w.st.str,'STRONG')});
t('pbWhy is plain English for wait / armed / fire',function(){
 assert(/No clear 1h trend/.test(L.pbWhy({dir:'WAIT',s:'WAIT'})));
 assert(/Uptrend \(1h\), waiting for a dip to the 5m avg/.test(L.pbWhy({dir:'BUY',s:'WAIT',armed:false,ready:true})));
 assert(/Uptrend \(1h\), dipped to 5m avg, waiting for a turn up/.test(L.pbWhy({dir:'BUY',s:'WAIT',armed:true,ready:true})));
 assert(/Uptrend \(1h\), dipped to 5m avg, turning up/.test(L.pbWhy({dir:'BUY',s:'BUY',ready:true})));
 assert(/Downtrend \(1h\), rallied to 5m avg, turning down/.test(L.pbWhy({dir:'SELL',s:'SELL',ready:true})))});
t('pbPlan: SL is 1.5×ATR, TP is 2R, 60-minute time stop',function(){
 var b=L.pbPlan('BUY',4000,10,2);assert.strictEqual(b.sl,3985);assert.strictEqual(b.tp,4030);assert.strictEqual(b.R,15);assert.strictEqual(b.rr,2);assert.strictEqual(b.tstop,60);assert.strictEqual(b.slx,1.5);
 var sl=L.pbPlan('SELL',4000,10,2);assert.strictEqual(sl.sl,4015);assert.strictEqual(sl.tp,3970);
 assert.strictEqual(L.pbPlan('WAIT',4000,10,2),null);assert.strictEqual(L.pbPlan('BUY',4000,0,2),null)});
t('pbPaperEval: SL first, then TP, then 60m time stop',function(){
 var o={side:'BUY',sl:3985,tp:4030,exp:1000+3600000};
 assert.deepStrictEqual(L.pbPaperEval(o,3985,1000),{res:'SL',ext:3985});
 assert.deepStrictEqual(L.pbPaperEval(o,4030,1000),{res:'TP',ext:4030});
 assert.strictEqual(L.pbPaperEval(o,3990,1000),null);
 assert.deepStrictEqual(L.pbPaperEval(o,3990,1000+3600000),{res:'Time',ext:3990});
 var both={side:'BUY',sl:3985,tp:4030,exp:2000};
 assert.strictEqual(L.pbPaperEval(both,3980,2000).res,'SL')});
t('pullback paper log uses gdPB3_ and never mixes with history or paper balances',function(){
 assert.strictEqual(L.pbKey('Dan'),'gdPB3_dan');assert.strictEqual(L.hKey('Dan'),'gdH3_dan');
 assert.strictEqual(L.balKey('Dan','a'),'gdPA3_dan');assert.strictEqual(L.balKey('Dan','m'),'gdPM3_dan');
 var st={d:{},getItem:function(k){return this.d[k]||null},setItem:function(k,v){this.d[k]=String(v)}};
 var o=L.pbStoreGet(st,'dan');o.log.push({s:'BUY',pl:1});o.open={side:'BUY'};
 L.pbStoreSet(st,'dan',o);
 assert(st.d['gdPB3_dan']);assert(!st.d['gdH3_dan']);assert(!st.d['gdPA3_dan']);assert(!st.d['gdPM3_dan']);assert(!st.d['gdPL3']);
 var a=L.histGet(st,'dan');assert.deepStrictEqual(a,[]);
 assert(!/gdH2|gdPL3|gdPA3_|gdPM3_|gdPB2/.test(String(L.migrateC)))});
t('page: Pullback card is in the frozen top, paper-only, alongside the blend badge',function(){
 assert(/id="pb"/.test(src));assert(/id="pbb"/.test(src));
 assert(/Paper-only, testing/.test(src));assert(/id="pbc"/.test(src));assert(/id="sgs-pb"/.test(src));assert(/id="arpb"/.test(src));
 var top=src.match(/<div id="top"[\s\S]*?<div id="sgs"/);assert(top);assert(/id="pb"/.test(top[0]));assert(/id="sig"/.test(top[0]));
 assert(/#top>#pb/.test(src))});
t('page: 15m/1H sweep bars load on the existing candles interval (no new timer)',function(){
 assert(/interval=5m&limit=60/.test(src));assert(/bars5=c/.test(src));
 assert(/ohlc\?interval=15m&limit=200/.test(src));assert(/ohlc\?interval=1h&limit=200/.test(src));assert(!/setInterval\(swLoad/.test(src))});
t('page: main badge is the sweep signal (paper only); blend score and auto helper stay',function(){
 assert(/function swPaint\(/.test(src));assert(/\$\('sig'\)\.textContent=s/.test(src));assert(/Testing \/ paper only/.test(src));assert(/id="swc"/.test(src));assert(/id="sw15"/.test(src));assert(/id="sw1h"/.test(src));
 assert(/SS=sigScore\(H,now,m\);LS=SS\.score;SG=sigStep\(SG,LS,C\.sgb\)/.test(src));
 assert(/function add\(d\)\{if\(prev==null\)return;var g=SIG&&SIG\.s==/.test(src));
 var pt=(src.match(/function planTick[\s\S]*?function svP/)||[''])[0];
 var lc=(src.match(/function logClosed[\s\S]*?pushH\(r\)/)||[''])[0];
 var mg=(src.match(/function migrateC[\s\S]*?return o}/)||[''])[0];
 assert(!/gdPB2|pbStoreSet|pbKey/.test(pt));assert(!/gdPB2/.test(lc));assert(!/gdPB2/.test(mg));
 assert(/for\(var k in SCALP\)DEF\[k\]=SCALP\[k\]/.test(src));assert(/C=migrateC\(C\)/.test(src));assert(/var SV=2/.test(src))});


function swBar(t,o,h,l,c){return {t:t,open:o,high:h,low:l,close:c,isOpen:false}}
t('sweep ATR buffer is 0.15 × 15m ATR',function(){assert.strictEqual(L.SW_BUF,0.15);assert.strictEqual(L.SW_N,2);assert.strictEqual(L.SW_K,1)});
t('fractal high at 3, unconfirmed hidden',function(){
 var hs=[10,11,12,15,12,11,10],ls=[8,8,8,9,8,8,8],bs=[],i;
 for(i=0;i<7;i++)bs.push(swBar(i,hs[i],hs[i],ls[i],hs[i]));
 var sw=L.swSwings(bs,2,6);
 assert.strictEqual(sw.length,1);assert.strictEqual(sw[0].p,15);assert.strictEqual(sw[0].i,3);
 assert(L.swSwings(bs,2,4).every(function(s){return s.i!==3}))});
t('HH/HL is bull, LH/LL is bear, mixed is none',function(){
 var lab=L.swLabel([{i:0,t:0,k:'L',p:10},{i:1,t:1,k:'H',p:20},{i:2,t:2,k:'L',p:12},{i:3,t:3,k:'H',p:22}]);
 assert.deepStrictEqual(lab.map(function(s){return s.lab}),['L','H','HL','HH']);
 assert.strictEqual(L.swDir(lab),'BUY');
 var lab2=L.swLabel([{i:0,t:0,k:'H',p:22},{i:1,t:1,k:'L',p:14},{i:2,t:2,k:'H',p:20},{i:3,t:3,k:'L',p:12}]);
 assert.deepStrictEqual(lab2.map(function(s){return s.lab}),['H','L','LH','LL']);
 assert.strictEqual(L.swDir(lab2),'SELL');
 var mixed=L.swLabel([{i:0,t:0,k:'H',p:20},{i:1,t:1,k:'L',p:10},{i:2,t:2,k:'H',p:22},{i:3,t:3,k:'L',p:8}]);
 assert.strictEqual(L.swDir(mixed),null)});
t('MS is a close through the last LH; BOS is a close through the last HH',function(){
 var i,h=[],l=[],c=[],bs,ev,ms,bos;
 for(i=0;i<24;i++){h[i]=15;l[i]=14;c[i]=15}
 function setb(A,i,hh,ll,cc){A.h[i]=hh;A.l[i]=ll;A.c[i]=cc}
 var A={h:h,l:l,c:c};h[4]=20;l[4]=14;c[4]=16;h[8]=15;l[8]=10;c[8]=12;h[12]=18;l[12]=14;c[12]=16;h[16]=19;l[16]=16;c[16]=19;
 bs=[];for(i=0;i<24;i++)bs.push(swBar(i,c[i],h[i],l[i],c[i]));
 ev=L.swEvents(bs,2);ms=ev.filter(function(e){return e.kind==='MS'&&e.dir==='BUY'});
 assert(ms.length>=1);assert.strictEqual(ms[0].level,18);
 var h2=[],l2=[],c2=[];for(i=0;i<28;i++){h2[i]=15;l2[i]=14;c2[i]=15}
 h2[4]=16;l2[4]=14;c2[4]=15;h2[8]=15;l2[8]=11;c2[8]=13;h2[12]=20;l2[12]=14;c2[12]=18;h2[16]=15;l2[16]=13;c2[16]=15;h2[20]=22;l2[20]=16;c2[20]=22;
 bs=[];for(i=0;i<28;i++)bs.push(swBar(i,c2[i],h2[i],l2[i],c2[i]));
 ev=L.swEvents(bs,2);bos=ev.filter(function(e){return e.kind==='BOS'&&e.dir==='BUY'});
 assert(bos.length>=1);assert.strictEqual(bos[0].level,20)});
t('demand/supply OB, FVG, mitigation, sweep, and plan',function(){
 var i,zbars=[],sbars=[];
 for(i=0;i<16;i++)zbars.push(swBar(i,10,11,9,10));
 zbars.push(swBar(16,10,10.2,8,8.5));zbars.push(swBar(17,8.6,14,8.6,13.5));
 var zs=L.swZones(zbars,L.swAtr(zbars,14),1,zbars.length-1);
 var dem=zs.filter(function(z){return z.k==='DEMAND'&&!z.broken});
 assert(dem.length>=1);assert.strictEqual(dem[dem.length-1].lo,8);assert.strictEqual(dem[dem.length-1].hi,10.2);
 for(i=0;i<16;i++)sbars.push(swBar(i,10,11,9,10));
 sbars.push(swBar(16,10,12,9.8,11.5));sbars.push(swBar(17,11.4,11.4,6,6.5));
 var zs2=L.swZones(sbars,L.swAtr(sbars,14),1,sbars.length-1);
 var sup=zs2.filter(function(z){return z.k==='SUPPLY'&&!z.broken});
 assert(sup.length>=1);assert.strictEqual(sup[sup.length-1].hi,12);assert.strictEqual(sup[sup.length-1].lo,9.8);
 var fv=L.swFvg([swBar(0,10,11,9,10),swBar(1,11,12,10.5,11.5),swBar(2,13,14,13,13.5)],2);
 assert(fv.some(function(z){return z.k==='DEMAND'&&z.src==='FVG'&&z.lo===11&&z.hi===13}));
 var fv2=L.swFvg([swBar(0,14,15,13,14),swBar(1,13,13.5,12,12.5),swBar(2,10,11,9,10)],2);
 assert(fv2.some(function(z){return z.k==='SUPPLY'&&z.src==='FVG'}));
 assert(L.swInZone(swBar(1,11,11,10,10.5),{lo:8,hi:10}));
 assert(!L.swInZone(swBar(1,12,13,11,12),{lo:8,hi:10}));
 assert(L.swIsSweep(swBar(1,101,102,98,101),'BUY',100));
 assert(!L.swIsSweep(swBar(1,101,102,98,99),'BUY',100));
 assert(L.swIsSweep(swBar(1,99,103,98,99),'SELL',100));
 var p=L.swPlan('BUY',100,97,1,106,2);
 assert(p&&p.sl===96&&p.tp===106&&p.rr===1.5);
 assert.strictEqual(L.swPlan('BUY',100,97,1,103,2),null);
 var p2=L.swPlan('SELL',100,103,1,94,2);
 assert(p2&&p2.sl===104&&p2.tp===94&&p2.rr===1.5)});
t('chart payload has structure, zones, liquidity, sweeps and plan keys',function(){
 var i,zbars=[];
 for(i=0;i<16;i++)zbars.push(swBar(i,10,11,9,10));
 zbars.push(swBar(16,10,10.2,8,8.5));zbars.push(swBar(17,8.6,14,8.6,13.5));
 var atrs=L.swAtr(zbars,14),zs=L.swZones(zbars,atrs,1,zbars.length-1);
 var pay=L.swChart(zbars,zbars,atrs,zs,zbars.length-1,null,[]);
 ['dir15','dir60','swings15','swings60','events15','events60','zones','liquidity','sweeps','plan'].forEach(function(k){assert(k in pay)});
 assert(Array.isArray(pay.swings15));assert(Array.isArray(pay.zones));assert(Array.isArray(pay.liquidity))});
t('page: gold only, new storage prefixes, NFA, no biquote, sweep chart at top',function(){
 assert(/Gold Dash v3/.test(src));assert(/Not financial advice/.test(src));
 assert(!/biquote/i.test(src));assert(/var SYM='XAUUSD'/.test(src));
 assert(/id="swbox"/.test(src));assert(/id="swc"/.test(src));
 assert(src.indexOf('id="swbox"')<src.indexOf('id="top"'));
 assert(/gdAuth3/.test(src));assert(/gdH3_/.test(src));assert(/gdPB3_/.test(src));assert(/gdPA3_/.test(src));
 assert(!/gdH2_|gdPB2_|gdC2|gdAuth'/.test(src.replace(/gdAuth3/g,'')));
 assert(/id="sigtag"/.test(src));assert(/Testing \/ paper only/.test(src))});


t('equal swing highs are LH; equal lows are HL (BUY/SELL mirror)',function(){
 var lab=L.swLabel([{i:0,t:0,k:'H',p:20},{i:1,t:1,k:'L',p:10},{i:2,t:2,k:'H',p:20},{i:3,t:3,k:'L',p:10}]);
 assert.deepStrictEqual(lab.map(function(s){return s.lab}),['H','L','LH','HL'])});
t('flip of a synthetic series swaps BUY/SELL and mirrors SL/TP',function(){
 var C=8000,i,h=[],l=[],c=[],bs,fl,evA,evB,exp,got,zsA,zsB,pA,pS,side;
 for(i=0;i<24;i++){h[i]=15;l[i]=14;c[i]=15}
 h[4]=20;l[4]=14;c[4]=16;h[8]=15;l[8]=10;c[8]=12;h[12]=18;l[12]=14;c[12]=16;h[16]=19;l[16]=16;c[16]=19;
 bs=[];for(i=0;i<24;i++)bs.push(swBar(i,c[i],h[i],l[i],c[i]));
 fl=L.swFlipBars(bs,C);
 evA=L.swEvents(bs,2);evB=L.swEvents(fl,2);
 function flipSide(s){return s==='BUY'?'SELL':s==='SELL'?'BUY':s}
 exp=evA.map(function(e){return [e.i,e.kind,flipSide(e.dir),+((C-e.level).toFixed(9))]}).sort();
 got=evB.map(function(e){return [e.i,e.kind,e.dir,+(e.level.toFixed(9))]}).sort();
 assert.deepStrictEqual(got,exp);
 var lab=L.swLabel([{i:0,t:0,k:'L',p:10},{i:1,t:1,k:'H',p:20},{i:2,t:2,k:'L',p:12},{i:3,t:3,k:'H',p:22}]);
 var labF=L.swLabel(lab.map(function(s){return {i:s.i,t:s.t,k:s.k==='H'?'L':'H',p:C-s.p}}));
 assert.strictEqual(L.swDir(lab),'BUY');
 assert.strictEqual(L.swDir(labF),'SELL');
 pA=L.swPlan('BUY',100,97,1,106,2);
 pS=L.swPlan('SELL',C-100,C-97,1,C-106,2);
 assert(pA&&pS);assert.strictEqual(pS.side,'SELL');
 assert.strictEqual(pS.ent,+(C-pA.ent).toFixed(2));
 assert.strictEqual(pS.sl,+(C-pA.sl).toFixed(2));
 assert.strictEqual(pS.tp,+(C-pA.tp).toFixed(2));
 // Full evaluate: a long aligned bull series, then its flip
 function trendBars(n,up){
  var out=[],i,base=2000,o,cl,hi,lo;
  for(i=0;i<n;i++){
    if(up){o=base+i*2;cl=o+1.5;hi=cl+0.8;lo=o-0.4}
    else {o=base-i*2;cl=o-1.5;hi=o+0.4;lo=cl-0.8}
    // add mild fractal wiggles so N=2 swings confirm
    if(i%8===4){if(up){hi=cl+3}else{lo=cl-3}}
    if(i%8===6){if(up){lo=o-3}else{hi=o+3}}
    out.push(swBar(900*(i+1),o,hi,lo,cl));
  }
  return out;
 }
 var b15=trendBars(80,true),b60=trendBars(40,true);
 var ev=L.swEvaluate(b15,b60),evF=L.swEvaluate(L.swFlipBars(b15,C),L.swFlipBars(b60,C));
 assert.strictEqual(flipSide(ev.s||'WAIT'), evF.s||'WAIT');
 if(ev.dir15)assert.strictEqual(evF.dir15,flipSide(ev.dir15));
 if(ev.dir60)assert.strictEqual(evF.dir60,flipSide(ev.dir60));
 if(ev.plan||evF.plan){
  assert(ev.plan&&evF.plan);
  assert.strictEqual(evF.plan.side,flipSide(ev.plan.side));
  assert.strictEqual(evF.plan.ent,+(C-ev.plan.ent).toFixed(2));
  assert.strictEqual(evF.plan.sl,+(C-ev.plan.sl).toFixed(2));
  assert.strictEqual(evF.plan.tp,+(C-ev.plan.tp).toFixed(2));
 }
 // also a hand-built sweep plan must mirror
 var buy=L.swIsSweep(swBar(1,101,102,98,101),'BUY',100);
 var sell=L.swIsSweep(L.swFlipBars([swBar(1,101,102,98,101)],C)[0],'SELL',C-100);
 assert.strictEqual(buy,true);assert.strictEqual(sell,true);
 var za=L.swZones(bs,L.swAtr(bs,14),1,bs.length-1);
 var zf=L.swZones(fl,L.swAtr(fl,14),1,fl.length-1);
 assert.strictEqual(za.length,zf.length);
 za.forEach(function(z,ix){
  var m=zf[ix];
  assert.strictEqual(m.k,z.k==='DEMAND'?'SUPPLY':'DEMAND');
  assert.ok(Math.abs(m.lo-(C-z.hi))<1e-9);
  assert.ok(Math.abs(m.hi-(C-z.lo))<1e-9);
 });
});
t('chart time readout is 24-hour HH:MM PHT',function(){
 assert.strictEqual(L.swPhtHm(Date.UTC(2026,10,21,12,45,0)/1000),'20:45 PHT');
 assert.strictEqual(L.swPhtHm(Date.UTC(2026,10,21,16,5,0)/1000),'00:05 PHT');
 assert.strictEqual(L.swPhtHm(Date.UTC(2026,10,21,16,0,0)/1000),'00:00 PHT');
 assert(/function swPhtHm/.test(src));
 assert(/Asia\/Manila/.test(src));
 assert(/swSetHover/.test(src));
 assert(/swV\.hoverI/.test(src))});
t('page: neon HUD chart labels and glowing demand/supply',function(){
 assert(/function swPill/.test(src));assert(/function swGlowLine/.test(src));
 assert(/#00ffc8/.test(src));assert(/#ff4fa3/.test(src));
 assert(/'DEMAND'/.test(src)||/\"DEMAND\"/.test(src)||/dem\?'DEMAND'/.test(src));
 assert(/SUPPLY/.test(src));assert(/'POI'/.test(src)||/POI/.test(src));
 assert(/ui-monospace/.test(src));assert(/#2dd4bf/.test(src));assert(/#ff5c5c/.test(src))});


// ---- backup feed fallback ----
function feedUrls(){return {primary:'primary/XAUUSD',backup:'backup/XAUUSD'}}
function feedGet(map){var calls=[];async function get(u){calls.push(u);var step=u.indexOf('primary')===0?map.primary:map.backup;if(typeof step==='function')step=step();if(step&&step.throw)throw new Error(step.throw);return step}get.calls=calls;return get}
async function feedTests(){
 var get,r,now=1e12,ok=function(mid){return {ok:true,status:200,json:{mid:mid}}};
 // 1) primary throws -> backup
 get=feedGet({primary:{throw:'502'},backup:ok(2)});
 r=await L.feedFetch(L.feedInit(),now,feedUrls(),get,4000);
 assert.strictEqual(r.source,'backup');assert.strictEqual(r.data.mid,2);assert.strictEqual(r.st.use,'backup');assert.strictEqual(r.st.until,now+L.FEED_STICK_MS);
 assert.deepStrictEqual(get.calls,['primary/XAUUSD','backup/XAUUSD']);
 n++;console.log('ok feed: primary fail uses backup');
 // 2) still in the 60s window: do not retry primary even if it would work
 get=feedGet({primary:ok(1),backup:ok(2)});
 r=await L.feedFetch(r.st,now+30000,feedUrls(),get,4000);
 assert.strictEqual(r.source,'backup');assert.strictEqual(r.data.mid,2);assert.strictEqual(r.st.use,'backup');
 assert.deepStrictEqual(get.calls,['backup/XAUUSD']);
 n++;console.log('ok feed: stays on backup for 60s');
 // 3) after 60s, retry primary and recover
 get=feedGet({primary:ok(1),backup:ok(2)});
 r=await L.feedFetch(r.st,now+L.FEED_STICK_MS,feedUrls(),get,4000);
 assert.strictEqual(r.source,'primary');assert.strictEqual(r.data.mid,1);assert.strictEqual(r.st.use,'primary');assert.strictEqual(r.st.until,0);
 assert.deepStrictEqual(get.calls,['primary/XAUUSD']);
 n++;console.log('ok feed: primary recovers after 60s');
 // 4) non-2xx is a fail
 get=feedGet({primary:{ok:false,status:502,json:{error:'x'}},backup:ok(2)});
 r=await L.feedFetch(L.feedInit(),now,feedUrls(),get,4000);
 assert.strictEqual(r.source,'backup');assert.strictEqual(r.data.mid,2);
 n++;console.log('ok feed: non-2xx uses backup');
 // 5) bad JSON is a fail
 get=feedGet({primary:{ok:true,status:200,json:null},backup:ok(2)});
 r=await L.feedFetch(L.feedInit(),now,feedUrls(),get,4000);
 assert.strictEqual(r.source,'backup');
 n++;console.log('ok feed: bad JSON uses backup');
 // 6) paper paused only on backup
 assert.strictEqual(L.feedPaperPaused(L.feedInit()),false);
 assert.strictEqual(L.feedPaperPaused({use:'backup',until:now+1}),true);
 assert.strictEqual(L.feedPaperPaused({use:'primary',until:0}),false);
 n++;console.log('ok feed: paper paused only on backup');
}

t('page: backup feed fallback is wired, paper pauses, NFA stays',function(){
 assert(/gd-feed\.qwertydaniel86\.workers\.dev/.test(src));
 assert(/Backup feed: gold futures, a few \$ off spot/.test(src));
 assert(/Paper entries and exits paused/.test(src));
 assert(/id="feedn"/.test(src));
 assert(/feedPaperPaused\(feedSt\)/.test(src));
 assert(/FEED_TO_MS=4000/.test(src));
 assert(/FEED_STICK_MS=60000/.test(src));
 assert(/Not financial advice/.test(src))});

authTests().then(feedTests).then(function(){console.log(n+' tests passed')});

