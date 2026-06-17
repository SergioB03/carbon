# CarbonBridge UI/UX Implementation Blueprint
## High-Fidelity Geo-Spatial & Tactile Upgrades

This blueprint documents the precise design decisions, state machines, and interface refinements implemented to elevate **CarbonBridge** from a static mock state to a highly interactive, tactile, premium logistics and carbon tracking dashboard.

---

### 1. High-Altitude Rotterdam Initialization 
To emphasize the logistic center gravity of the application, the interactive satellite map begins centered over the main trade destination hub rather than an arbitrary sub-supplier.

*   **Coordinates**: `[51.9244, 4.4777]` (Rotterdam Port HQ)
*   **Initial Zoom Level**: `5` (enables a macro overview of continental maritime shipping channels)
*   **State Flag**: Implemented a `isFirstRender` React `useRef` to prevent automatic flyTo triggers on initial list load, preserving the custom macro-geographic landing context.

---

### 2. "In the Clouds" Flight Transition Animation
When switching focus between global supplier locations, a high-altitude orbital cloud transition creates a cinematic simulation of physical distance and target lock-on.

```typescript
const [cloudPhase, setCloudPhase] = useState<'none' | 'condense' | 'dissolve'>('none');
```

```
[Target Selected] 
       │
       ▼
1. "condense" (0ms) ────────► Immediate radial cloudy mist overlay covers map container.
       │                      Rotating blur elements simulate orbital speed.
       ▼
2. "flyTo Trigger" (350ms) ──► Leaflet camera initiates flyTo animation to target lat/lon
       │                      with 2.2 second duration.
       ▼
3. "dissolve" (1600ms) ─────► Clouds begin a 600ms fade/scale-up dissolution as altitude 
       │                      drops to ground level.
       ▼
4. "none" (2700ms) ─────────► Complete removal of transition nodes from DOM.
```

---

### 3. Tactile Factory Decarbonisation Retrofits
Inside the **Carbon-Cut Payoffs Simulator (Target Year 2030)**, static slider inputs are supplemented with physical facility upgrade presets that immediately re-calculate supply-chain footprints and model estimated Capital Expenditure (CapEx).

#### Upgrade Profiles:
1.  **Solar/Wind PPAs** (CapEx: `€350k`): Drops emissions intensity by **35%** toward the Best-Practice floor.
2.  **H₂ Kiln Fusion** (CapEx: `€1.5M`): Drops emissions intensity by **60%** toward the Best-Practice floor.
3.  **Scrap EAF Upgrade** (CapEx: `€950k`): Drops emissions intensity straight to the absolute minimum floor.

```typescript
// Physical upgrade formulas tracking cap value limits:
let targetIntensity = baseline;
if (upgrades.greenPower) targetIntensity -= (baseline - floor) * 0.35;
if (upgrades.hydrogenKiln) targetIntensity -= (baseline - floor) * 0.60;
if (upgrades.scrapEaf) targetIntensity = floor;
```

---

### 4. Professional Visual Brand Identity (Anti-Emoji Strategy)
To completely eradicate "vibe coding" childishness and establish a defensible, audited technical style, all standard emoji markers and raw text symbols are replaced with custom structural web elements:

*   **Country Identifiers**: Replaced browser-native Unicode flags with high-contrast, compact alphanumeric Geographic Emblems:
    ```tsx
    <span className="inline-flex items-center justify-center px-1.5 py-0.5 bg-stone-905 border border-stone-850 text-emerald-400 font-mono text-[8.5px] font-bold tracking-wider rounded-xs mr-1.5 shrink-0 align-middle">
      {originCode}
    </span>
    ```
*   **Priority/Flag Notifications**: Replaced `🚨` and `⚑` markers with compact, pulsing geometric signal lights (`w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse`), reinforcing real-time data flow.
