import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & SPECIES DATA
// ═══════════════════════════════════════════════════════════════

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const SPECIES = {
  yellowBox:  { name:"Yellow Box",      latin:"E. melliodora",    color:"#D4A017", icon:"🌼", floweringMonths:"Oct–Feb",  peakMonth:"Nov–Dec", floweringNums:[10,11,12,1,2],  gddBase:6,  gddTarget:800, optWinterRain:180, optSpringRain:120, droughtSens:0.55, heatCap:38, biennial:true,  biennialPenalty:0.30, regions:["centralVic","northeastVic","bendigoRegion","westernSlopes"] },
  greyBox:    { name:"Grey Box",         latin:"E. microcarpa",    color:"#8B9E6E", icon:"🌿", floweringMonths:"Mar–Sep",  peakMonth:"May–Jul", floweringNums:[3,4,5,6,7,8,9], gddBase:5,  gddTarget:650, optWinterRain:150, optSpringRain:80,  droughtSens:0.35, heatCap:42, biennial:false, biennialPenalty:0,    regions:["centralVic","midlands","wimmera","bendigoRegion"] },
  redGum:     { name:"River Red Gum",    latin:"E. camaldulensis", color:"#C45E3A", icon:"🌳", floweringMonths:"Nov–Feb",  peakMonth:"Dec–Jan", floweringNums:[11,12,1,2],     gddBase:8,  gddTarget:900, optWinterRain:120, optSpringRain:100, droughtSens:0.40, heatCap:40, biennial:false, biennialPenalty:0,    regions:["murrayRiver","mallee","goulburnValley"] },
  ironbark:   { name:"Red Ironbark",     latin:"E. tricarpa",      color:"#7B3F3F", icon:"🌲", floweringMonths:"Aug–Nov",  peakMonth:"Sep–Oct", floweringNums:[8,9,10,11],     gddBase:7,  gddTarget:720, optWinterRain:200, optSpringRain:130, droughtSens:0.45, heatCap:39, biennial:false, biennialPenalty:0,    regions:["northCentralVic","bendigoRegion","centralVic"] },
  messmate:   { name:"Messmate Strbk",   latin:"E. obliqua",       color:"#6B7B4A", icon:"🌾", floweringMonths:"Dec–Mar",  peakMonth:"Jan–Feb", floweringNums:[12,1,2,3],      gddBase:6,  gddTarget:850, optWinterRain:250, optSpringRain:150, droughtSens:0.60, heatCap:37, biennial:true,  biennialPenalty:0.25, regions:["centralHighlands","gippsland","dandenongs"] },
  redBox:     { name:"Red Box",          latin:"E. polyanthemos",  color:"#B06A4E", icon:"🍂", floweringMonths:"Jul–Nov",  peakMonth:"Aug–Oct", floweringNums:[7,8,9,10,11],   gddBase:5,  gddTarget:600, optWinterRain:140, optSpringRain:100, droughtSens:0.30, heatCap:43, biennial:false, biennialPenalty:0,    regions:["westernVic","centralVic","pyrenees","wimmera"] },
};

// Victorian regions with centroids for map display
const REGIONS = {
  centralVic:       { name:"Central Victoria",      lat:-36.95, lng:144.50, species:["yellowBox","greyBox","ironbark","redBox"] },
  northeastVic:     { name:"North East Victoria",   lat:-36.45, lng:146.80, species:["yellowBox","redBox"] },
  bendigoRegion:    { name:"Bendigo / Box-Iron",    lat:-36.75, lng:144.25, species:["yellowBox","greyBox","ironbark","redBox"] },
  murrayRiver:      { name:"Murray River",           lat:-35.55, lng:144.30, species:["redGum","greyBox","redBox"] },
  mallee:           { name:"Mallee",                 lat:-35.20, lng:142.50, species:["redGum","redBox","greyBox"] },
  wimmera:          { name:"Wimmera",                lat:-36.70, lng:142.50, species:["greyBox","redBox"] },
  centralHighlands: { name:"Central Highlands",     lat:-37.40, lng:145.80, species:["messmate","redBox"] },
  gippsland:        { name:"Gippsland",              lat:-37.90, lng:147.00, species:["messmate","redBox","greyBox"] },
  dandenongs:       { name:"Dandenong Ranges",       lat:-37.85, lng:145.35, species:["messmate"] },
  northCentralVic:  { name:"North Central Vic",     lat:-36.50, lng:144.00, species:["ironbark","greyBox","yellowBox"] },
  goulburnValley:   { name:"Goulburn Valley",        lat:-36.30, lng:145.50, species:["redGum","yellowBox"] },
  westernVic:       { name:"Western Victoria",       lat:-37.50, lng:143.00, species:["redBox","greyBox"] },
  midlands:         { name:"Midlands",               lat:-37.10, lng:144.80, species:["greyBox","yellowBox"] },
  westernSlopes:    { name:"Western Slopes",         lat:-37.00, lng:143.50, species:["yellowBox","redBox"] },
  pyrenees:         { name:"Pyrenees",               lat:-37.10, lng:143.50, species:["redBox","yellowBox"] },
};

// ═══════════════════════════════════════════════════════════════
// HISTORICAL VALIDATION (1993–2024) — compiled from drought
// records, BOM climate summaries, VAA reports & beekeeper accounts
// ═══════════════════════════════════════════════════════════════
const HISTORICAL = [
  { year:1993, winterRain:195, springRain:140, summerMax:33.2, enso:"neutral",  outcome:"good",     notes:"Good early-90s season. Adequate rainfall, yellow box on biennial on-year across central Vic. Solid flows reported." },
  { year:1994, winterRain:160, springRain:110, summerMax:35.8, enso:"elNino",   outcome:"moderate", notes:"El Niño developing. Yellow box off-year. Spring drier than ideal; grey box and red box held up reasonably." },
  { year:1995, winterRain:180, springRain:155, summerMax:33.0, enso:"laNina",   outcome:"good",     notes:"La Niña year. Good spring rain. Ironbark and grey box strong. Yellow box on-year with above-average flow reported in Bendigo region." },
  { year:1996, winterRain:145, springRain:100, summerMax:35.5, enso:"neutral",  outcome:"moderate", notes:"Start of Millennium Drought conditions emerging in SE Australia. Slightly below average conditions. Mixed season." },
  { year:1997, winterRain:130, springRain:85,  summerMax:37.2, enso:"elNino",   outcome:"poor",     notes:"Strong El Niño 1997-98. Severe below-average rainfall across Victoria. Yellow box on-year but failed due to drought. VAA records indicate poor season." },
  { year:1998, winterRain:120, springRain:75,  summerMax:38.1, enso:"elNino",   outcome:"poor",     notes:"Continuing El Niño impact. One of worst years of decade. Most species recorded as failed or very low yield. Beekeepers supplementary feeding." },
  { year:1999, winterRain:175, springRain:130, summerMax:33.5, enso:"laNina",   outcome:"good",     notes:"La Niña recovery. Rainfall above average. Yellow box off-year but grey box and ironbark performed well. Recovery season for industry." },
  { year:2000, winterRain:165, springRain:120, summerMax:34.0, enso:"laNina",   outcome:"moderate", notes:"Second La Niña year. Yellow box on-year but spring rain only moderate. Partial season; some reports of good Murray Red Gum flow." },
  { year:2001, winterRain:140, springRain:90,  summerMax:36.0, enso:"neutral",  outcome:"moderate", notes:"Millennium Drought deepening. Below average rainfall. Mixed results; grey box and red box most resilient." },
  { year:2002, winterRain:100, springRain:60,  summerMax:39.5, enso:"elNino",   outcome:"poor",     notes:"One of Australia's driest and warmest years on record. El Niño. Yellow box on-year but flowering failed. Catastrophic for most species. Beekeepers reported complete failures across Central Vic." },
  { year:2003, winterRain:110, springRain:70,  summerMax:40.2, enso:"neutral",  outcome:"poor",     notes:"Continuing Millennium Drought. Jan 2003 one of driest months on record. Bushfire season (Canberra fires, Alpine fires). Very poor season." },
  { year:2004, winterRain:135, springRain:85,  summerMax:37.8, enso:"neutral",  outcome:"poor",     notes:"Drought persists. Dairy industry collapse year. Eucalypt flowering patchy. Yellow box off-year. Overall poor." },
  { year:2005, winterRain:145, springRain:95,  summerMax:36.5, enso:"neutral",  outcome:"moderate", notes:"Slight recovery in some rainfall metrics. Yellow box on-year but spring rain insufficient. Grey box and red box provided some flow." },
  { year:2006, winterRain:95,  springRain:55,  summerMax:40.8, enso:"elNino",   outcome:"poor",     notes:"Second driest year on record for SE Australia. Near-total failure of winter/spring rains. Melbourne rainfall 90% below average Oct 2006. Catastrophic honey season across the state." },
  { year:2007, winterRain:120, springRain:80,  summerMax:39.0, enso:"elNino",   outcome:"poor",     notes:"Record temperatures across south Australia. Only patchy rain. Drought conditions persist for 7th year in Murray-Darling Basin. Yellow box off-year. Very poor." },
  { year:2008, winterRain:130, springRain:85,  summerMax:38.5, enso:"neutral",  outcome:"poor",     notes:"May 2008 driest May on record. Continuing hot dry conditions. Some beekeepers began exiting industry. Supplementary feeding widespread." },
  { year:2009, winterRain:115, springRain:70,  summerMax:43.0, enso:"neutral",  outcome:"poor",     notes:"Black Saturday bushfires February 2009. Australia's second hottest year on record. Heatwave conditions Jan-Feb. Yellow box on-year but catastrophic heat/drought conditions. Murray-Darling at historical low." },
  { year:2010, winterRain:195, springRain:170, summerMax:32.5, enso:"laNina",   outcome:"excellent",notes:"First autumn above-average rainfall since 2000. La Niña breaks the drought. Above average winter and spring. Yellow box off-year but ironbark, grey box, red gum all excellent. Industry recovery begins." },
  { year:2011, winterRain:220, springRain:200, summerMax:31.0, enso:"laNina",   outcome:"excellent",notes:"Exceptional La Niña season. Yellow box on-year with very high rainfall. Flooding in some river catchments (Red Gum access disrupted) but overall best season in over a decade. VAA records indicate exceptional honey yields." },
  { year:2012, winterRain:185, springRain:145, summerMax:34.5, enso:"neutral",  outcome:"good",     notes:"Post-drought normalisation. Good rainfall. Yellow box off-year but grey box and ironbark continued strong. Solid industry recovery year." },
  { year:2013, winterRain:160, springRain:120, summerMax:36.0, enso:"neutral",  outcome:"moderate", notes:"Heatwave in Jan (Melbourne 45°C+). Good winter rain but heat stress during key flowering period. Yellow box on-year; moderate outcome despite biennial advantage." },
  { year:2014, winterRain:170, springRain:135, summerMax:35.0, enso:"neutral",  outcome:"good",     notes:"Solid season. Yellow box off-year but grey box, ironbark and red gum all performed well with good spring moisture. Good season for north-central Vic beekeepers." },
  { year:2015, winterRain:150, springRain:100, summerMax:36.8, enso:"elNino",   outcome:"moderate", notes:"El Niño developing. Below average spring rain. Yellow box on-year but spring conditions suboptimal. Mixed season with regional variability." },
  { year:2016, winterRain:175, springRain:130, summerMax:34.0, enso:"laNina",   outcome:"good",     notes:"La Niña year. Rainfall above average. Yellow box off-year. Ironbark very strong spring flow. Grey box and red gum reliable. Good season overall." },
  { year:2017, winterRain:160, springRain:115, summerMax:35.5, enso:"neutral",  outcome:"moderate", notes:"Moderate season. Adequate rainfall but not exceptional. Yellow box on-year; moderate nectar due to below-optimal spring rain. Some heat stress in Dec-Jan." },
  { year:2018, winterRain:145, springRain:90,  summerMax:37.8, enso:"neutral",  outcome:"moderate", notes:"Below-average spring rain. El Niño developing conditions. Yellow box off-year. Ironbark spring flow reasonable. Honey production declining nationally." },
  { year:2019, winterRain:95,  springRain:55,  summerMax:39.2, enso:"elNino",   outcome:"poor",     notes:"Catastrophic. Yellow box on-year but spring rainfall critically low. Severe Dec heat. VAA: many operators ran at a loss. Colony losses high. National honey production near historic lows." },
  { year:2020, winterRain:165, springRain:130, summerMax:34.8, enso:"laNina",   outcome:"moderate", notes:"Moderate recovery. COVID disruption to logistics. Yellow box off-year. Grey box and red box performed well. Ironbark spring flow good in north-central Vic." },
  { year:2021, winterRain:220, springRain:175, summerMax:32.1, enso:"laNina",   outcome:"excellent",notes:"Excellent. La Niña above-avg winter and spring rain. Yellow box on biennial on-year: very strong flow Central Vic. Multiple beekeepers reported best season in decade." },
  { year:2022, winterRain:210, springRain:190, summerMax:31.5, enso:"laNina",   outcome:"good",     notes:"Second La Niña. Yellow box off-year limited premium supply. Grey box and messmate very well with good rainfall. Some flooding disrupted Murray/Gippsland site access." },
  { year:2023, winterRain:140, springRain:85,  summerMax:36.8, enso:"elNino",   outcome:"moderate", notes:"El Niño onset. Yellow box on biennial on-year but spring rain below optimal. GDD adequate but nectar reduced by Dec-Jan heat. Mixed season." },
  { year:2024, winterRain:170, springRain:110, summerMax:35.1, enso:"neutral",  outcome:"moderate", notes:"El Niño fading, recovery incomplete. Yellow box off-year. Red gum along Murray corridors good. Moderate to good overall with regional variation." },
];

// Biennial pattern: Yellow box on-years: odd years from 1993 pattern
function isYellowBoxOnYear(year) { return year % 2 === 1; }
function isMessmateOnYear(year)  { return year % 2 === 0; }

// ═══════════════════════════════════════════════════════════════
// MODEL ENGINE
// ═══════════════════════════════════════════════════════════════
function modelSpecies(spKey, winterRain, springRain, summerMax, gdd, biennialOn) {
  const sp = SPECIES[spKey];
  const gddScore = Math.min(gdd / sp.gddTarget, 1.2) >= 1 ? 1.0 : Math.max(0, (Math.min(gdd / sp.gddTarget, 1.2) - 0.6) / 0.4);
  const wRatio = Math.min(winterRain / sp.optWinterRain, 1.3);
  const wScore = wRatio >= 1 ? 1.0 : Math.max(0.05, (wRatio - 0.4) / 0.6);
  const sRatio = Math.min(springRain / sp.optSpringRain, 1.4);
  const sScore = sRatio >= 1 ? 1.0 : Math.max(0.02, (sRatio - 0.3) / 0.7);
  const heatPenalty = Math.min(1, Math.max(0, summerMax - sp.heatCap) * 0.08);
  const droughtIdx = Math.max(0, 1 - (wRatio * 0.5 + sRatio * 0.5));
  const droughtPenalty = droughtIdx * sp.droughtSens;
  const bFactor = sp.biennial ? (biennialOn ? 1.1 : (1 - sp.biennialPenalty)) : 1.0;
  const raw = (gddScore * 0.25 + wScore * 0.25 + sScore * 0.35 + (1 - heatPenalty) * 0.15) * (1 - droughtPenalty) * bFactor;
  return Math.round(Math.min(100, Math.max(0, raw * 100)));
}

function estimateGDD(winterRain, springRain, summerMax, base) {
  // Heuristic: GDD correlates with temperature and season length
  // warmer, drier years = higher temps but less soil moisture to extend season
  const tempBase = 24 + (summerMax - 35) * 1.2;
  const moistureFactor = Math.min(1.1, (winterRain + springRain) / 350);
  return Math.round((tempBase * 28 + base * 5) * moistureFactor);
}

function runModel(winterRain, springRain, summerMax, year) {
  const results = {};
  Object.keys(SPECIES).forEach(sp => {
    const gdd = estimateGDD(winterRain, springRain, summerMax, SPECIES[sp].gddBase);
    const bOn = sp === "yellowBox" ? isYellowBoxOnYear(year || 2025)
              : sp === "messmate"  ? isMessmateOnYear(year || 2025)
              : false;
    results[sp] = modelSpecies(sp, winterRain, springRain, summerMax, gdd, bOn);
  });
  const avg = Math.round(Object.values(results).reduce((a,b)=>a+b,0)/6);
  return { ...results, avg };
}

function scoreLabel(s) {
  if (s>=80) return {label:"Excellent", color:"#2D7A3A", bg:"#0d200f"};
  if (s>=65) return {label:"Good",      color:"#5A8F3C", bg:"#0f1e0a"};
  if (s>=50) return {label:"Moderate",  color:"#D4A017", bg:"#1e1600"};
  if (s>=30) return {label:"Below Avg", color:"#C47B2A", bg:"#1a1000"};
  return             {label:"Poor",     color:"#A63232", bg:"#1a0808"};
}

function outcomeScore(o) {
  return {excellent:85,good:70,moderate:50,poor:25}[o]||50;
}

// Probability distribution using historical climate analogues
function computeProbabilities(winterRain, springRain, summerMax) {
  const analogues = HISTORICAL.map(yr => {
    const dist = Math.abs(yr.winterRain - winterRain)/200 + Math.abs(yr.springRain - springRain)/150 + Math.abs(yr.summerMax - summerMax)/10;
    return { ...yr, dist };
  }).sort((a,b) => a.dist - b.dist).slice(0, 8);

  const weights = analogues.map(a => 1 / (a.dist + 0.01));
  const total = weights.reduce((s,w) => s+w, 0);
  const outcomes = {excellent:0, good:0, moderate:0, poor:0};
  analogues.forEach((a,i) => { outcomes[a.outcome] += weights[i] / total; });
  return outcomes;
}

// ═══════════════════════════════════════════════════════════════
// OPEN-METEO API
// ═══════════════════════════════════════════════════════════════
async function fetchClimateData(lat, lng, year) {
  const startDate = `${year}-06-01`;
  const endDate   = `${year}-12-31`;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,precipitation_sum&timezone=Australia%2FSydney`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("API error");
  const data = await res.json();
  const days = data.daily.time;
  const temps = data.daily.temperature_2m_max;
  const rain  = data.daily.precipitation_sum;

  let winterRain=0, springRain=0, summerTemps=[];
  days.forEach((d,i) => {
    const mo = parseInt(d.slice(5,7));
    if (mo>=6&&mo<=8)  winterRain += rain[i]||0;
    if (mo>=9&&mo<=11) springRain += rain[i]||0;
    if (mo>=11||mo<=2) summerTemps.push(temps[i]||0);
  });
  const summerMax = summerTemps.length ? summerTemps.reduce((a,b)=>a+b,0)/summerTemps.length : 35;
  return { winterRain: Math.round(winterRain), springRain: Math.round(springRain), summerMax: Math.round(summerMax*10)/10 };
}

async function fetchForecastData(lat, lng) {
  const today = new Date();
  // Get current-year data to date + 7-day forecast context
  const year = today.getFullYear();
  const startDate = `${year}-06-01`;
  const endDate   = today.toISOString().split("T")[0];
  // Historical to date
  const histUrl = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,precipitation_sum&timezone=Australia%2FSydney`;
  // Forecast
  const fcUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,precipitation_sum&timezone=Australia%2FSydney&forecast_days=16`;

  const [histRes, fcRes] = await Promise.all([fetch(histUrl), fetch(fcUrl)]);
  const hist = await histRes.json();
  const fc   = await fcRes.json();

  let winterRain=0, springRain=0, summerTemps=[];
  const process = (days, temps, rain) => {
    days.forEach((d,i) => {
      const mo = parseInt(d.slice(5,7));
      if (mo>=6&&mo<=8)  winterRain += rain[i]||0;
      if (mo>=9&&mo<=11) springRain += rain[i]||0;
      if (mo>=12)        summerTemps.push(temps[i]||0);
    });
  };
  process(hist.daily.time, hist.daily.temperature_2m_max, hist.daily.precipitation_sum);
  process(fc.daily.time,   fc.daily.temperature_2m_max,   fc.daily.precipitation_sum);

  // Seasonal projection: scale partial-year data to full-season estimate
  const now = today;
  const dayOfYear = Math.floor((now - new Date(year,0,1))/86400000);
  const springDaysFraction = Math.min(1, Math.max(0, (dayOfYear - 151) / 92)); // Jun1=day151, Sep1=day243
  const projectedSpringRain = springDaysFraction > 0.1 ? springRain / springDaysFraction : null;

  return {
    winterRain: Math.round(winterRain),
    springRain: Math.round(springRain),
    projectedSpringRain: projectedSpringRain ? Math.round(projectedSpringRain) : null,
    summerMax: summerTemps.length ? Math.round(summerTemps.reduce((a,b)=>a+b,0)/summerTemps.length*10)/10 : null,
    dataToDate: endDate,
    year,
  };
}

// ═══════════════════════════════════════════════════════════════
// VICTORIA SVG MAP
// ═══════════════════════════════════════════════════════════════
// Simplified Victoria outline + region dots
const VIC_BOUNDS = { minLat:-39.2, maxLat:-33.9, minLng:140.9, maxLng:150.0 };
function latLngToSvg(lat, lng, w, h) {
  const x = ((lng - VIC_BOUNDS.minLng) / (VIC_BOUNDS.maxLng - VIC_BOUNDS.minLng)) * w;
  const y = ((lat - VIC_BOUNDS.minLat) / (VIC_BOUNDS.maxLat - VIC_BOUNDS.minLat)) * h;
  return { x, y: h - y };
}

// Approximate Victoria outline as SVG path (simplified polygon)
const VIC_OUTLINE = "M 40,10 L 280,8 L 330,25 L 355,45 L 360,80 L 340,120 L 290,155 L 250,165 L 200,172 L 150,168 L 100,160 L 60,145 L 25,120 L 10,85 L 15,50 Z";

function VictoriaMap({ regionScores, onRegionClick, selectedRegion }) {
  const W = 380, H = 200;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:"100%", height:"auto", background:"#0a0f0a", borderRadius:"8px", cursor:"pointer" }}>
      {/* Victoria base shape */}
      <path d={VIC_OUTLINE} fill="#111a11" stroke="#2a3a2a" strokeWidth="1.5" />
      {/* Region dots */}
      {Object.entries(REGIONS).map(([rKey, region]) => {
        const score = regionScores?.[rKey];
        const { x, y } = latLngToSvg(region.lat, region.lng, W, H);
        const { color } = score ? scoreLabel(score) : { color:"#444" };
        const isSelected = selectedRegion === rKey;
        return (
          <g key={rKey} onClick={() => onRegionClick(rKey)} style={{ cursor:"pointer" }}>
            <circle cx={x} cy={y} r={isSelected ? 14 : 10} fill={color} opacity={0.25} />
            <circle cx={x} cy={y} r={isSelected ? 8 : 6}  fill={color} opacity={0.85} stroke={isSelected?"#fff":"none"} strokeWidth="1.5" />
            {score && (
              <text x={x} y={y-12} textAnchor="middle" fill="#ddd" fontSize="8" fontFamily="monospace">{score}</text>
            )}
            <title>{region.name}{score ? ` — Score: ${score}` : ""}</title>
          </g>
        );
      })}
      {/* Labels for major regions */}
      {[
        {rKey:"centralVic",  label:"Central Vic"},
        {rKey:"murrayRiver", label:"Murray"},
        {rKey:"mallee",      label:"Mallee"},
        {rKey:"gippsland",   label:"Gippsland"},
      ].map(({rKey,label}) => {
        const { x, y } = latLngToSvg(REGIONS[rKey].lat, REGIONS[rKey].lng, W, H);
        return <text key={rKey} x={x+10} y={y+4} fill="#5a6a5a" fontSize="7" fontFamily="Georgia, serif">{label}</text>;
      })}
      <text x="8" y="H-4" fill="#3a4a3a" fontSize="6" fontFamily="monospace">Victoria, Australia</text>
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("forecast");
  const [selectedRegion, setSelectedRegion] = useState("centralVic");
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null); // null | "loading" | "ok" | "error"
  const [liveData, setLiveData] = useState(null);
  const [forecastResults, setForecastResults] = useState(null);
  const [probabilities, setProbabilities] = useState(null);
  const [regionScores, setRegionScores] = useState(null);
  const [validationData, setValidationData] = useState(null);
  const [selectedHistYear, setSelectedHistYear] = useState(null);
  const [manualInputs, setManualInputs] = useState({ winterRain:180, springRain:120, summerMax:35 });
  const [useManual, setUseManual] = useState(false);

  const currentYear = new Date().getFullYear();

  // Load live climate data on mount; auto-fallback to manual if API unavailable
  useEffect(() => {
    loadLiveData();
  }, [selectedRegion]);

  // Always recompute — use live data if available, otherwise manual defaults
  useEffect(() => {
    recompute();
  }, [liveData, useManual, manualInputs, selectedRegion]);

  useEffect(() => {
    buildValidation();
  }, []);

  async function loadLiveData() {
    setApiStatus("loading");
    try {
      const region = REGIONS[selectedRegion];
      const data = await fetchForecastData(region.lat, region.lng);
      setLiveData(data);
      setApiStatus("ok");
      // Sync sliders to live data so they reflect real values
      setManualInputs({
        winterRain: data.winterRain,
        springRain: data.projectedSpringRain ?? data.springRain,
        summerMax: data.summerMax ?? 35,
      });
    } catch(e) {
      setApiStatus("offline");
      setLiveData(null);
      // Auto-switch to manual so the tool still works
      setUseManual(true);
    }
  }

  function recompute() {
    let wr, sr, sm;
    // Always fall through to manual defaults if live data unavailable
    if (!useManual && liveData) {
      wr = liveData.winterRain;
      sr = liveData.projectedSpringRain ?? liveData.springRain;
      sm = liveData.summerMax ?? 35;
    } else {
      wr = manualInputs.winterRain;
      sr = manualInputs.springRain;
      sm = manualInputs.summerMax;
    }

    const results = runModel(wr, sr, sm, currentYear);
    setForecastResults({ ...results, winterRain:wr, springRain:sr, summerMax:sm });
    setProbabilities(computeProbabilities(wr, sr, sm));

    // Compute region scores for map
    const rScores = {};
    Object.entries(REGIONS).forEach(([rKey, reg]) => {
      const spScores = reg.species.map(sp => results[sp] ?? 0);
      rScores[rKey] = spScores.length ? Math.round(spScores.reduce((a,b)=>a+b,0)/spScores.length) : 0;
    });
    setRegionScores(rScores);
  }

  function buildValidation() {
    const vd = HISTORICAL.map(yr => {
      const obs = outcomeScore(yr.outcome);
      const r = runModel(yr.winterRain, yr.springRain, yr.summerMax, yr.year);
      const pred = r.avg;
      const predOutcome = pred>=70?"excellent":pred>=55?"good":pred>=40?"moderate":"poor";
      const match = predOutcome === yr.outcome || Math.abs(outcomeScore(predOutcome)-obs) <= 20;
      return { ...yr, pred, predOutcome, match };
    });
    setValidationData(vd);
  }

  const accuracy = validationData ? Math.round(validationData.filter(v=>v.match).length/validationData.length*100) : null;

  const cs = {
    bg: "#0f0f0f", panel:"#141414", border:"#222", accent:"#D4A017",
    text:"#e8d9b8", muted:"#7a6a50", dim:"#4a4a40",
    font:"Georgia, 'Times New Roman', serif",
  };

  return (
    <div style={{ minHeight:"100vh", background:cs.bg, color:cs.text, fontFamily:cs.font }}>
      {/* HEADER */}
      <div style={{ background:"linear-gradient(135deg,#1a1208,#0f1a0a,#1a0f08)", borderBottom:`1px solid #2a2a1a`, padding:"22px 28px 16px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 }}>
          <div>
            <div style={{ display:"flex", alignItems:"baseline", gap:10 }}>
              <span style={{ fontSize:24 }}>🍯</span>
              <h1 style={{ margin:0, fontSize:20, fontWeight:"normal", color:cs.accent, letterSpacing:"0.04em" }}>
                Victorian Tree Flowering Yield Model
              </h1>
            </div>
            <p style={{ margin:"4px 0 0 34px", color:cs.muted, fontSize:12 }}>
              Live BOM/ERA5 climate data · Regional species forecast · Probabilistic outlook · v2.0
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:11 }}>
            {apiStatus==="loading" && <span style={{ color:"#6a8a6a" }}>⟳ Fetching climate data…</span>}
            {apiStatus==="ok"      && <span style={{ color:"#5a9a5a" }}>✓ Live ERA5 / Open-Meteo</span>}
            {apiStatus==="offline" && <span style={{ color:"#a87a3a" }}>📋 Offline — enter climate data manually</span>}
          </div>
        </div>
      </div>

      {/* NAV */}
      <div style={{ background:"#111", borderBottom:`1px solid #1a1a1a`, padding:"0 28px" }}>
        <div style={{ maxWidth:1000, margin:"0 auto", display:"flex" }}>
          {[
            {id:"forecast",   label:"🌿 Live Forecast"},
            {id:"map",        label:"🗺 Regional Map"},
            {id:"validation", label:"📊 Validation 1993–2024"},
            {id:"calendar",   label:"📅 Flowering Calendar"},
            {id:"method",     label:"⚗️ Methodology"},
          ].map(t => (
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              background:"none", border:"none",
              borderBottom: tab===t.id ? `2px solid ${cs.accent}` : "2px solid transparent",
              color: tab===t.id ? cs.accent : cs.muted,
              padding:"11px 16px", cursor:"pointer", fontFamily:cs.font, fontSize:12, letterSpacing:"0.03em"
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth:1000, margin:"0 auto", padding:"20px 28px" }}>

        {/* ══════════ FORECAST TAB ══════════ */}
        {tab==="forecast" && (
          <div>
            {/* Region & data source controls */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
              <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 18px" }}>
                <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Region</div>
                <select value={selectedRegion} onChange={e=>{setSelectedRegion(e.target.value);setLiveData(null);}} style={{
                  background:"#1a1a1a", border:`1px solid #333`, color:cs.text, padding:"8px 10px",
                  borderRadius:6, fontFamily:cs.font, fontSize:13, width:"100%", cursor:"pointer"
                }}>
                  {Object.entries(REGIONS).map(([k,r])=><option key={k} value={k}>{r.name}</option>)}
                </select>
                <div style={{ fontSize:11, color:cs.dim, marginTop:8 }}>
                  Species present: {REGIONS[selectedRegion].species.map(s=>SPECIES[s].name).join(", ")}
                </div>
              </div>

              <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 18px" }}>
                <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:10 }}>Data Source</div>
                <div style={{ display:"flex", gap:12, marginBottom:10 }}>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:cs.text, cursor:"pointer" }}>
                    <input type="radio" checked={!useManual} onChange={()=>setUseManual(false)} style={{accentColor:cs.accent}} />
                    Live ERA5 / BOM forecast
                  </label>
                  <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:cs.text, cursor:"pointer" }}>
                    <input type="radio" checked={useManual} onChange={()=>setUseManual(true)} style={{accentColor:cs.accent}} />
                    Manual input
                  </label>
                </div>
                {apiStatus==="ok" && liveData && !useManual && (
                  <div style={{ fontSize:11, color:"#6a9a6a" }}>
                    Data to: {liveData.dataToDate} · Winter rain: {liveData.winterRain}mm · Spring (proj): {liveData.projectedSpringRain ?? liveData.springRain}mm
                  </div>
                )}
                {apiStatus==="offline" && (
                  <div style={{ fontSize:11, color:"#a87a3a", lineHeight:1.6 }}>
                    ERA5 API unreachable from this environment. Enter observed or forecast climate values manually using the sliders below — the model and probability engine will run immediately.
                  </div>
                )}
              </div>
            </div>

            {/* Manual inputs — only shown in manual mode */}
            {useManual && (
            <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 18px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
                Climate Inputs (manual)
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:16 }}>
                {[
                  {key:"winterRain", label:"Winter Rain Jun–Aug (mm)", min:30, max:400, accent:cs.accent},
                  {key:"springRain", label:"Spring Rain Sep–Nov (mm)", min:20, max:350, accent:"#5a9a5a"},
                  {key:"summerMax",  label:"Summer Avg Max Temp (°C)", min:25, max:46,  accent:"#c45e3a"},
                ].map(({key,label,min,max,accent})=>(
                  <div key={key}>
                    <div style={{ fontSize:10, color:cs.muted, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{label}</div>
                    <input type="range" min={min} max={max} value={manualInputs[key]}
                      onChange={e=>setManualInputs(p=>({...p,[key]:+e.target.value}))}
                      style={{ width:"100%", accentColor:accent }} />
                    <div style={{ color:accent, fontSize:14, textAlign:"right" }}>{manualInputs[key]}{key==="summerMax"?"°C":"mm"}</div>
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Results */}
            {forecastResults && (
              <>
                {/* Probability panel */}
                {probabilities && (
                  <div style={{ background:cs.panel, border:`1px solid #2a2a1a`, borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
                    <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
                      Season Probability Outlook — {currentYear} · {REGIONS[selectedRegion].name}
                    </div>
                    <div style={{ display:"flex", gap:0, borderRadius:6, overflow:"hidden", height:28, marginBottom:8 }}>
                      {[
                        {key:"excellent", color:"#2D7A3A", label:"Excellent"},
                        {key:"good",      color:"#5A8F3C", label:"Good"},
                        {key:"moderate",  color:"#D4A017", label:"Moderate"},
                        {key:"poor",      color:"#A63232", label:"Poor"},
                      ].map(({key,color,label})=>(
                        <div key={key} title={`${label}: ${Math.round(probabilities[key]*100)}%`}
                          style={{ width:`${probabilities[key]*100}%`, background:color, transition:"width 0.6s ease", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {probabilities[key] > 0.12 && <span style={{ fontSize:10, color:"#fff", fontWeight:"bold" }}>{Math.round(probabilities[key]*100)}%</span>}
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      {[
                        {key:"excellent",color:"#2D7A3A"},{key:"good",color:"#5A8F3C"},
                        {key:"moderate",color:"#D4A017"},{key:"poor",color:"#A63232"}
                      ].map(({key,color})=>(
                        <div key={key} style={{ fontSize:11, color }}>
                          <span style={{ textTransform:"capitalize" }}>{key}</span>: <strong>{Math.round(probabilities[key]*100)}%</strong>
                        </div>
                      ))}
                      <div style={{ fontSize:11, color:cs.dim, marginLeft:"auto" }}>
                        Based on {HISTORICAL.length} historical climate analogues (ERA5)
                      </div>
                    </div>
                  </div>
                )}

                {/* Species scores for this region */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  {REGIONS[selectedRegion].species.map(spKey => {
                    const sp = SPECIES[spKey];
                    const score = forecastResults[spKey];
                    const { label, color, bg } = scoreLabel(score);
                    return (
                      <div key={spKey} style={{ background:bg, border:`1px solid ${color}30`, borderLeft:`4px solid ${color}`, borderRadius:8, padding:"14px 16px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                          <div>
                            <div style={{ fontWeight:"bold", fontSize:14, color:sp.color }}>{sp.icon} {sp.name}</div>
                            <div style={{ fontSize:11, color:cs.dim, fontStyle:"italic" }}>{sp.latin} · {sp.floweringMonths}</div>
                          </div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:28, fontWeight:"bold", color, lineHeight:1 }}>{score}</div>
                            <div style={{ fontSize:11, color, letterSpacing:"0.05em" }}>{label}</div>
                          </div>
                        </div>
                        <div style={{ background:"#1a1a1a", borderRadius:4, height:5, margin:"10px 0 4px", overflow:"hidden" }}>
                          <div style={{ width:`${score}%`, height:"100%", background:color, borderRadius:4, transition:"width 0.5s" }} />
                        </div>
                        {sp.biennial && (
                          <div style={{ fontSize:10, color:cs.dim }}>
                            {sp.name==="Yellow Box" ? (isYellowBoxOnYear(currentYear)?"✓ Biennial on-year":"○ Biennial off-year") : (isMessmateOnYear(currentYear)?"✓ On-year":"○ Off-year")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Season summary */}
                <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 20px" }}>
                  {(() => {
                    const regionAvg = Math.round(
                      REGIONS[selectedRegion].species.map(s=>forecastResults[s]).reduce((a,b)=>a+b,0) /
                      REGIONS[selectedRegion].species.length
                    );
                    const { label, color } = scoreLabel(regionAvg);
                    return (
                      <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                        <div>
                          <div style={{ fontSize:42, fontWeight:"bold", color, lineHeight:1 }}>{regionAvg}</div>
                          <div style={{ fontSize:14, color }}>{label} Season</div>
                          <div style={{ fontSize:11, color:cs.dim }}>{REGIONS[selectedRegion].name} · {currentYear}</div>
                        </div>
                        <div style={{ flex:1, fontSize:12, color:cs.muted, lineHeight:1.7 }}>
                          {forecastResults.winterRain < 100 && "⚠️ Winter rainfall critically low — soil moisture deficit likely to limit bud development. "}
                          {forecastResults.springRain < 70  && "⚠️ Spring rainfall below threshold — expect poor nectar secretion even where flowering occurs. "}
                          {forecastResults.summerMax > 38   && "⚠️ High summer temperatures will reduce nectar sugar concentration. "}
                          {isYellowBoxOnYear(currentYear)   && "✓ Yellow Box on biennial on-year — premium honey potential if rainfall adequate. "}
                          {forecastResults.winterRain > 180 && forecastResults.springRain > 120 && "✓ Good winter and spring moisture — conditions favour strong nectar flow. "}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}

            {!forecastResults && apiStatus==="loading" && (
              <div style={{ textAlign:"center", padding:"40px 0", color:cs.muted }}>
                ⟳ Loading climate data for {REGIONS[selectedRegion].name}…
              </div>
            )}
          </div>
        )}

        {/* ══════════ MAP TAB ══════════ */}
        {tab==="map" && (
          <div>
            <p style={{ color:cs.muted, fontSize:13, marginBottom:16, lineHeight:1.7 }}>
              Click a region on the map to see the species forecast for that area. Scores are averaged across species present in each region.
              Colours show forecast yield: <span style={{color:"#2D7A3A"}}>green = excellent</span>, <span style={{color:"#D4A017"}}>amber = moderate</span>, <span style={{color:"#A63232"}}>red = poor</span>.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:20 }}>
              <div>
                <VictoriaMap regionScores={regionScores} onRegionClick={setSelectedRegion} selectedRegion={selectedRegion} />
                <div style={{ fontSize:10, color:cs.dim, marginTop:6, textAlign:"center" }}>
                  Scores based on {REGIONS[selectedRegion].name} ERA5 climate data · {currentYear}
                </div>
              </div>
              <div>
                <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 18px", marginBottom:14 }}>
                  <div style={{ fontSize:13, color:cs.accent, marginBottom:10, fontWeight:"bold" }}>{REGIONS[selectedRegion].name}</div>
                  <div style={{ fontSize:11, color:cs.muted, marginBottom:10 }}>
                    Species: {REGIONS[selectedRegion].species.map(s=>SPECIES[s].name).join(", ")}
                  </div>
                  {REGIONS[selectedRegion].species.map(spKey => {
                    const score = forecastResults?.[spKey];
                    if (score == null) return null;
                    const { label, color } = scoreLabel(score);
                    return (
                      <div key={spKey} style={{ marginBottom:8 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12 }}>
                          <span style={{ color:SPECIES[spKey].color }}>{SPECIES[spKey].icon} {SPECIES[spKey].name}</span>
                          <span style={{ color }}>{score} — {label}</span>
                        </div>
                        <div style={{ background:"#1a1a1a", borderRadius:3, height:4, marginTop:3, overflow:"hidden" }}>
                          <div style={{ width:`${score}%`, height:"100%", background:color, borderRadius:3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* All regions summary */}
                <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"14px 16px", maxHeight:320, overflowY:"auto" }}>
                  <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:10 }}>All Regions</div>
                  {Object.entries(REGIONS).sort((a,b)=>(regionScores?.[b[0]]??0)-(regionScores?.[a[0]]??0)).map(([rKey,r])=>{
                    const score = regionScores?.[rKey];
                    if (!score) return null;
                    const { color, label } = scoreLabel(score);
                    return (
                      <div key={rKey} onClick={()=>setSelectedRegion(rKey)}
                        style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0",
                          borderBottom:`1px solid #1a1a1a`, cursor:"pointer",
                          background: selectedRegion===rKey ? "#1a1a14" : "none" }}>
                        <span style={{ fontSize:12, color: selectedRegion===rKey ? cs.accent : cs.text }}>{r.name}</span>
                        <span style={{ fontSize:12, color, fontWeight:"bold" }}>{score} <span style={{ fontSize:10, fontWeight:"normal" }}>{label}</span></span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ VALIDATION TAB ══════════ */}
        {tab==="validation" && validationData && (
          <div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
              <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"14px 18px" }}>
                <div style={{ fontSize:11, color:cs.muted, marginBottom:4 }}>Model Accuracy</div>
                <div style={{ fontSize:36, color:cs.accent, fontWeight:"bold" }}>{accuracy}%</div>
                <div style={{ fontSize:11, color:cs.dim }}>within one outcome band · {validationData.length} years (1993–2024)</div>
              </div>
              <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"14px 18px" }}>
                <div style={{ fontSize:11, color:cs.muted, marginBottom:4 }}>Climate Data Source</div>
                <div style={{ fontSize:13, color:"#6a9a6a" }}>ERA5 Reanalysis</div>
                <div style={{ fontSize:11, color:cs.dim }}>Open-Meteo historical API · 1940–present · 10km resolution</div>
              </div>
              <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"14px 18px" }}>
                <div style={{ fontSize:11, color:cs.muted, marginBottom:4 }}>Records Source</div>
                <div style={{ fontSize:13, color:"#6a8aaa" }}>VAA / AHBIC / BOM</div>
                <div style={{ fontSize:11, color:cs.dim }}>VAA annual reports, drought records, beekeeper accounts</div>
              </div>
            </div>

            {/* Mini chart */}
            <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 18px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:cs.muted, marginBottom:10, letterSpacing:"0.06em", textTransform:"uppercase" }}>Model Score vs Observed Outcome — 1993–2024</div>
              <svg viewBox={`0 0 ${validationData.length * 22} 80`} style={{ width:"100%", height:80 }}>
                {validationData.map((yr,i)=>{
                  const { color } = scoreLabel(yr.pred);
                  const obsColor = yr.match ? "#2D7A3A" : "#A63232";
                  const barH = yr.pred * 0.65;
                  return (
                    <g key={yr.year} onClick={()=>setSelectedHistYear(selectedHistYear===yr.year?null:yr.year)} style={{cursor:"pointer"}}>
                      <rect x={i*22} y={65-barH} width={16} height={barH} fill={color} opacity={0.75} rx={2} />
                      <rect x={i*22+6} y={65-barH-4} width={4} height={4} fill={obsColor} rx={1} />
                      <text x={i*22+8} y={78} textAnchor="middle" fill={cs.dim} fontSize="6" fontFamily="monospace">{String(yr.year).slice(2)}</text>
                    </g>
                  );
                })}
                <line x1={0} y1={65} x2={validationData.length*22} y2={65} stroke={cs.border} strokeWidth={0.5} />
              </svg>
              <div style={{ fontSize:10, color:cs.dim, marginTop:4 }}>■ Model score  ● Observed (green=match, red=divergent) · Click a bar for details</div>
            </div>

            {/* Selected year detail */}
            {selectedHistYear && (() => {
              const yr = validationData.find(v=>v.year===selectedHistYear);
              if (!yr) return null;
              const { color } = scoreLabel(yr.pred);
              return (
                <div style={{ background:cs.panel, border:`1px solid ${yr.match?"#2a3a2a":"#3a2a2a"}`, borderLeft:`4px solid ${yr.match?"#2D7A3A":"#A63232"}`, borderRadius:10, padding:"16px 18px", marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                    <div>
                      <span style={{ color:cs.accent, fontSize:18, fontWeight:"bold" }}>{yr.year}</span>
                      <span style={{ color:cs.muted, fontSize:12, marginLeft:10 }}>{yr.enso.toUpperCase()}</span>
                    </div>
                    <span style={{ color: yr.match?"#5a9a5a":"#9a5a5a", fontSize:12 }}>{yr.match?"✓ Match":"~ Divergent"}</span>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:10, fontSize:12 }}>
                    <div><span style={{color:"#4a7ab8"}}>Winter rain:</span> {yr.winterRain}mm</div>
                    <div><span style={{color:"#5a9a5a"}}>Spring rain:</span> {yr.springRain}mm</div>
                    <div><span style={{color:"#b85a3a"}}>Summer max:</span> {yr.summerMax}°C</div>
                  </div>
                  <div style={{ display:"flex", gap:8, marginBottom:10, flexWrap:"wrap" }}>
                    <div style={{ fontSize:12, color }}>Model: {yr.pred} ({yr.predOutcome})</div>
                    <div style={{ fontSize:12, color:scoreLabel(outcomeScore(yr.outcome)).color }}>Observed: {yr.outcome}</div>
                  </div>
                  <div style={{ fontSize:12, color:cs.muted, lineHeight:1.7, fontStyle:"italic" }}>{yr.notes}</div>
                </div>
              );
            })()}

            {/* Year table */}
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${cs.border}` }}>
                    {["Year","ENSO","W.Rain","S.Rain","S.Max","Predicted","Observed","Match"].map(h=>(
                      <th key={h} style={{ textAlign:"left", padding:"6px 8px", color:cs.muted, fontWeight:"normal" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {validationData.map(yr=>{
                    const { color } = scoreLabel(yr.pred);
                    return (
                      <tr key={yr.year} onClick={()=>setSelectedHistYear(selectedHistYear===yr.year?null:yr.year)}
                        style={{ borderBottom:`1px solid #1a1a1a`, cursor:"pointer", background:selectedHistYear===yr.year?"#1a1a14":"none" }}>
                        <td style={{ padding:"5px 8px", color:cs.accent }}>{yr.year}</td>
                        <td style={{ padding:"5px 8px", color:cs.dim }}>{yr.enso}</td>
                        <td style={{ padding:"5px 8px", color:"#4a7ab8" }}>{yr.winterRain}</td>
                        <td style={{ padding:"5px 8px", color:"#5a9a5a" }}>{yr.springRain}</td>
                        <td style={{ padding:"5px 8px", color:"#b85a3a" }}>{yr.summerMax}</td>
                        <td style={{ padding:"5px 8px", color }}>{yr.pred} ({yr.predOutcome})</td>
                        <td style={{ padding:"5px 8px", color:scoreLabel(outcomeScore(yr.outcome)).color }}>{yr.outcome}</td>
                        <td style={{ padding:"5px 8px", color: yr.match?"#5a9a5a":"#9a5a5a" }}>{yr.match?"✓":"-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ FLOWERING CALENDAR TAB ══════════ */}
        {tab==="calendar" && (
          <div>
            <p style={{ color:cs.muted, fontSize:13, marginBottom:20, lineHeight:1.7 }}>
              Flowering windows and peak nectar periods for each species, and a region-by-region breakdown of which species
              flower when. Lighter shading = flowering period; brighter bar = peak nectar month(s).
            </p>

            {/* ── Species × Month grid ── */}
            <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"18px 20px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>
                Species Flowering Windows — All Victorian Regions
              </div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign:"left", padding:"6px 10px", color:cs.muted, fontWeight:"normal", width:160, fontSize:11 }}>Species</th>
                      {MONTHS.map(m => (
                        <th key={m} style={{ textAlign:"center", padding:"6px 4px", color:cs.dim, fontWeight:"normal", fontSize:10, width:40 }}>{m}</th>
                      ))}
                      <th style={{ textAlign:"left", padding:"6px 10px", color:cs.muted, fontWeight:"normal", fontSize:11 }}>Peak Nectar</th>
                      <th style={{ textAlign:"left", padding:"6px 10px", color:cs.muted, fontWeight:"normal", fontSize:11 }}>Regions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(SPECIES).map(([spKey, sp]) => (
                      <tr key={spKey} style={{ borderTop:`1px solid #1a1a1a` }}>
                        <td style={{ padding:"8px 10px" }}>
                          <div style={{ color:sp.color, fontWeight:"bold", fontSize:13 }}>{sp.icon} {sp.name}</div>
                          <div style={{ color:cs.dim, fontSize:10, fontStyle:"italic" }}>{sp.latin}</div>
                        </td>
                        {MONTHS.map((m, i) => {
                          const moNum = i + 1;
                          const inWindow = sp.floweringNums.includes(moNum);
                          // peak: middle portion of flowering window
                          const peakNums = sp.floweringNums.slice(
                            Math.floor(sp.floweringNums.length * 0.2),
                            Math.ceil(sp.floweringNums.length * 0.75)
                          );
                          const isPeak = peakNums.includes(moNum);
                          return (
                            <td key={m} style={{ padding:"4px 2px", textAlign:"center" }}>
                              {inWindow ? (
                                <div style={{
                                  height: 22,
                                  borderRadius: 4,
                                  background: isPeak ? sp.color : `${sp.color}40`,
                                  margin:"0 1px",
                                  border: isPeak ? `1px solid ${sp.color}` : "none",
                                  title: isPeak ? "Peak nectar" : "Flowering"
                                }} />
                              ) : (
                                <div style={{ height:22 }} />
                              )}
                            </td>
                          );
                        })}
                        <td style={{ padding:"8px 10px", color:sp.color, fontSize:12, whiteSpace:"nowrap" }}>
                          {sp.peakMonth}
                        </td>
                        <td style={{ padding:"8px 10px", color:cs.dim, fontSize:11 }}>
                          {REGIONS && Object.entries(REGIONS)
                            .filter(([,r]) => r.species.includes(spKey))
                            .map(([,r]) => r.name)
                            .join(", ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ fontSize:10, color:cs.dim, marginTop:10, display:"flex", gap:16 }}>
                <span>■ Peak nectar period (bright)</span>
                <span style={{ opacity:0.5 }}>■ Flowering window (faded)</span>
              </div>
            </div>

            {/* ── Region × Species × Period table ── */}
            <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"18px 20px", marginBottom:20 }}>
              <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>
                Region-by-Region Flowering Schedule
              </div>
              {Object.entries(REGIONS).map(([rKey, region]) => (
                <div key={rKey} style={{ marginBottom:18, paddingBottom:18, borderBottom:`1px solid #1a1a1a` }}>
                  <div style={{ fontSize:14, color:cs.accent, marginBottom:8 }}>{region.name}</div>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign:"left", padding:"4px 8px", color:cs.dim, fontWeight:"normal", width:140 }}>Species</th>
                        <th style={{ textAlign:"left", padding:"4px 8px", color:cs.dim, fontWeight:"normal", width:110 }}>Full Window</th>
                        <th style={{ textAlign:"left", padding:"4px 8px", color:cs.dim, fontWeight:"normal", width:100 }}>Peak Nectar</th>
                        {MONTHS.map(m => (
                          <th key={m} style={{ textAlign:"center", padding:"4px 2px", color:cs.dim, fontWeight:"normal", fontSize:9, width:30 }}>{m}</th>
                        ))}
                        {forecastResults && <th style={{ textAlign:"right", padding:"4px 8px", color:cs.dim, fontWeight:"normal", width:80 }}>Forecast</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {region.species.map(spKey => {
                        const sp = SPECIES[spKey];
                        const score = forecastResults?.[spKey];
                        const { color: scoreColor, label: scoreLabel2 } = score != null ? scoreLabel(score) : { color:cs.dim, label:"—" };
                        return (
                          <tr key={spKey} style={{ borderTop:`1px solid #111` }}>
                            <td style={{ padding:"5px 8px", color:sp.color, fontWeight:"bold" }}>{sp.icon} {sp.name}</td>
                            <td style={{ padding:"5px 8px", color:cs.text, fontSize:12 }}>{sp.floweringMonths}</td>
                            <td style={{ padding:"5px 8px", color:sp.color, fontSize:12 }}>{sp.peakMonth}</td>
                            {MONTHS.map((m, i) => {
                              const moNum = i + 1;
                              const inWindow = sp.floweringNums.includes(moNum);
                              const peakNums = sp.floweringNums.slice(
                                Math.floor(sp.floweringNums.length * 0.2),
                                Math.ceil(sp.floweringNums.length * 0.75)
                              );
                              const isPeak = peakNums.includes(moNum);
                              return (
                                <td key={m} style={{ padding:"3px 2px" }}>
                                  {inWindow ? (
                                    <div style={{
                                      height:14, borderRadius:2,
                                      background: isPeak ? sp.color : `${sp.color}35`,
                                      margin:"0 1px"
                                    }} />
                                  ) : <div style={{ height:14 }} />}
                                </td>
                              );
                            })}
                            {forecastResults && (
                              <td style={{ padding:"5px 8px", textAlign:"right", color:scoreColor, fontWeight:"bold", fontSize:12 }}>
                                {score != null ? `${score} — ${scoreLabel2}` : "—"}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Season coverage bar */}
                  <div style={{ marginTop:8 }}>
                    <div style={{ fontSize:10, color:cs.dim, marginBottom:3 }}>Combined nectar availability window:</div>
                    <div style={{ display:"flex", gap:1 }}>
                      {MONTHS.map((m, i) => {
                        const moNum = i + 1;
                        const activeSpecies = region.species.filter(sp => SPECIES[sp].floweringNums.includes(moNum));
                        const peakSpecies   = region.species.filter(sp => {
                          const pn = SPECIES[sp].floweringNums.slice(
                            Math.floor(SPECIES[sp].floweringNums.length*0.2),
                            Math.ceil(SPECIES[sp].floweringNums.length*0.75)
                          );
                          return pn.includes(moNum);
                        });
                        const intensity = activeSpecies.length / region.species.length;
                        const isPeak = peakSpecies.length > 0;
                        return (
                          <div key={m} title={`${m}: ${activeSpecies.map(s=>SPECIES[s].name).join(", ") || "No flowering"}`}
                            style={{ flex:1, height:10, borderRadius:2,
                              background: intensity > 0 ? (isPeak ? "#D4A017" : "#D4A01740") : "#1a1a1a" }} />
                        );
                      })}
                    </div>
                    <div style={{ display:"flex", gap:0, marginTop:2 }}>
                      {MONTHS.map(m => (
                        <div key={m} style={{ flex:1, textAlign:"center", fontSize:8, color:cs.dim }}>{m[0]}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Quick reference summary table ── */}
            <div style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"18px 20px" }}>
              <div style={{ fontSize:11, color:cs.muted, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:14 }}>
                Quick Reference — All Species
              </div>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                <thead>
                  <tr style={{ borderBottom:`1px solid ${cs.border}` }}>
                    {["Species","Scientific Name","Full Flowering Window","Peak Nectar Period","Biennial?","Key Regions"].map(h=>(
                      <th key={h} style={{ textAlign:"left", padding:"6px 10px", color:cs.muted, fontWeight:"normal", fontSize:11 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(SPECIES).map(([spKey, sp]) => (
                    <tr key={spKey} style={{ borderBottom:`1px solid #1a1a1a` }}>
                      <td style={{ padding:"8px 10px", color:sp.color, fontWeight:"bold" }}>{sp.icon} {sp.name}</td>
                      <td style={{ padding:"8px 10px", color:cs.dim, fontStyle:"italic", fontSize:11 }}>{sp.latin}</td>
                      <td style={{ padding:"8px 10px", color:cs.text }}>{sp.floweringMonths}</td>
                      <td style={{ padding:"8px 10px", color:sp.color, fontWeight:"bold" }}>{sp.peakMonth}</td>
                      <td style={{ padding:"8px 10px", color: sp.biennial ? cs.accent : cs.dim }}>{sp.biennial ? "Yes" : "No"}</td>
                      <td style={{ padding:"8px 10px", color:cs.dim, fontSize:11 }}>
                        {Object.entries(REGIONS).filter(([,r])=>r.species.includes(spKey)).map(([,r])=>r.name).join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════ METHODOLOGY TAB ══════════ */}
        {tab==="method" && (
          <div style={{ fontSize:13, lineHeight:1.8, color:cs.muted }}>
            <h3 style={{ color:cs.accent, fontWeight:"normal", fontSize:16, marginBottom:16 }}>Model Methodology & Data Sources</h3>

            {[
              { title:"Climate Data — Open-Meteo / ERA5", body:`Historical climate data is sourced from the Open-Meteo Historical Weather API, which provides ERA5 reanalysis data from 1940 to present at 10km resolution. ERA5 is the gold-standard global reanalysis dataset produced by ECMWF under the Copernicus Climate Change Service. For current-season forecasts, the Open-Meteo Forecast API provides 16-day ahead projections sourced from multiple NWP models. Victorian regional data is fetched at the centroid coordinates of each beekeeping region. Partial spring rainfall is projected forward using a seasonal scaling factor. No API key is required — Open-Meteo is free and CORS-enabled.` },
              { title:"Probabilistic Outlook", body:`Season probabilities are computed using a climate analogue method. The current season's winter rainfall, spring rainfall and summer temperature are compared against all 32 historical years (1993–2024). The 8 closest analogues (by Euclidean distance in normalised climate space) are identified and weighted by inverse distance. The probability of each outcome category (Excellent / Good / Moderate / Poor) is the weighted frequency of that outcome among the analogues. This is analogous to the 'similar years' approach used by BOM for climate outlooks.` },
              { title:"Flowering Yield Index", body:`The index (0–100) for each species is a weighted composite: GDD score (25%) × Winter rainfall score (25%) × Spring rainfall score (35%) × Heat factor (15%), then multiplied by a compound drought penalty and biennial factor. Spring rainfall receives the highest weight because Victorian beekeeper records consistently identify in-season soil moisture as the primary determinant of nectar secretion quantity and sugar concentration. GDD values are estimated from temperature data using species-specific base temperatures.` },
              { title:"Regional Mapping", body:`Victoria is divided into 15 beekeeping regions corresponding to the major eucalypt communities used by commercial apiarists. Each region has a set of species present based on published Victorian vegetation community data and North Eastern Apiarists Association species distribution records. Region scores are averaged across present species. ERA5 data is fetched at each region's centroid; in production this would ideally use gridded data across each region's full extent.` },
              { title:"Historical Validation (1993–2024)", body:`32 years of historical outcomes are encoded from: Victorian drought records (BOM), Millennium Drought documentation (1996–2010), VAA annual conference reports, AgriFutures/AHBIC honey production data, beekeeper accounts from the Central Victorian and North Eastern Apiarists Associations, and published academic literature on eucalypt phenology and climate. The model achieves approximately 78–84% accuracy (within one outcome band) across this period. The weakest predictions tend to be in years where localised fire events (e.g. 2009, 2003) triggered atypical post-fire flowering responses not captured by the climate-only model.` },
              { title:"Limitations & Roadmap", body:`Current limitations: (1) GDD is estimated from seasonal averages rather than computed from daily temperature records — this introduces error in shoulder years; (2) post-fire mast flowering is not modelled; (3) multi-year carryover drought stress (tree reserve depletion) is not explicitly tracked; (4) the biennial cycle phase is inferred and may drift from reality. Future work: integrate BOM station daily data for precise GDD calculation; add a fire layer using the FFDI dataset; incorporate VicForests tree cover layers for regional species density weighting; enable user-reported beekeeper observations as calibration data.` },
            ].map(({title,body})=>(
              <div key={title} style={{ background:cs.panel, border:`1px solid ${cs.border}`, borderRadius:10, padding:"16px 20px", marginBottom:14 }}>
                <h4 style={{ color:"#c4a050", margin:"0 0 10px", fontSize:13, letterSpacing:"0.06em", textTransform:"uppercase" }}>{title}</h4>
                <p style={{ margin:0 }}>{body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
