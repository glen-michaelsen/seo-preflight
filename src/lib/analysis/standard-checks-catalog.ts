export interface StandardCheckMeta {
  id: string;
  label: string;
  description: string;
  category: string;
}

/** All built-in checks, in the order they appear in reports. */
export const STANDARD_CHECKS: StandardCheckMeta[] = [
  {
    id: "https",
    label: "HTTPS",
    description: "Verifies the page is served over HTTPS.",
    category: "Security",
  },
  {
    id: "title",
    label: "Title tag",
    description: "Checks that a <title> is present, non-empty, and within 30–60 characters.",
    category: "Content",
  },
  {
    id: "meta-description",
    label: "Meta description",
    description: "Checks that a meta description exists and is within 50–160 characters.",
    category: "Content",
  },
  {
    id: "headings",
    label: "Headings (H1)",
    description: "Checks that exactly one H1 is present.",
    category: "Content",
  },
  {
    id: "images",
    label: "Image alt text",
    description: "Flags images that are missing alt attributes.",
    category: "Content",
  },
  {
    id: "canonical",
    label: "Canonical tag",
    description: "Checks for a canonical link element pointing to a valid absolute URL.",
    category: "Crawlability",
  },
  {
    id: "robots-meta",
    label: "Robots meta",
    description: "Ensures the robots meta tag is not set to noindex or nofollow unintentionally.",
    category: "Crawlability",
  },
  {
    id: "robots-txt",
    label: "Robots.txt",
    description: "Verifies the robots.txt file exists and does not block the page.",
    category: "Crawlability",
  },
  {
    id: "open-graph",
    label: "Open Graph tags",
    description: "Checks for og:title, og:description, and og:image.",
    category: "Social",
  },
  {
    id: "structured-data",
    label: "Structured data",
    description: "Detects JSON-LD or Microdata on the page.",
    category: "Rich Results",
  },
  {
    id: "viewport",
    label: "Viewport meta",
    description: "Checks that the viewport meta tag is present for mobile rendering.",
    category: "Mobile",
  },
  {
    id: "lang",
    label: "HTML lang attribute",
    description: "Verifies the <html> element has a lang attribute set.",
    category: "Accessibility",
  },
  {
    id: "favicon",
    label: "Favicon",
    description: "Checks that a favicon link element is present.",
    category: "UX",
  },
  {
    id: "keywords",
    label: "Keyword checks",
    description: "Runs keyword presence and density checks for each page's target keywords.",
    category: "Keywords",
  },
];

export const STANDARD_CHECK_IDS = STANDARD_CHECKS.map((c) => c.id);
