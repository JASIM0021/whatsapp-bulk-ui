---
name: addon-lifecycle
description: >-
  Standard guidelines and runbooks for introducing new workspace services and ensuring
  addons are properly registered in pricing tables, admin panels, and free trial configurations.
---

# Add-on Lifecycle & Integration Guidelines

This workspace customization defines the standards for adding new products, modules, or workspace services to the NexBotix platform. Always conform to this runbook when introducing new features.

---

## 1. Frontend Registration Checklist

Whenever a new workspace service (e.g. `/trading`, `/calendar`, `/seo`) is built:

### A. Pricing & Checkout (`SubscriptionPage.tsx`)
1. **Service Meta**: Add the service's details in `SVC_META` array containing:
   - Unique service ID (`id`)
   - Plan mapping variables (`planMonthly`, `planYearly`)
   - User-facing descriptions and Lucide icon keys.
2. **Combo Bundles**: Include the new service in the `Ultimate` combo plan definition (`COMBO_DEFS`) so it is automatically included in full bundles.
3. **Plan Mappings**: Map the service ID to the database plan name in `SVC_TO_PLAN`.
4. **Icon Lookup**: Ensure the Lucide icon used is imported and mapped inside the local `MAP` lookup function of the `SvcIcon` component.

### B. Admin Control Center (`AdminPanel.tsx`)
1. **Service List**: Add the new service ID to the constant array `ALL_SERVICES`.
2. **Grant Interface**: Add a checkbox control mapping the new service inside the user detail grant editor array.
3. **Description Map**: Add the user-facing label and summary description to the service label metadata lookup dictionary.

---

## 2. Backend & Database Access Control

### A. Route Protection (`cmd/server/main.go`)
1. **Subscription Check Wrapper**: Define a request middleware wrap function gate (e.g. `wrapTrading := func(...)`) using `middleware.RequireService(subscriptionService, "service_name")`.
2. **Security Gates**: Wrap all internal endpoint handlers with this gate to reject un-subscribed API attempts.

### B. Plan Seeding (`cmd/seed_plans/main.go`)
1. **Solo Plan**: Append a single solo plan document using the helper `solo()` representing the new service addon.
2. **Free Trial Inclusions**: Ensure the new service ID is added to the enabled services list of:
   - `trial` (3-day free trial combo plan)
   - `free` (standard trial combo plan)
   - `admin_all` (developer/admin combo plan)
3. Run `go run cmd/seed_plans/main.go` to synchronize pricing values with MongoDB.
