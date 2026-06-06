# Wedding Steward: SEO Optimization Plan

This document outlines the strategy for optimizing the search engine visibility and performance of Wedding Steward, focusing on public wedding website pages while keeping private dashboard pages secure and non-indexable.

---

## 1. Meta Tags & Social Sharing (Open Graph / Twitter Cards)

Public wedding websites (`/w/[slug]`) must present dynamic, customizable, and high-quality meta tags for search engines and social platforms.

### Technical Recommendations
* **Dynamic Titles**: Set title tags dynamically using the couple's names:
  ```html
  <title>Sarah & Michael's Wedding - September 18, 2026</title>
  ```
* **Dynamic Meta Descriptions**: Autofill based on wedding details or allow custom couple inputs:
  ```html
  <meta name="description" content="Welcome to Sarah and Michael's wedding website. Find event details, RSVP online, view the registry, and share in our story." />
  ```
* **Open Graph (OG) Tags**: Optimize for Facebook, iMessage, and WhatsApp previews:
  * `og:title`: Same as the page title.
  * `og:description`: Brief wedding intro.
  * `og:image`: Dynamically resolve to the couple's uploaded S3 hero image.
  * `og:type`: `website`
* **Twitter Cards**: Define `twitter:card` (typically `summary_large_image`) and `twitter:image`.
* **Canonical URL**: Ensure a canonical tag is pointing to the correct subdomain or custom domain (e.g. `https://[slug].weddingsteward.com`) to prevent duplicate content flags:
  ```html
  <link rel="canonical" href="https://sarah-and-michael.weddingsteward.com" />
  ```

---

## 2. Structured Data (JSON-LD Schema Markup)

Adding structured data helps search engines understand that the page is a wedding event, enabling rich search snippet enhancements (like event date, location, and time showing directly in search results).

### Technical Recommendations
* Add a `JSON-LD` script block to public wedding homepages:
```json
{
  "@context": "https://schema.org",
  "@type": "Event",
  "name": "Sarah & Michael's Wedding",
  "startDate": "2026-09-18T16:30:00-05:00",
  "endDate": "2026-09-18T23:00:00-05:00",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": {
    "@type": "Place",
    "name": "The Grand Pavilion",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "190 County Road 490",
      "addressLocality": "Princeton",
      "addressRegion": "TX",
      "postalCode": "75407",
      "addressCountry": "US"
    }
  },
  "description": "Join us in celebrating the marriage of Sarah and Michael."
}
```

---

## 3. Sitemap & Indexing Control (`robots.txt` & `sitemap.xml`)

We must allow indexing of public wedding pages while strictly blocking search crawlers from indexable private dashboard routes.

### Robots.txt Strategy
* **Allow**: Public wedding homepages (`/w/*`).
* **Disallow**: Private dashboard interfaces, onboarding paths, admin API routes, and settings panels.
* **Location**: `public/robots.txt`
```text
User-agent: *
Allow: /w/
Allow: /api/email-image
Disallow: /dashboard
Disallow: /guests
Disallow: /budget
Disallow: /checklist
Disallow: /email-studio
Disallow: /gallery
Disallow: /guestbook
Disallow: /settings
Disallow: /vendors
Disallow: /portal
Disallow: /onboarding
Disallow: /signup
Disallow: /login
Disallow: /api/

Sitemap: https://weddingsteward.com/sitemap.xml
```

### Sitemap.xml Strategy
* Implement a Next.js dynamic sitemap (`app/sitemap.ts`) that:
  1. Queries all active, published weddings.
  2. Generates sitemap entries for public routes: `https://weddingsteward.com/w/[slug]`.
  3. Excludes draft weddings (`publishStatus === 'DRAFT'`) or password-protected pages.

---

## 4. Performance & Core Web Vitals

Google prioritizes pages that load quickly and remain visually stable.

### Image Optimization
* **Next.js `<Image>` Component**: Replace standard `<img>` tags on public pages with Next.js's optimized image component.
* **S3 Loader**: Set up a custom image loader (using NextJS or CloudFront resizing) for user-uploaded photos to automatically serve webp format, compressed sizes, and responsive srcsets.

### Semantic HTML
* Ensure public pages maintain a strict Heading Hierarchy (one `<h1>` per page, following with sequential `<h2>`, `<h3>` tags).
* Use semantic containers like `<main>`, `<section>`, `<header>`, and `<footer>`.

### Script Loading
* Minimize bundle size on public-facing routes.
* Set third-party widgets (e.g. Spotify player) to lazy load after the initial paint.

---

## 5. Security & Privacy Controls

* **Password Protection**: Keep pages entirely non-indexable when a couple enables password protection. Send `noindex, nofollow` headers/meta tags to search engines on the password wall:
  ```html
  <meta name="robots" content="noindex, nofollow" />
  ```
