# Weather Intelligence Agent Design

## 1. Overview
The Weather Intelligence Agent assesses meteorological and oceanographic conditions along maritime and multimodal corridors. It samples nautical waypoints along the route geometry, evaluates storm risks, computes weather-induced delay probabilities, and provides rerouting advisories.

## 2. Mathematical Modeling
- **Beaufort Scale Integration**: Converts wind speeds (knots) and swell wave heights ($H_s$ in meters) into maritime severity tiers (Force 0 to Force 12).
- **Storm Risk Index**:
  $$\text{StormRisk} = \min\left(100, \left( \frac{\text{WindKnots}}{45} \times 40 \right) + \left( \frac{\text{WaveHeightMeters}}{7.0} \times 40 \right) + \text{MonsoonPenalty}\right)$$
- **Delay Probability & Buffer Hours**:
  - Calm/Moderate ($< 30$ risk): 5-15% delay probability, $+0$ to $+4$ hours buffer.
  - Rough/Severe ($30-70$ risk): 25-55% delay probability, $+8$ to $+24$ hours buffer.
  - Storm/Cyclone ($> 70$ risk): $>75\%$ delay probability, $+48$ to $+96$ hours buffer with alternate route recommendation.

## 3. Data Ingestion & Fallbacks
1. Primary live telemetry sources: NOAA WaveWatch III, IMD Maritime Bulletins, Copernicus Marine Service.
2. High-precision offline fallback seeded datasets with historical sea-state matrices across Indian Ocean, Arabian Sea, Bay of Bengal, and Malacca Strait corridors.
