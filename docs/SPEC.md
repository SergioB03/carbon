# CarbonBridge — Product Spec & Design Rationale

This document explains *what* CarbonBridge is and the design reasoning behind its most sensitive feature (the Verification Priority Flag). The factual grounding here is deliberately conservative: the credibility of the product comes from not over-claiming.

## Positioning

CarbonBridge's novelty is its **data-ownership model**, not its feature checklist:

- a **cross-company shared pool** of verified supplier emissions data, plus
- an **independent estimate** that delivers triage value from day one.

Supplier comparison, cost forecasting, and automated supplier reminders are treated as **table-stakes capabilities** — necessary, but not the differentiator.

## What's architecturally distinctive

1. **A cross-company shared pool.** One supplier's verified data is reused across **unaffiliated importers**, rather than being re-collected inside each buyer's private account. (Note for rigor: cross-company data sharing is not wholly unprecedented — CDP / CO2 AI's "Product Ecosystem" is a partial precedent — so the distinctive claim is the pooled model applied to *CBAM-grade verification data* with a triage layer on top.)
2. **The independent estimate as a cold-start / triage layer.** Before the pool has depth, the independent estimate already gives a single importer something useful: where to focus scrutiny.

## The Verification Priority Flag — design rationale (CRITICAL)

The flag is a **private triage signal, visible only in the importer's own view.** It is **not** a public accusation that a named company is greenwashing. That distinction is a deliberate product decision grounded in the limits of the underlying data:

- A peer-reviewed study (**Gurney et al., 2024, *Environmental Research Letters***) found **Climate TRACE power-plant CO₂ estimates averaged ~50% lower** than an established inventory. Facility-level numbers are **not litigation-grade**.
- **Copernicus's own methane explorer** states that satellite resolution *"does not allow the identification of specific facilities as the source of the emissions."*

Because of that uncertainty, the product **never** labels a supplier's figure "false" or "implausible." It states that a figure **"diverges from the independent estimate — recommend verification,"** and routes that as a private signal so the importer can spend a limited verification budget where it matters most.

**Key UI rule:** independent estimates are **always shown as a range + confidence label, never a single hard number.** This is enforced via a shared `RangeBadge` primitive so it can't be bypassed in one view.

## Why suppliers participate (buyer-pull)

The adoption mechanism is **buyer-pull**, and it is evidenced in the public record:

- **CDP's 2024 supply-chain data**: suppliers were **52% more likely to cut emissions when buyers offered incentives.**
- Buyer engagement drove **43 Mt of reductions** — more than Sweden's annual emissions.

Adoption is staged by design: the **independent estimate** makes the product useful to a single importer on day one, while the **shared pool** is the compounding asset that grows with the network.

## Entity resolution — design stance

The hardest real-world problem is matching the importer's **named supplier** (often a **trader or distributor, not the producing mill**) to a **specific facility**. There is **no shared key** between the importer's records and independent facility datasets (e.g. Climate TRACE assets carry no LEI).

The product therefore does **not** claim automatic supplier→facility resolution. It:

- requires **country + CN code + ideally a named installation**,
- presents every match with a **confidence score and a manual-confirm step**, and
- **keeps both the estimate and the self-report** rather than asserting a single truth.

## Regulatory grounding

The mock data and on-screen copy follow the actual CBAM phase-in:

- **First payment is September 2027, not 2026.** 2026 liability *accrues*; the first declaration + certificate surrender is due 30 Sep 2027.
- **2026 applies only a 2.5% CBAM factor** — so the 2026 net cost is small (single-digit €/tonne); the gap widens as free allocation phases out through 2034.
- The **50 t/year exemption** (**Reg. (EU) 2025/2083**) removed the smallest importers, so the target customer is a **mid-market importer above 50 t/year**.
- **Punitive defaults are real.** Country/CN default values were published **December 2025** (**Reg. (EU) 2025/2621**), with **mark-ups of 10% / 20% / 30% (2026 / 2027 / 2028+)**. The **Chinese steel slab default is ~3.167 tCO₂e/t vs. a ~1.37 benchmark** — the engine behind the dashboard's "avoidable overpayment" figure.
