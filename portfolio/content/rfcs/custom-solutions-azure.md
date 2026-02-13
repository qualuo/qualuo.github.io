Four environment-separated Azure subscriptions under one Management Group, hosted in **Sweden Central**. Aligned with GDPR, eSam, and sector-specific regulations. IaC and managed PaaS from day one.

---

## The Problem

Custom solutions in Swedish public sector are deployed ad-hoc into shared subscriptions. No environment isolation, no consistent naming, no alignment with Well-Architected.

| Issue | Impact |
|-------|--------|
| No environment isolation | Dev and prod share subscriptions — a test misconfiguration affects citizens |
| Unclear compliance | No enforcement that data stays in Sweden Central |
| Cost opacity | Can't report per-system costs to governing bodies |
| Manual provisioning | Disaster recovery means rebuilding from memory |

---

## Proposed Structure

Four subscriptions under `mg-customsolutions`, all in Sweden Central:

- `sub-customsolutions-sandbox`: Sandbox / Experimentation
- `sub-customsolutions-dev`: Development
- `sub-customsolutions-test`: Test / Staging
- `sub-customsolutions-prod`: Production

Each solution gets one resource group per subscription: `rg-{solutionname}`

### Well-Architected Alignment

| Pillar | Implementation |
|--------|---------------|
| Reliability | Zone-redundant PaaS, automated failover, Bicep-defined infrastructure |
| Security | Managed identities, Key Vault, Private Endpoints, Azure Policy region-lock |
| Cost | Per-subscription reporting, Dev/Test pricing, auto-scaling with spend alerts |
| Operations | Bicep IaC, CI/CD via Azure DevOps, Application Insights from day one |
| Performance | Container Apps with auto-scaling, right-sized SKUs |

### Recommended Services

- **Container Apps**: hosting with auto-scaling and Dapr
- **Azure SQL**: geo-redundant backup within Sweden
- **API Management**: gateway with auth and rate limiting
- **Key Vault**: secrets and certificates, never in app config
- **Application Insights**: distributed tracing and alerts
- **Azure Policy**: enforce Sweden Central, deny non-compliant SKUs
- **Bicep**: every resource defined in code

> Start with managed PaaS exclusively. Container Apps + Azure SQL covers the vast majority of public sector e-services.

---

## Compliance

| Regulation | Enforcement |
|-----------|------------|
| GDPR | Azure Policy enforces `allowedLocations = swedencentral` |
| eSam (gov cloud guidelines) | Risk classification per system, Private Endpoints for high-sensitivity |
| OSL (Public Access and Secrecy Act) | Access logging on all data stores, Customer Lockbox for Microsoft support |
| LOU (Public Procurement Act) | Procured via Kammarkollegiet or SKL Kommentus framework agreement |

> Azure Policy **denies resource creation outside Sweden Central** at the Management Group level. Compliance is automatic, not aspirational.

---

## Sector Differences

The Azure structure is identical across all three levels of government. What changes is the regulatory overlay.

|  | Municipality | Region | State Agency |
|--|-------------|--------|-------------|
| Health data (PDL: Patient Data Act) | N/A | Required | Rare |
| Security classification | Rare | Rare | May apply |
| Classification model | SKR (municipalities & regions) | SKR + PDL | DIGG (gov digitalization agency) |
| Procurement | SKL Kommentus | SKL Kommentus | Kammarkollegiet |

Key differences:
- **Regions** handle patient data under PDL (Patientdatalagen) — stricter logging, data must not leave Sweden
- **State agencies** may trigger security classification laws — security-classified data stays off public cloud entirely

---

## Next Steps

1. Create `mg-customsolutions` and four subscriptions with Azure Policy
2. Define Bicep modules for the base resource set
3. Migrate the first e-service as a pilot
4. Conduct information classification per applicable framework
5. Document onboarding process for future systems

> This is a reversible decision. The subscription model can be adjusted after the pilot. The Azure Policy guardrails should be treated as permanent.

---

## International Context

The topology transfers directly to other jurisdictions — only the compliance overlay changes.

| Country | Region | Data Protection | Cloud Cert | Healthcare |
|---------|--------|----------------|-----------|-----------|
| Germany | Germany West Central | GDPR + BDSG | BSI C5 | Patientendaten-Schutzgesetz |
| Norway | Norway East | GDPR + Personopplysningsloven | Digdir | Pasientjournalloven |
| UK | UK South | UK GDPR + DPA 2018 | NCSC | NHS DSPT |
| USA | Azure Government | FISMA | FedRAMP | HIPAA |
| EU | Varies | EU DPR | EUCS (ENISA) | N/A |
