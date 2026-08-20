# Antigravity Pair Programming Guidelines

## Responsive Web Design Requirement
Always design and develop user interfaces to be fully responsive and optimized for all viewports: mobile devices, tablets, and desktop computers.

### Guidelines
1. **Viewport Breakpoints**: Use mobile-first design patterns utilizing Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`).
2. **Flexible Layouts**: Use flexbox (`flex flex-col sm:flex-row`), grid systems, and relative widths/spacing (`w-full`, `max-w-7xl`, `p-4 sm:p-6`) instead of fixed pixel widths.
3. **Adaptive Components**:
   - Headers, navigation bars, and progress strips must adjust structure (e.g. stack vertically or hide non-critical text elements) on smaller screens.
   - Text sizes should scale down on mobile (e.g. `text-sm sm:text-2xl font-bold`).
   - Profile names and long strings must be truncated or replaced with icons on smaller viewports.
