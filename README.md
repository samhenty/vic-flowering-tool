# Victorian Tree Flowering Yield Model 🍯

A climate-driven flowering yield forecast tool for Victorian beekeepers.

## Features
- Live ERA5 / Open-Meteo climate data (automatic when hosted online)
- Probabilistic season outlook based on 32 years of historical analogues (1993–2024)
- Six key species: Yellow Box, Grey Box, River Red Gum, Red Ironbark, Messmate, Red Box
- 15 Victorian beekeeping regions with interactive map
- Flowering calendar showing species windows and peak nectar periods
- Historical validation against VAA records and BOM drought data

## Species Covered
| Species | Flowering Window | Peak Nectar |
|---|---|---|
| Yellow Box (E. melliodora) | Oct–Feb | Nov–Dec |
| Grey Box (E. microcarpa) | Mar–Sep | May–Jul |
| River Red Gum (E. camaldulensis) | Nov–Feb | Dec–Jan |
| Red Ironbark (E. tricarpa) | Aug–Nov | Sep–Oct |
| Messmate Stringybark (E. obliqua) | Dec–Mar | Jan–Feb |
| Red Box (E. polyanthemos) | Jul–Nov | Aug–Oct |

## Deployment
This app is deployed via [Vercel](https://vercel.com) — see vercel.com for hosting details.

## Data Sources
- Climate: ERA5 Reanalysis via Open-Meteo API
- Validation: Victorian Apiarists Association records, BOM climate summaries, AHBIC honey production data
