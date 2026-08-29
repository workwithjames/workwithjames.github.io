// Conversion guard: .github/workflows/apply-digital-conversion-rebuild.yml reapplies buyer-flow enhancements after digital changes.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const base = "https://digital.jamesrealty.uk";
const whatsapp = "971528420933";
const email = "james@jamesrealty.uk";
const emailHref = "mailto:" + email + "?subject=Digital%20project%20enquiry";

const projects = [
  {
    slug: "nationwide-middle-east-properties",
    name: "Nationwide Middle East Properties",
    short: "Nationwide",
    classification: "Client Work",
    industry: "Real Estate",
    services: ["Strategy", "Paid Acquisition", "SEO", "CRM", "Creative"],
    location: "Dubai, UAE",
    url: "https://www.nwmea.com/",
    displayUrl: "nwmea.com",
    social: "https://www.instagram.com/nwmea/",
    socialLabel: "@nwmea",
    image: "/assets/work/nationwide-middle-east-properties.jpg",
    context: "A UAE brokerage operating in a crowded, high-consideration property market where brand visibility, qualified demand and sales follow-up need to work as one system.",
    challenge: "Connect property marketing, performance acquisition, search visibility and CRM follow-up without treating each channel as a separate activity.",
    strategy: "Build an acquisition-to-conversion approach around clear property narratives, high-intent audiences, measurable landing journeys and downstream sales feedback.",
    execution: "Integrated campaign planning, paid search and paid social, property-launch creative, SEO, investor communication and CRM workflow improvement.",
    deliverables: ["Digital and campaign strategy", "Paid acquisition structure", "Property launch creative", "SEO and content direction", "CRM and lead-nurture improvements"],
    tools: ["Meta Ads", "Google Ads", "SEO", "GA4 / tracking", "CRM workflows"],
    result: "Verified career scope includes performance marketing across Nationwide and a connected paid-acquisition, landing-page, CRM hand-off and sales-feedback workflow. Commercial figures are not attributed to this project alone.",
    beforeAfter: "A verified visual baseline was not supplied, so no before-and-after claim is published."
  },
  {
    slug: "the-heart-of-europe",
    name: "The Heart of Europe",
    short: "The Heart of Europe",
    classification: "Client Work",
    industry: "Real Estate",
    services: ["Creative", "Social Media", "Web"],
    location: "Dubai, UAE",
    url: "https://thoe.com/",
    displayUrl: "thoe.com",
    social: "https://www.instagram.com/theheartofeurope_official/",
    socialLabel: "@theheartofeurope_official",
    image: "/assets/work/the-heart-of-europe.jpg",
    context: "A luxury destination and property proposition requiring a consistent digital expression across web, campaign and social touchpoints.",
    challenge: "Present a complex destination story with enough clarity and visual authority to support international discovery.",
    strategy: "Use a premium, destination-led narrative with disciplined content hierarchy and visual consistency across public-facing channels.",
    execution: "Creative and digital work supporting the public website and social presence.",
    deliverables: ["Digital creative direction", "Social content support", "Web-facing brand expression", "Campaign-ready visual assets"],
    tools: ["Web production", "Creative systems", "Social media"],
    result: "Verified public outcome: a live website and active public social presence. Private commercial performance data is not published.",
    beforeAfter: "No verified before-and-after material is available for publication."
  },
  {
    slug: "bnw-developments",
    name: "BNW Developments",
    short: "BNW Developments",
    classification: "Client Work",
    industry: "Real Estate",
    services: ["Creative", "Social Media", "Web"],
    location: "UAE",
    url: "https://bnw.ae/en",
    displayUrl: "bnw.ae",
    social: "https://www.instagram.com/bnw.developments/",
    socialLabel: "@bnw.developments",
    image: "/assets/work/bnw-developments.jpg",
    context: "A developer brand communicating premium residential projects to investor and end-user audiences.",
    challenge: "Create a coherent public-facing presence across project, campaign and social communication.",
    strategy: "Prioritise luxury positioning, project clarity and repeatable visual structure for digital use.",
    execution: "Creative, campaign and social work aligned with the developer's public digital presence.",
    deliverables: ["Campaign creative", "Social content", "Project communication assets", "Web-facing creative support"],
    tools: ["Creative production", "Social media", "Web"],
    result: "Verified public outcome: a live developer website and active public social presence. Private campaign metrics are not published.",
    beforeAfter: "No verified before-and-after material is available for publication."
  },
  {
    slug: "reef-and-beef-dubai",
    name: "Reef & Beef Steakhouse & Seafood",
    short: "Reef & Beef",
    classification: "Client Work",
    industry: "Hospitality",
    services: ["Creative", "Social Media", "Web"],
    location: "Downtown Dubai",
    url: "https://reefandbeef.ae/",
    displayUrl: "reefandbeef.ae",
    social: "https://www.instagram.com/reefandbeef_dubai/",
    socialLabel: "@reefandbeef_dubai",
    image: "/assets/work/reef-and-beef-dubai.jpg",
    context: "A Dubai restaurant brand competing for attention in a visually demanding dining and lifestyle market.",
    challenge: "Translate the in-venue experience into a digital presence that makes the concept easy to understand and desirable to visit.",
    strategy: "Lead with the food, atmosphere and occasion while keeping the path to discovery and action direct.",
    execution: "Restaurant creative, social content and web-facing brand work.",
    deliverables: ["Restaurant creative", "Social content", "Digital brand assets", "Web-facing visual support"],
    tools: ["Creative production", "Social media", "Web"],
    result: "Verified public outcome: a live website and active public social channel. Booking and revenue figures are not published.",
    beforeAfter: "No verified before-and-after material is available for publication."
  },
  {
    slug: "fomo-cousina-lounge",
    name: "FOMO Cousina & Lounge",
    short: "FOMO",
    classification: "Client Work",
    industry: "Hospitality",
    services: ["Creative", "Social Media", "Web"],
    location: "Business Bay, Dubai",
    url: "https://fomocousina.com/",
    displayUrl: "fomocousina.com",
    social: "https://www.instagram.com/fomocousina.ae/",
    socialLabel: "@fomocousina.ae",
    image: "https://image.thum.io/get/width/1200/crop/760/noanimate/https://fomocousina.com/",
    context: "An urban restaurant and lounge concept requiring a recognisable digital personality across discovery channels.",
    challenge: "Create enough distinction and consistency for a hospitality brand competing in a busy Dubai market.",
    strategy: "Build the digital expression around atmosphere, occasion and a repeatable visual language.",
    execution: "Hospitality creative, social work and web-facing brand support.",
    deliverables: ["Lifestyle creative", "Social content", "Digital brand assets", "Web-facing visual support"],
    tools: ["Creative production", "Social media", "Web"],
    result: "Verified public outcome: a live website and active public social presence. Private performance metrics are not published.",
    beforeAfter: "No verified before-and-after material is available for publication."
  },
  {
    slug: "glam-girlz",
    name: "Glam Girlz Mena Salon LLC",
    short: "Glam Girlz",
    classification: "Client Work",
    industry: "Beauty & Retail",
    services: ["Creative", "Social Media", "Web"],
    location: "Dubai, UAE",
    url: "https://glamgirlz.store/",
    displayUrl: "glamgirlz.store",
    social: "https://www.instagram.com/glam_girlz_dubai/",
    socialLabel: "@glam_girlz_dubai",
    image: "/assets/work/glam-girlz.jpg",
    context: "A colourful beauty and retail concept requiring a clear, accessible expression for customers and families.",
    challenge: "Balance personality, service clarity and retail discovery across digital touchpoints.",
    strategy: "Use a recognisable colour-led system with concise service and product communication.",
    execution: "Beauty and retail creative, social content and web-facing digital work.",
    deliverables: ["Beauty creative", "Social content", "Retail assets", "Web-facing visual support"],
    tools: ["Creative production", "Social media", "Web"],
    result: "Verified public outcome: a live commerce website and active public social presence. Private sales figures are not published.",
    beforeAfter: "No verified before-and-after material is available for publication."
  },
  {
    slug: "ivy-beauty-bubbles",
    name: "IVY Beauty & Bubbles Hub, Marquise Square",
    short: "IVY Beauty & Bubbles",
    classification: "Client Work",
    industry: "Beauty & Lifestyle",
    services: ["Creative", "Social Media", "Web"],
    location: "Business Bay, Dubai",
    url: "https://ivydubai.ae/locations/marquise-square-business-bay/",
    displayUrl: "ivydubai.ae",
    social: "https://www.instagram.com/ivybeautyandbubbles_dubai/",
    socialLabel: "@ivybeautyandbubbles_dubai",
    image: "/assets/work/ivy-beauty-bubbles.jpg",
    context: "A premium salon and lifestyle location requiring a polished local digital presence.",
    challenge: "Make the location, experience and visual character clear across website and social discovery.",
    strategy: "Use a refined beauty-led content system focused on transformations, experience and place.",
    execution: "Salon and lifestyle creative, social work and web-facing support for the Marquise Square location.",
    deliverables: ["Salon creative", "Social content", "Location communication", "Web-facing visual support"],
    tools: ["Creative production", "Social media", "Web"],
    result: "Verified public outcome: a live location page and active public social presence. Appointment and revenue data is not published.",
    beforeAfter: "No verified before-and-after material is available for publication."
  }
];

const services = [
  {
    slug: "web-development",
    title: "Web Development",
    eyebrow: "Websites",
    description: "Conversion-focused websites and landing systems that make the offer clear, credible and easy to act on.",
    problem: "The website looks acceptable but does not explain the value, build enough trust or turn visits into useful enquiries.",
    deliverables: ["Conversion architecture", "Responsive interface design", "Front-end development", "Forms and CTA journeys", "Technical SEO foundations", "Analytics and event tracking"],
    fit: ["Business websites", "Campaign landing pages", "Multi-route commercial sites", "Portfolio and case-study systems"],
    outcome: "A faster, clearer commercial website with measurable conversion routes and a structure that can grow."
  },
  {
    slug: "performance-marketing",
    title: "Performance Marketing",
    eyebrow: "Paid acquisition",
    description: "Paid media structured around qualified demand, landing journeys and the outcomes that happen after a form is submitted.",
    problem: "Campaigns are generating traffic or low-quality leads without a reliable link to sales follow-up and business outcomes.",
    deliverables: ["Channel and audience strategy", "Meta and Google campaign structure", "Creative testing plan", "Landing-page alignment", "Conversion tracking", "Lead-quality reporting"],
    fit: ["Lead generation", "Product or service launches", "International acquisition", "Retargeting and nurture"],
    outcome: "A paid-acquisition system that can be judged by lead quality, contactability and commercial movement, not clicks alone."
  },
  {
    slug: "seo",
    title: "SEO",
    eyebrow: "Organic discovery",
    description: "Technical, on-page and content architecture designed to make commercial pages easier to find and more useful when they rank.",
    problem: "The business is publishing or maintaining a site, but high-intent customers cannot reliably discover the right commercial pages.",
    deliverables: ["Technical audit", "Commercial keyword architecture", "On-page optimisation", "Internal-link system", "Content briefs", "Measurement and search reporting"],
    fit: ["Service businesses", "Multi-location brands", "Market and industry pages", "Content-heavy websites"],
    outcome: "A search structure that supports commercial discovery without filling the site with generic or repetitive content."
  },
  {
    slug: "crm-automation",
    title: "CRM & Automation",
    eyebrow: "After the lead",
    description: "Lead routing, follow-up workflows and reporting designed to reduce leakage between enquiry and sales action.",
    problem: "Leads arrive, but ownership is unclear, response is slow and the marketing team cannot see which campaigns create workable opportunities.",
    deliverables: ["Lead-source mapping", "CRM stage design", "Assignment and notification rules", "Follow-up workflow", "Sales-feedback loop", "Conversion reporting"],
    fit: ["Sales teams", "Brokerages", "Service businesses", "Multi-channel lead generation"],
    outcome: "A clearer operating system for who follows up, when they act and what marketing learns from the result."
  },
  {
    slug: "digital-strategy",
    title: "Digital Strategy",
    eyebrow: "Commercial direction",
    description: "A practical plan connecting positioning, channels, website, measurement, CRM and delivery priorities.",
    problem: "The business has tools, channels and suppliers but no shared commercial system or clear order of execution.",
    deliverables: ["Current-state audit", "Opportunity and audience definition", "Journey and channel plan", "Measurement framework", "90-day priorities", "Delivery roadmap"],
    fit: ["New business launches", "Growth-stage companies", "Digital rebuilds", "International expansion"],
    outcome: "A sequenced digital roadmap that aligns decisions, owners, milestones and measurable next steps."
  }
];

const industries = [
  {
    slug: "real-estate",
    title: "Real Estate",
    description: "Digital strategy, launches, paid acquisition, international investor journeys and CRM follow-up for developers, brokerages and property businesses.",
    problems: ["Complex project stories", "High media costs", "Lead-quality variation", "Slow sales follow-up", "International buyer journeys"],
    system: ["Position the project and audience", "Build campaign and landing journeys", "Qualify and route demand", "Return CRM outcomes to media decisions"]
  },
  {
    slug: "hospitality",
    title: "Hospitality & F&B",
    description: "Web, creative, social and performance systems for restaurants, lounges, hotels and experience-led businesses.",
    problems: ["Crowded local discovery", "Inconsistent visual presence", "Weak booking paths", "Campaigns disconnected from offers"],
    system: ["Clarify the occasion and offer", "Create a recognisable visual system", "Improve search and social discovery", "Measure bookings and enquiries"]
  },
  {
    slug: "beauty-lifestyle",
    title: "Beauty & Lifestyle",
    description: "Premium digital presentation, local discovery, creative systems and conversion journeys for salons, retail and lifestyle brands.",
    problems: ["Visual inconsistency", "Location discovery", "Unclear services", "Weak appointment journeys"],
    system: ["Define the brand expression", "Structure services and locations", "Connect creative to action", "Track enquiries and appointments"]
  },
  {
    slug: "professional-services",
    title: "Professional Services",
    description: "Authority-led websites, commercial content, lead generation and follow-up systems for experts and service businesses.",
    problems: ["Generic positioning", "Low trust", "Long decision cycles", "Unstructured enquiries"],
    system: ["Clarify the commercial promise", "Build proof and case studies", "Capture qualified briefs", "Create consistent follow-up"]
  }
];

function ensureDir(file) {
  fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
}

function write(file, content) {
  ensureDir(file);
  const lineBreak = String.fromCharCode(10);
  const cleaned = content.trimStart().split(lineBreak).map(line => line.trimEnd()).join(lineBreak);
  fs.writeFileSync(path.join(root, file), cleaned + lineBreak);
}

function icon(name) {
  const icons = {
    arrow: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11M11 5l5 5-5 5"/></svg>',
    globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9z"/></svg>',
    check: '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m4 10 4 4 8-8"/></svg>'
  };
  return icons[name] || icons.arrow;
}

function header() {
  return `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header" id="top">
    <div class="nav-shell">
      <a class="brand" href="/" aria-label="James Digital home"><span class="brand-mark">JD</span><span>James Digital</span></a>
      <nav class="nav-links" aria-label="Primary navigation">
        <a href="/portfolio.html">Work</a>
        <a href="/#capabilities">Capabilities</a>
        <a href="/about.html">About</a>
        <a href="/pricing.html">Pricing</a>
      </nav>
      <div class="nav-actions">
        <a class="text-link nav-call" href="/start-project.html?route=call" data-event="book_call_click">Book a Call</a>
        <a class="button button-small button-primary" href="/start-project.html" data-event="start_project_click">Start a Project</a>
      </div>
      <button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-nav"><span>Menu</span></button>
    </div>
    <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile navigation" hidden>
      <a href="/portfolio.html">Work</a><a href="/#capabilities">Capabilities</a><a href="/about.html">About</a><a href="/pricing.html">Pricing</a>
      <a href="/start-project.html?route=call" data-event="book_call_click">Book a Call</a>
      <a class="button button-primary" href="/start-project.html" data-event="start_project_click">Start a Project</a>
    </nav>
  </header>`;
}

function footer() {
  return `
  <section class="contact-dock" aria-label="Contact options">
    <div><span>Have a project in mind?</span><strong>Start with the outcome you need.</strong></div>
    <div class="contact-dock-actions">
      <a href="/start-project.html" data-event="start_project_click">Start a Project</a>
      <a href="/start-project.html?route=call" data-event="book_call_click">Book a Call</a>
      <a href="https://wa.me/${whatsapp}?text=Hi%20James%2C%20I%20would%20like%20to%20discuss%20a%20digital%20project." target="_blank" rel="noopener noreferrer" data-event="whatsapp_click">WhatsApp</a>
      <a href="${emailHref}" data-event="email_click">Email James</a>
    </div>
  </section>
  <footer class="site-footer">
    <div class="section-shell footer-grid">
      <div><a class="brand footer-brand" href="/"><span class="brand-mark">JD</span><span>James Digital</span></a><p>Dubai-based digital strategy, web, acquisition and automation partner. Working globally.</p></div>
      <nav aria-label="Services">
        <strong>Capabilities</strong>
        <a href="/services/digital-strategy.html">Digital Strategy</a>
        <a href="/services/web-development.html">Web Development</a>
        <a href="/services/performance-marketing.html">Performance Marketing</a>
        <a href="/services/seo.html">SEO</a>
        <a href="/services/crm-automation.html">CRM & Automation</a>
      </nav>
      <nav aria-label="Company">
        <strong>Explore</strong>
        <a href="/portfolio.html">Work</a>
        <a href="/about.html">Meet James</a>
        <a href="/pricing.html">Pricing</a>
        <a href="/custom-engagements.html">Custom Engagements</a>
        <a href="/start-project.html">Start a Project</a>
      </nav>
      <div class="footer-meta"><span>Dubai, United Arab Emirates</span><a href="${emailHref}" data-event="email_click">${email}</a><a href="https://jamesrealty.uk/" target="_blank" rel="noopener noreferrer">James Realty</a><span>© <span data-year></span> James Digital</span></div>
    </div>
  </footer>`;
}

function page({ title, description, canonical, bodyClass = "", pageType = "", content, schema = null, robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" }) {
  const schemaTag = schema ? '<script type="application/ld+json">' + JSON.stringify(schema) + '</script>' : "";
  return `<!doctype html>
<html lang="en">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-M74SL57L');</script>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="James Digital">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <meta name="theme-color" content="#0b0906">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css?v=20260830-gold-final-1">
  ${schemaTag}
</head>
<body class="${bodyClass}" data-page-type="${pageType}">
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M74SL57L" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>
  ${header()}
  <main id="main">${content}</main>
  ${footer()}
  <script src="/script.js?v=20260829-global-redesign-2" defer></script>
</body>
</html>`;
}

function browserPreview(project, eager = false) {
  return `
  <div class="device-stage" aria-label="${project.name} desktop and mobile website preview">
    <div class="desktop-device">
      <div class="device-bar"><i></i><i></i><i></i><span>${project.displayUrl}</span></div>
      <img src="${project.image}" alt="${project.name} website preview" width="1200" height="760" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.desktop-device').classList.add('image-failed')">
      <span class="image-fallback">${project.name}</span>
    </div>
    <div class="mobile-device" aria-hidden="true">
      <span class="mobile-notch"></span>
      <img src="${project.image}" alt="" width="1200" height="760" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.closest('.mobile-device').classList.add('image-failed')">
      <span class="image-fallback">${project.short}</span>
    </div>
  </div>`;
}

function projectCard(project, index, featured = false) {
  return `<article class="work-card ${featured ? "featured-work" : ""}" data-project-card data-service="${project.services.join("|")}" data-industry="${project.industry}" data-classification="${project.classification}">
    <a class="work-visual" href="/case-studies/${project.slug}.html" aria-label="Read the ${project.name} case study" data-event="case_study_click" data-case-study="${project.slug}">
      ${browserPreview(project)}
    </a>
    <div class="work-card-body">
      <div class="work-meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${project.classification}</span><span>${project.industry}</span></div>
      <h3><a href="/case-studies/${project.slug}.html" data-event="case_study_click" data-case-study="${project.slug}">${project.name}</a></h3>
      <p>${project.context}</p>
      <div class="tag-row">${project.services.slice(0, 4).map(s => '<span>' + s + '</span>').join("")}</div>
      <div class="card-actions"><a href="/case-studies/${project.slug}.html" class="arrow-link" data-event="case_study_click" data-case-study="${project.slug}">View case study ${icon("arrow")}</a><a href="${project.url}" target="_blank" rel="noopener noreferrer" class="muted-link" data-event="live_project_click">Live project ↗</a></div>
    </div>
  </article>`;
}

const homeSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "James Digital",
  url: base + "/",
  description: "Dubai-based digital strategy, web development, performance marketing, SEO, CRM, automation and creative partner working globally.",
  areaServed: "Worldwide",
  founder: {
    "@type": "Person",
    name: "James Ravi",
    url: "https://jamesrealty.uk/about-me/"
  },
  sameAs: ["https://jamesrealty.uk/", "https://ae.linkedin.com/in/james-ravi-dubai"]
};

const capabilityItems = [
  ["01", "Strategy", "Positioning, audience, journey, priorities and measurement."],
  ["02", "Websites", "Commercial sites and landing systems designed to convert."],
  ["03", "Paid acquisition", "Meta, Google and campaign optimisation around qualified demand."],
  ["04", "SEO", "Technical, on-page and content architecture for commercial discovery."],
  ["05", "Analytics & tracking", "GA4, GTM and event measurement across the buying journey."],
  ["06", "CRM", "Lead stages, ownership, routing and sales-feedback structure."],
  ["07", "Automation", "Notifications, follow-up and operational workflows."],
  ["08", "Creative", "Campaign, social and digital assets built around the business message."]
];

const problemItems = [
  ["I need more leads", "Build a connected acquisition system, not another isolated campaign."],
  ["My website is not converting", "Fix clarity, trust, proof, friction and conversion measurement."],
  ["I am launching a business", "Connect positioning, website, channels and the first measurable growth plan."],
  ["Leads are not being followed up", "Define ownership, routing, response expectations and automation."],
  ["People cannot find us online", "Improve technical SEO, commercial pages and search-led content structure."],
  ["I need a complete digital system", "Join strategy, web, acquisition, tracking and CRM into one operating model."]
];

const home = `
<section class="hero section-shell">
  <div class="hero-copy">
    <p class="eyebrow"><span></span> Dubai-based. Working globally.</p>
    <h1>Digital systems built to turn attention into <em>business.</em></h1>
    <p class="hero-lead">Strategy, websites, performance marketing, SEO, CRM and automation connected around one commercial outcome: helping the right customer choose you.</p>
    <div class="hero-actions">
      <a class="button button-primary" href="/portfolio.html" data-event="portfolio_click">View Work ${icon("arrow")}</a>
      <a class="button button-ghost" href="/start-project.html" data-event="start_project_click">Start a Project</a>
    </div>
    <div class="hero-signals" aria-label="Positioning highlights">
      <span><strong>Dubai</strong> direct base</span>
      <span><strong>Worldwide</strong> availability</span>
      <span><strong>Direct</strong> communication</span>
      <span><strong>End-to-end</strong> ownership</span>
    </div>
  </div>
  <div class="system-map" aria-label="Connected digital growth system">
    <div class="system-map-top"><span>Global delivery system</span><span class="live-dot">Active</span></div>
    <div class="system-orbit">
      <span class="orbit-label orbit-dubai">Dubai<br><small>Strategy</small></span>
      <span class="orbit-label orbit-europe">Europe<br><small>Remote</small></span>
      <span class="orbit-label orbit-asia">Asia<br><small>Remote</small></span>
      <span class="orbit-label orbit-americas">Americas<br><small>Remote</small></span>
      <div class="orbit-core"><strong>Business<br>outcome</strong><span>One connected system</span></div>
    </div>
    <div class="system-flow"><span>Attract</span><i></i><span>Convert</span><i></i><span>Follow up</span><i></i><span>Improve</span></div>
  </div>
</section>

<section class="proof-rail">
  <div class="section-shell proof-rail-inner">
    <p>Career and delivery experience across</p>
    <div><span>Real Estate</span><span>Hospitality</span><span>Beauty</span><span>Retail</span><span>Professional Services</span><span>International Markets</span></div>
  </div>
</section>

<section class="section section-shell" id="work" data-view-event="portfolio_view">
  <div class="section-heading">
    <div><p class="kicker">Featured work</p><h2>Public work you can inspect, not generic promises.</h2></div>
    <div><p>Selected client work across property, hospitality, beauty and lifestyle, with live project links and transparent evidence notes.</p><a class="arrow-link" href="/portfolio.html" data-event="portfolio_click">View all projects ${icon("arrow")}</a></div>
  </div>
  <div class="featured-work-grid">${projects.slice(0, 3).map((p, i) => projectCard(p, i, i === 0)).join("")}</div>
</section>

<section class="section problems-section" id="problems">
  <div class="section-shell split-heading">
    <div><p class="kicker">Problems I solve</p><h2>Start with what is not working.</h2></div>
    <p>The right scope may be one focused fix or a complete digital system. The diagnosis comes before the channel list.</p>
  </div>
  <div class="section-shell problem-grid">${problemItems.map((p, i) => '<article><span>0' + (i + 1) + '</span><h3>' + p[0] + '</h3><p>' + p[1] + '</p><a href="/start-project.html?objective=' + encodeURIComponent(p[0]) + '" aria-label="Discuss: ' + p[0] + '" data-event="start_project_click">' + icon("arrow") + '</a></article>').join("")}</div>
</section>

<section class="section section-shell" id="capabilities">
  <div class="section-heading">
    <div><p class="kicker">Capabilities</p><h2>One partner across the full digital journey.</h2></div>
    <p>Use one capability or connect several into a coordinated system with shared priorities, tracking and accountability.</p>
  </div>
  <div class="capability-grid">${capabilityItems.map((c, i) => '<article><span>' + c[0] + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p>' + (i < 4 ? '<a href="/services/' + services[i === 0 ? 4 : i === 1 ? 0 : i === 2 ? 1 : 2].slug + '.html" aria-label="Explore ' + c[1] + '">' + icon("arrow") + '</a>' : '') + '</article>').join("")}</div>
</section>

<section class="section about-panel-section">
  <div class="section-shell about-panel">
    <div class="about-monogram" aria-hidden="true"><span>J</span><small>DXB</small></div>
    <div class="about-copy">
      <p class="kicker">Meet James</p>
      <h2>Senior digital thinking with direct communication.</h2>
      <p>I am based in Dubai and work with businesses worldwide across digital strategy, websites, performance marketing, SEO, analytics, CRM, automation and creative. You work directly with me from the first brief through delivery and post-launch priorities.</p>
      <p>My wider career covers more than ten years in marketing, major UAE real-estate launches and international acquisition across 50+ markets. Those claims are documented in the verified career portfolio.</p>
      <div class="inline-actions"><a class="button button-light" href="/about.html">Meet James</a><a class="arrow-link" href="https://jamesrealty.uk/about-me/" target="_blank" rel="noopener noreferrer">View verified career scope ${icon("arrow")}</a></div>
    </div>
    <div class="about-facts">
      <div><strong>Dubai-based</strong><span>Available worldwide</span></div>
      <div><strong>Direct access</strong><span>No account-manager layer</span></div>
      <div><strong>10+ years</strong><span>Verified marketing career</span></div>
      <div><strong>50+ markets</strong><span>Career acquisition scope</span></div>
    </div>
  </div>
</section>

<section class="section section-shell" id="delivery">
  <div class="section-heading">
    <div><p class="kicker">Working globally</p><h2>Clear milestones, visible ownership and no location friction.</h2></div>
    <p>Projects are structured for remote delivery with agreed decision points, practical communication and a defined handover.</p>
  </div>
  <div class="trust-grid">
    <article><span>01</span><h3>Direct communication</h3><p>One decision-maker and one point of contact from discovery through delivery.</p></article>
    <article><span>02</span><h3>Defined milestones</h3><p>Scope, review points, timing and responsibilities are written before production begins.</p></article>
    <article><span>03</span><h3>Project ownership</h3><p>Dependencies, feedback and next actions stay visible throughout the engagement.</p></article>
    <article><span>04</span><h3>Post-launch support</h3><p>Handover, measurement review and the next optimisation priorities are planned into delivery.</p></article>
  </div>
  <ol class="process-rail" aria-label="Delivery process">
    <li><span>01</span><div><strong>Diagnose</strong><small>Goal, audience, current system and constraints</small></div></li>
    <li><span>02</span><div><strong>Scope</strong><small>Deliverables, milestones, owners and measurement</small></div></li>
    <li><span>03</span><div><strong>Build</strong><small>Focused production with scheduled reviews</small></div></li>
    <li><span>04</span><div><strong>Launch</strong><small>QA, tracking, handover and go-live support</small></div></li>
    <li><span>05</span><div><strong>Improve</strong><small>Use evidence to prioritise the next move</small></div></li>
  </ol>
</section>

<section class="section pricing-architecture" id="pricing" data-view-event="pricing_view">
  <div class="section-shell">
    <div class="section-heading">
      <div><p class="kicker">Two ways to work together</p><h2>Start focused or build a larger growth system.</h2></div>
      <p>Clear fixed scopes remain available. Established businesses and complex projects have a separate custom-engagement route.</p>
    </div>
    <div class="engagement-grid">
      <article class="engagement-primary"><span>For established companies</span><h3>Custom Engagements</h3><p>Multi-route websites, international acquisition, digital transformation, CRM automation and ongoing optimisation shaped around the actual business.</p><ul><li>Discovery and commercial roadmap</li><li>Custom scope and milestones</li><li>Cross-channel delivery</li><li>Leadership-level communication</li></ul><a class="button button-light" href="/custom-engagements.html" data-event="custom_engagement_click">Explore Custom Engagements</a></article>
      <article><span>For defined needs</span><h3>Fixed-scope packages</h3><p>Focused websites, landing pages, SEO, paid media and automation packages with transparent starting points.</p><div class="price-snapshot"><strong>Websites <small>from $499</small></strong><strong>Growth support <small>from $350/mo</small></strong><strong>Focused services <small>from $299</small></strong></div><a class="arrow-link" href="/pricing.html" data-event="pricing_click">View fixed scopes ${icon("arrow")}</a></article>
    </div>
  </div>
</section>

<section class="section final-cta">
  <div class="section-shell final-cta-inner"><p class="kicker">Your next project</p><h2>Tell me the business outcome. I will help define the right digital scope.</h2><div><a class="button button-light" href="/start-project.html" data-event="start_project_click">Start a Project ${icon("arrow")}</a><a class="button button-outline-light" href="/portfolio.html">View Work</a></div></div>
</section>`;

write("index.html", page({
  title: "James Digital | Dubai-Based Global Digital Partner",
  description: "Dubai-based digital strategy, web development, performance marketing, SEO, CRM, automation and creative partner working with businesses worldwide.",
  canonical: base + "/",
  pageType: "home",
  content: home,
  schema: homeSchema
}));

const portfolioContent = `
<section class="page-hero section-shell page-hero-portfolio">
  <div><p class="eyebrow"><span></span> Portfolio / Work</p><h1>Selected digital work with live public proof.</h1><p>Filter by service, industry and classification. Open a case study for the context and delivery approach, or inspect the public project directly.</p></div>
  <aside><strong>${projects.length} public projects</strong><span>Desktop + mobile previews</span><span>Live project links</span><span>Transparent evidence notes</span></aside>
</section>
<section class="portfolio-controls section-shell" aria-label="Portfolio filters">
  <div class="filter-group" data-filter-group="service"><span>Service</span><button class="is-active" type="button" data-filter="All">All</button><button type="button" data-filter="Strategy">Strategy</button><button type="button" data-filter="Web">Web</button><button type="button" data-filter="Paid Acquisition">Paid</button><button type="button" data-filter="SEO">SEO</button><button type="button" data-filter="CRM">CRM</button><button type="button" data-filter="Creative">Creative</button><button type="button" data-filter="Social Media">Social</button></div>
  <div class="filter-group" data-filter-group="industry"><span>Industry</span><button class="is-active" type="button" data-filter="All">All</button><button type="button" data-filter="Real Estate">Real Estate</button><button type="button" data-filter="Hospitality">Hospitality</button><button type="button" data-filter="Beauty">Beauty & Retail</button></div>
  <div class="filter-group" data-filter-group="classification"><span>Classification</span><button class="is-active" type="button" data-filter="All">All</button><button type="button" data-filter="Client Work">Client Work</button><button type="button" data-filter="Owned Project">Owned Project</button><button type="button" data-filter="Concept">Concept</button></div>
  <p class="filter-status" aria-live="polite"><strong data-visible-count>${projects.length}</strong> projects shown</p>
</section>
<section class="section section-shell portfolio-list" data-view-event="portfolio_view">
  <div class="portfolio-section-label"><p class="kicker">Featured projects</p><p>Projects with the broadest service and industry range.</p></div>
  <div class="featured-work-grid portfolio-featured">${projects.slice(0, 3).map((p, i) => projectCard(p, i, i === 0)).join("")}</div>
  <div class="portfolio-section-label all-projects-label"><p class="kicker">All projects</p><p>Use the filters above to narrow the portfolio.</p></div>
  <div class="portfolio-all-grid">${projects.map((p, i) => projectCard(p, i)).join("")}</div>
  <div class="evidence-note"><strong>Evidence policy</strong><p>Project and brand names come from portfolio information supplied for this site. Live links and public social channels are included for inspection. Private results, testimonials and before-and-after claims are omitted unless a verifiable source is available.</p></div>
</section>`;

write("portfolio.html", page({
  title: "Portfolio & Case Studies | James Digital",
  description: "Explore James Digital client work across real estate, hospitality, beauty and lifestyle, with service and industry filters, live links and individual case studies.",
  canonical: base + "/portfolio.html",
  pageType: "portfolio",
  bodyClass: "portfolio-page",
  content: portfolioContent,
  schema: {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "James Digital Portfolio",
    url: base + "/portfolio.html",
    hasPart: projects.map(p => ({ "@type": "CreativeWork", name: p.name, url: base + "/case-studies/" + p.slug + ".html" }))
  }
}));

function breadcrumb(items) {
  return '<nav class="breadcrumbs" aria-label="Breadcrumb">' + items.map((item, i) => i === items.length - 1 ? '<span aria-current="page">' + item[0] + '</span>' : '<a href="' + item[1] + '">' + item[0] + '</a><i>/</i>').join("") + '</nav>';
}

for (const project of projects) {
  const content = `
  <article class="case-study" data-case-title="${project.slug}">
    <header class="case-hero section-shell">
      ${breadcrumb([["Work", "/portfolio.html"], [project.name, ""]])}
      <div class="case-hero-grid">
        <div><p class="eyebrow"><span></span> ${project.classification} / ${project.industry}</p><h1>${project.name}</h1><p>${project.context}</p><div class="tag-row">${project.services.map(s => '<span>' + s + '</span>').join("")}</div><div class="hero-actions"><a class="button button-primary" href="${project.url}" target="_blank" rel="noopener noreferrer" data-event="live_project_click">View live project ↗</a><a class="button button-ghost" href="/start-project.html?project=${encodeURIComponent(project.name)}" data-event="start_project_click">Start a similar project</a></div></div>
        ${browserPreview(project, true)}
      </div>
    </header>
    <section class="case-summary section-shell">
      <div><span>Industry</span><strong>${project.industry}</strong></div><div><span>Location</span><strong>${project.location}</strong></div><div><span>Classification</span><strong>${project.classification}</strong></div><div><span>Public link</span><a href="${project.url}" target="_blank" rel="noopener noreferrer">${project.displayUrl} ↗</a></div>
    </section>
    <section class="section section-shell case-body">
      <aside class="case-nav"><strong>Case study</strong><a href="#context">Context</a><a href="#challenge">Challenge</a><a href="#strategy">Strategy</a><a href="#execution">Execution</a><a href="#deliverables">Deliverables</a><a href="#technology">Technology</a><a href="#evidence">Evidence</a></aside>
      <div class="case-sections">
        <section id="context"><p class="kicker">Context</p><h2>The operating environment.</h2><p>${project.context}</p></section>
        <section id="challenge"><p class="kicker">Challenge</p><h2>What the digital work needed to solve.</h2><p>${project.challenge}</p></section>
        <section id="strategy"><p class="kicker">Strategy</p><h2>The organising idea.</h2><p>${project.strategy}</p></section>
        <section id="execution"><p class="kicker">Execution</p><h2>How the direction became public work.</h2><p>${project.execution}</p></section>
        <section id="deliverables"><p class="kicker">Deliverables</p><h2>Workstreams included.</h2><ul class="check-list">${project.deliverables.map(d => '<li>' + icon("check") + '<span>' + d + '</span></li>').join("")}</ul></section>
        <section id="technology"><p class="kicker">Technology & tools</p><h2>The delivery stack.</h2><div class="tool-grid">${project.tools.map(t => '<span>' + t + '</span>').join("")}</div></section>
        <section id="evidence"><p class="kicker">Verified evidence</p><h2>What can be stated publicly.</h2><div class="evidence-grid"><div><span>Result</span><p>${project.result}</p></div><div><span>Before / after</span><p>${project.beforeAfter}</p></div></div><div class="public-links"><a href="${project.url}" target="_blank" rel="noopener noreferrer" data-event="live_project_click">Open live project ↗</a><a href="${project.social}" target="_blank" rel="noopener noreferrer" data-event="social_project_click">${project.socialLabel} ↗</a></div></section>
      </div>
    </section>
    <section class="section next-project"><div class="section-shell"><p class="kicker">Next project</p><h2>Need a clearer digital system for your business?</h2><a class="button button-light" href="/start-project.html?project=${encodeURIComponent(project.name)}" data-event="start_project_click">Start a Project ${icon("arrow")}</a></div></section>
  </article>`;
  write("case-studies/" + project.slug + ".html", page({
    title: project.name + " Case Study | James Digital",
    description: "Case study for " + project.name + " covering context, challenge, strategy, execution, deliverables, tools and verified public evidence.",
    canonical: base + "/case-studies/" + project.slug + ".html",
    pageType: "case-study",
    bodyClass: "case-study-page",
    content,
    schema: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: project.name + " digital work",
      url: base + "/case-studies/" + project.slug + ".html",
      creator: { "@type": "Person", name: "James Ravi" },
      about: project.name
    }
  }));
}

for (const service of services) {
  const related = projects.filter(p => p.services.some(s => service.title.includes(s) || s.includes(service.eyebrow) || (service.slug === "web-development" && s === "Web") || (service.slug === "performance-marketing" && s === "Paid Acquisition") || (service.slug === "crm-automation" && s === "CRM"))).slice(0, 3);
  const content = `
  <section class="page-hero section-shell service-hero">
    <div>${breadcrumb([["Capabilities", "/#capabilities"], [service.title, ""]])}<p class="eyebrow"><span></span> ${service.eyebrow}</p><h1>${service.title} built around the commercial journey.</h1><p>${service.description}</p><div class="hero-actions"><a class="button button-primary" href="/start-project.html?service=${encodeURIComponent(service.title)}" data-event="start_project_click">Start a Project ${icon("arrow")}</a><a class="button button-ghost" href="/portfolio.html">View Work</a></div></div>
    <aside class="service-outcome"><span>Commercial outcome</span><p>${service.outcome}</p></aside>
  </section>
  <section class="section section-shell service-detail-grid">
    <div><p class="kicker">The problem</p><h2>${service.problem}</h2></div>
    <div><p class="kicker">What can be delivered</p><ul class="check-list">${service.deliverables.map(d => '<li>' + icon("check") + '<span>' + d + '</span></li>').join("")}</ul></div>
  </section>
  <section class="section fit-section"><div class="section-shell"><div class="section-heading"><div><p class="kicker">Best fit</p><h2>Where this capability creates value.</h2></div><p>The final scope depends on the existing setup, urgency, internal resources and the outcome that matters.</p></div><div class="fit-grid">${service.fit.map((f, i) => '<article><span>0' + (i + 1) + '</span><h3>' + f + '</h3></article>').join("")}</div></div></section>
  <section class="section section-shell"><div class="section-heading"><div><p class="kicker">Related work</p><h2>Inspect the public project context.</h2></div><a class="arrow-link" href="/portfolio.html">View all work ${icon("arrow")}</a></div><div class="compact-work-grid">${(related.length ? related : projects.slice(0,3)).map((p, i) => projectCard(p, i)).join("")}</div></section>
  <section class="section final-cta"><div class="section-shell final-cta-inner"><p class="kicker">${service.title}</p><h2>Share the current setup and the outcome you need.</h2><div><a class="button button-light" href="/start-project.html?service=${encodeURIComponent(service.title)}" data-event="start_project_click">Start a Project ${icon("arrow")}</a><a class="button button-outline-light" href="/custom-engagements.html">Custom Engagements</a></div></div></section>`;
  write("services/" + service.slug + ".html", page({
    title: service.title + " Services | James Digital",
    description: service.description + " Dubai-based, available worldwide.",
    canonical: base + "/services/" + service.slug + ".html",
    pageType: "service",
    bodyClass: "service-page",
    content,
    schema: {
      "@context": "https://schema.org",
      "@type": "Service",
      name: service.title,
      description: service.description,
      provider: { "@type": "ProfessionalService", name: "James Digital", url: base + "/" },
      areaServed: "Worldwide"
    }
  }));
}

for (const industry of industries) {
  const matching = projects.filter(p => p.industry.includes(industry.title.split(" ")[0])).slice(0, 3);
  const content = `
  <section class="page-hero section-shell industry-hero">
    <div>${breadcrumb([["Industries", "/#capabilities"], [industry.title, ""]])}<p class="eyebrow"><span></span> Industry systems</p><h1>Digital growth for ${industry.title.toLowerCase()} businesses.</h1><p>${industry.description}</p><div class="hero-actions"><a class="button button-primary" href="/start-project.html?industry=${encodeURIComponent(industry.title)}" data-event="start_project_click">Discuss your business ${icon("arrow")}</a><a class="button button-ghost" href="/portfolio.html">View Work</a></div></div>
    <aside class="industry-problems"><span>Common challenges</span>${industry.problems.map(p => '<strong>' + p + '</strong>').join("")}</aside>
  </section>
  <section class="section section-shell"><div class="section-heading"><div><p class="kicker">Connected system</p><h2>From the business story to measurable follow-up.</h2></div><p>Channel selection comes after the offer, audience, journey and operating reality are clear.</p></div><ol class="process-rail industry-rail">${industry.system.map((s, i) => '<li><span>0' + (i + 1) + '</span><div><strong>' + s + '</strong></div></li>').join("")}</ol></section>
  <section class="section fit-section"><div class="section-shell service-detail-grid"><div><p class="kicker">Relevant capabilities</p><h2>Use one workstream or connect the complete journey.</h2></div><div class="link-list"><a href="/services/digital-strategy.html">Digital Strategy ${icon("arrow")}</a><a href="/services/web-development.html">Web Development ${icon("arrow")}</a><a href="/services/performance-marketing.html">Performance Marketing ${icon("arrow")}</a><a href="/services/seo.html">SEO ${icon("arrow")}</a><a href="/services/crm-automation.html">CRM & Automation ${icon("arrow")}</a></div></div></section>
  ${matching.length ? '<section class="section section-shell"><div class="section-heading"><div><p class="kicker">Related work</p><h2>Public examples in ' + industry.title + '.</h2></div></div><div class="compact-work-grid">' + matching.map((p, i) => projectCard(p, i)).join("") + '</div></section>' : ""}
  <section class="section final-cta"><div class="section-shell final-cta-inner"><p class="kicker">${industry.title}</p><h2>Build the digital system around the decision your customer needs to make.</h2><div><a class="button button-light" href="/start-project.html?industry=${encodeURIComponent(industry.title)}" data-event="start_project_click">Start a Project ${icon("arrow")}</a></div></div></section>`;
  write("industries/" + industry.slug + ".html", page({
    title: industry.title + " Digital Marketing & Web | James Digital",
    description: industry.description + " Dubai-based, available worldwide.",
    canonical: base + "/industries/" + industry.slug + ".html",
    pageType: "industry",
    bodyClass: "industry-page",
    content
  }));
}

const aboutContent = `
<section class="page-hero section-shell about-hero">
  <div><p class="eyebrow"><span></span> Meet James</p><h1>Dubai-based digital partner. Available worldwide.</h1><p>I work directly with businesses across strategy, websites, paid acquisition, SEO, analytics, CRM, automation and creative, connecting the work around one commercial outcome.</p><div class="hero-actions"><a class="button button-primary" href="/start-project.html" data-event="start_project_click">Start a Project ${icon("arrow")}</a><a class="button button-ghost" href="/portfolio.html">View Work</a></div></div>
  <aside class="about-portrait-card"><div class="about-monogram"><span>J</span><small>Dubai</small></div><strong>Direct communication</strong><p>No hand-off to a junior account layer. The person shaping the strategy stays close to delivery.</p></aside>
</section>
<section class="section section-shell service-detail-grid">
  <div><p class="kicker">How I work</p><h2>Senior judgment, practical execution and visible ownership.</h2></div>
  <div class="body-copy"><p>Some projects need one focused website or campaign. Others need a connected system across positioning, acquisition, conversion and follow-up. I define the scope around the actual business problem, not around a fixed channel list.</p><p>Remote delivery is structured around clear milestones, written decisions, scheduled reviews and a practical handover, so location does not reduce visibility or accountability.</p></div>
</section>
<section class="section fit-section"><div class="section-shell"><div class="section-heading"><div><p class="kicker">Verified career context</p><h2>Experience behind the digital work.</h2></div><p>The detailed evidence remains on the main James Realty career portfolio, where roles and public results are attributed.</p></div><div class="about-stat-grid"><article><strong>10+ years</strong><span>Marketing career</span></article><article><strong>50+ markets</strong><span>International acquisition scope</span></article><article><strong>Dubai</strong><span>UAE operating base</span></article><article><strong>Direct</strong><span>Strategy-to-delivery communication</span></article></div><a class="arrow-link verified-link" href="https://jamesrealty.uk/about-me/" target="_blank" rel="noopener noreferrer">Open verified career portfolio ${icon("arrow")}</a></div></section>
<section class="section section-shell"><div class="section-heading"><div><p class="kicker">Capabilities</p><h2>Commercial range without the agency layers.</h2></div></div><div class="capability-grid">${capabilityItems.map(c => '<article><span>' + c[0] + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p></article>').join("")}</div></section>
<section class="section final-cta"><div class="section-shell final-cta-inner"><p class="kicker">Work together</p><h2>Share the business, the problem and the outcome you need.</h2><div><a class="button button-light" href="/start-project.html" data-event="start_project_click">Start a Project ${icon("arrow")}</a><a class="button button-outline-light" href="/start-project.html?route=call" data-event="book_call_click">Book a Call</a></div></div></section>`;

write("about.html", page({
  title: "Meet James | Dubai-Based Global Digital Partner",
  description: "Meet James Ravi, a Dubai-based digital strategy, web, performance marketing, SEO, CRM and automation partner working with businesses worldwide.",
  canonical: base + "/about.html",
  pageType: "about",
  bodyClass: "about-page",
  content: aboutContent,
  schema: {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "James Ravi",
    jobTitle: "Digital Strategy and Marketing Partner",
    homeLocation: { "@type": "Place", name: "Dubai, United Arab Emirates" },
    url: base + "/about.html",
    sameAs: ["https://jamesrealty.uk/about-me/", "https://ae.linkedin.com/in/james-ravi-dubai"]
  }
}));

const pricingContent = `
<section class="page-hero section-shell pricing-hero" data-view-event="pricing_view">
  <div><p class="eyebrow"><span></span> Pricing</p><h1>Clear starting points without limiting the scale of the partnership.</h1><p>Fixed scopes make focused projects easy to start. Larger or more complex requirements move through the Custom Engagements route.</p><div class="hero-actions"><a class="button button-primary" href="/custom-engagements.html" data-event="custom_engagement_click">Explore Custom Engagements ${icon("arrow")}</a><a class="button button-ghost" href="/start-project.html" data-event="start_project_click">Start a Project</a></div></div>
  <aside class="service-outcome"><span>Pricing approach</span><p>Final scope reflects deliverables, platforms, production, integrations and the level of ongoing ownership required.</p></aside>
</section>
<section class="section section-shell">
  <div class="section-heading"><div><p class="kicker">Monthly growth support</p><h2>Defined packages for focused acquisition work.</h2></div><p>Advertising spend, production shoots, paid software and third-party subscriptions are separate unless specifically included.</p></div>
  <div class="price-grid">
    <article><span>Starter</span><h3>$350<small>/month</small></h3><p>One acquisition channel managed with the essential tracking and creative testing.</p><ul><li>1 paid advertising platform</li><li>Campaign setup and optimisation</li><li>Conversion tracking review</li><li>Up to 4 creative variations</li><li>Monthly performance report</li><li>1 strategy call / month</li></ul><a class="button button-ghost" href="/start-project.html?package=Growth%20Starter" data-event="start_project_click">Choose Starter</a></article>
    <article class="price-featured"><span>Growth</span><h3>$650<small>/month</small></h3><p>Acquisition, creative and conversion work across Meta and Google.</p><ul><li>Meta + Google Ads management</li><li>Campaign setup and optimisation</li><li>Up to 8 creative variations</li><li>Landing-page conversion review</li><li>Conversion tracking and reporting</li><li>2 strategy calls / month</li></ul><a class="button button-primary" href="/start-project.html?package=Growth" data-event="start_project_click">Choose Growth</a></article>
    <article><span>Scale</span><h3>$950<small>/month</small></h3><p>A more connected acquisition and lead-conversion system.</p><ul><li>Meta + Google + optional third channel</li><li>Up to 12 creative variations</li><li>Landing-page optimisation</li><li>CRM / lead-flow review</li><li>Advanced tracking and reporting</li><li>Weekly optimisation review</li></ul><a class="button button-ghost" href="/start-project.html?package=Scale" data-event="start_project_click">Choose Scale</a></article>
  </div>
</section>
<section class="section fit-section"><div class="section-shell"><div class="section-heading"><div><p class="kicker">Website packages</p><h2>Focused builds with a defined delivery boundary.</h2></div><p>Responsive design, launch support and essential search foundations are included.</p></div><div class="price-grid website-price-grid">
  <article><span>Launch Site</span><h3>$499<small>one-time</small></h3><ul><li>Up to 5 pages</li><li>Responsive custom layout</li><li>Contact / WhatsApp CTA</li><li>Basic on-page SEO</li><li>Analytics setup</li><li>2 revision rounds</li></ul><a class="arrow-link" href="/start-project.html?package=Launch%20Site" data-event="start_project_click">Start a website ${icon("arrow")}</a></article>
  <article><span>Business Site</span><h3>$799<small>one-time</small></h3><ul><li>Up to 10 pages</li><li>Custom sections and interactions</li><li>Blog-ready structure</li><li>Conversion tracking</li><li>SEO foundations</li><li>3 revision rounds</li></ul><a class="arrow-link" href="/start-project.html?package=Business%20Site" data-event="start_project_click">Build a business site ${icon("arrow")}</a></article>
  <article><span>E-commerce</span><h3>$1,299+<small>one-time</small></h3><ul><li>Storefront design</li><li>Up to 25 starter products</li><li>Payment setup support</li><li>Product categories</li><li>Analytics and conversion tracking</li><li>Launch support</li></ul><a class="arrow-link" href="/start-project.html?package=E-commerce" data-event="start_project_click">Discuss your store ${icon("arrow")}</a></article>
</div></div></section>
<section class="section section-shell"><div class="section-heading"><div><p class="kicker">Focused services</p><h2>Start with one defined need.</h2></div></div><div class="mini-price-grid"><article><span>Social Media</span><strong>from $299/mo</strong></article><article><span>SEO</span><strong>from $299/mo</strong></article><article><span>Landing Page</span><strong>from $299</strong></article><article><span>CRM Automation</span><strong>from $300</strong></article><article><span>Brand Starter</span><strong>from $199</strong></article><article><span>Custom Scope</span><strong>Request proposal</strong></article></div></section>
<section class="section final-cta"><div class="section-shell final-cta-inner"><p class="kicker">Larger requirement?</p><h2>Use a custom engagement when the business problem crosses channels, teams or markets.</h2><div><a class="button button-light" href="/custom-engagements.html">Custom Engagements ${icon("arrow")}</a><a class="button button-outline-light" href="/start-project.html" data-event="start_project_click">Start a Project</a></div></div></section>`;

write("pricing.html", page({
  title: "Digital Services Pricing | James Digital",
  description: "Fixed-scope website, paid acquisition, SEO, CRM and creative packages, plus custom engagements for established companies and complex international projects.",
  canonical: base + "/pricing.html",
  pageType: "pricing",
  bodyClass: "pricing-page",
  content: pricingContent
}));

const customContent = `
<section class="page-hero section-shell custom-hero">
  <div><p class="eyebrow"><span></span> Custom Engagements</p><h1>For companies that need more than a package.</h1><p>Custom engagements connect strategy, websites, acquisition, measurement, CRM, automation and creative around a larger commercial priority.</p><div class="hero-actions"><a class="button button-primary" href="/start-project.html?engagement=custom" data-event="start_project_click">Discuss a Custom Engagement ${icon("arrow")}</a><a class="button button-ghost" href="/portfolio.html">View Work</a></div></div>
  <aside class="industry-problems"><span>Typical requirements</span><strong>International market entry</strong><strong>Multi-route website rebuild</strong><strong>Lead-generation and CRM system</strong><strong>Ongoing growth ownership</strong></aside>
</section>
<section class="section section-shell"><div class="section-heading"><div><p class="kicker">Designed around the business</p><h2>The scope follows the operating problem.</h2></div><p>Custom does not mean vague. Deliverables, milestones, owners, communication and measurement are defined before the engagement begins.</p></div><div class="trust-grid"><article><span>01</span><h3>Discovery</h3><p>Commercial goal, audience, current systems, team and constraints.</p></article><article><span>02</span><h3>Roadmap</h3><p>Priorities, dependencies, measurement and phased delivery plan.</p></article><article><span>03</span><h3>Integrated delivery</h3><p>Workstreams connected through one commercial and technical direction.</p></article><article><span>04</span><h3>Governance</h3><p>Milestones, decisions, reviews, ownership and post-launch priorities.</p></article></div></section>
<section class="section fit-section"><div class="section-shell"><div class="section-heading"><div><p class="kicker">Engagement models</p><h2>Choose the structure that matches the work.</h2></div></div><div class="engagement-model-grid"><article><span>01</span><h3>Strategic project</h3><p>A defined transformation, launch or rebuild with phased milestones and a clear handover.</p></article><article><span>02</span><h3>Fractional digital leadership</h3><p>Ongoing senior direction across internal teams, suppliers, channels and systems.</p></article><article><span>03</span><h3>Growth partnership</h3><p>Continuous acquisition, conversion, CRM and optimisation ownership against agreed priorities.</p></article></div></div></section>
<section class="section section-shell"><div class="section-heading"><div><p class="kicker">What may be included</p><h2>One coordinated scope across the digital system.</h2></div></div><div class="capability-grid">${capabilityItems.map(c => '<article><span>' + c[0] + '</span><h3>' + c[1] + '</h3><p>' + c[2] + '</p></article>').join("")}</div></section>
<section class="section final-cta"><div class="section-shell final-cta-inner"><p class="kicker">Custom Engagement</p><h2>Share the business priority, current system, budget range and intended timeline.</h2><div><a class="button button-light" href="/start-project.html?engagement=custom" data-event="start_project_click">Start the Brief ${icon("arrow")}</a><a class="button button-outline-light" href="/start-project.html?route=call" data-event="book_call_click">Book a Call</a></div></div></section>`;

write("custom-engagements.html", page({
  title: "Custom Digital Engagements | James Digital",
  description: "Custom digital strategy, website, acquisition, CRM, automation and growth engagements for established companies and larger international projects.",
  canonical: base + "/custom-engagements.html",
  pageType: "custom-engagement",
  bodyClass: "custom-page",
  content: customContent
}));

const serviceOptions = ["Digital Strategy", "Web Development", "Performance Marketing", "SEO", "Analytics & Tracking", "CRM", "Automation", "Creative"];
const startContent = `
<section class="page-hero section-shell start-hero">
  <div><p class="eyebrow"><span></span> Start a Project</p><h1>Tell me what the business needs to achieve.</h1><p>Share enough context to qualify the project. Your answers stay in your browser and are converted into a structured brief for you to review before sending by WhatsApp or email.</p><div class="contact-route-row"><a href="/start-project.html" class="is-active" data-route-link="project" data-event="start_project_click">Start a Project</a><a href="/start-project.html?route=call" data-route-link="call" data-event="book_call_click">Book a Call</a><a href="https://wa.me/${whatsapp}?text=Hi%20James%2C%20I%20would%20like%20to%20discuss%20a%20digital%20project." target="_blank" rel="noopener noreferrer" data-event="whatsapp_click">WhatsApp</a><a href="${emailHref}" data-event="email_click">Email James</a></div></div>
  <aside class="service-outcome"><span>What happens next</span><p>You receive a focused response on fit, recommended scope and the next useful conversation. No generic proposal is sent automatically.</p></aside>
</section>
<section class="section project-form-section"><div class="section-shell project-form-grid">
  <div class="project-form-intro"><p class="kicker">Project qualification</p><h2 data-form-heading>Start with the business context.</h2><p data-form-intro>Required fields help avoid a vague first conversation and make the next step more useful.</p><ul><li>Direct communication with James</li><li>Clear USD scope and milestones</li><li>Worldwide project availability</li><li>No data stored by this website</li></ul></div>
  <form class="project-form" id="project-form" novalidate>
    <input type="hidden" name="route" id="route" value="project">
    <label><span>Name *</span><input type="text" name="name" id="name" autocomplete="name" required maxlength="100" placeholder="Your name"></label>
    <label><span>Company *</span><input type="text" name="company" id="company" autocomplete="organization" required maxlength="140" placeholder="Company or brand"></label>
    <label><span>Website</span><input type="url" name="website" id="website" inputmode="url" placeholder="https://"></label>
    <label><span>Country *</span><input type="text" name="country" id="country" autocomplete="country-name" required maxlength="100" placeholder="Where are you based?"></label>
    <label class="full-field"><span>Email or contact number *</span><input type="text" name="contact" id="contact" required maxlength="160" placeholder="How should I contact you?"></label>
    <fieldset class="full-field service-checkboxes"><legend>Required services *</legend>${serviceOptions.map(s => '<label><input type="checkbox" name="services" value="' + s + '"><span>' + s + '</span></label>').join("")}</fieldset>
    <label><span>Main objective *</span><select name="objective" id="objective" required><option value="">Select the main goal</option><option>Generate more qualified leads</option><option>Improve website conversion</option><option>Launch a business or offer</option><option>Improve search visibility</option><option>Fix lead follow-up</option><option>Build a complete digital system</option><option>Other</option></select></label>
    <label><span>Budget range *</span><select name="budget" id="budget" required><option value="">Select</option><option>Below $1,000</option><option>$1,000–$3,000</option><option>$3,000–$10,000</option><option>$10,000–$25,000</option><option>$25,000–$50,000</option><option>$50,000+</option><option>Not decided</option></select></label>
    <label><span>Timeline *</span><select name="timeline" id="timeline" required><option value="">Select</option><option>As soon as possible</option><option>Within 30 days</option><option>1–3 months</option><option>3–6 months</option><option>6+ months</option><option>Exploring options</option></select></label>
    <label><span>Preferred reply *</span><select name="reply" id="reply" required><option value="">Select</option><option>WhatsApp</option><option>Email</option><option>Phone / video call</option></select></label>
    <label class="full-field"><span>Project description *</span><textarea name="description" id="description" required maxlength="1500" placeholder="What is happening now, what needs to change, and what would success look like?"></textarea></label>
    <label class="consent full-field"><input type="checkbox" name="consent" required><span>I agree that James may contact me about this project brief.</span></label>
    <div class="form-submit full-field"><button class="button button-primary" type="submit">Prepare my project brief ${icon("arrow")}</button><p>Submitting prepares WhatsApp and email messages locally. You review and send the brief yourself.</p></div>
    <div class="form-status full-field" id="form-status" role="status" aria-live="polite"></div>
    <div class="form-success full-field" id="form-success" hidden><strong>Your brief is ready.</strong><p>Review it before sending by WhatsApp or email.</p><div class="form-success-actions"><a class="button button-primary" id="continue-whatsapp" href="#" target="_blank" rel="noopener noreferrer" data-event="whatsapp_click">Continue on WhatsApp ↗</a><a class="button button-ghost" id="continue-email" href="#" data-event="email_click">Send by email</a><button class="copy-brief" id="copy-brief" type="button">Copy project brief</button></div></div>
  </form>
</div></section>`;

write("start-project.html", page({
  title: "Start a Digital Project | James Digital",
  description: "Qualify a digital strategy, website, performance marketing, SEO, CRM, automation or creative project with James Digital.",
  canonical: base + "/start-project.html",
  pageType: "start-project",
  bodyClass: "start-project-page",
  content: startContent
}));

const routes = [
  "/",
  "/portfolio.html",
  "/about.html",
  "/pricing.html",
  "/custom-engagements.html",
  "/start-project.html",
  ...services.map(s => "/services/" + s.slug + ".html"),
  ...industries.map(i => "/industries/" + i.slug + ".html"),
  ...projects.map(p => "/case-studies/" + p.slug + ".html")
];

write("sitemap.xml", '<?xml version="1.0" encoding="UTF-8"?>' + String.fromCharCode(10) + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + routes.map(route => '<url><loc>' + base + route + '</loc><changefreq>' + (route.includes("case-studies") ? "monthly" : "weekly") + '</changefreq><priority>' + (route === "/" ? "1.0" : route === "/portfolio.html" || route === "/start-project.html" ? "0.9" : "0.7") + '</priority></url>').join("") + '</urlset>');

write("robots.txt", "User-agent: *" + String.fromCharCode(10) + "Allow: /" + String.fromCharCode(10) + String.fromCharCode(10) + "Sitemap: " + base + "/sitemap.xml");

write("404.html", page({
  title: "Page not found | James Digital",
  description: "The requested James Digital page could not be found.",
  canonical: base + "/404.html",
  robots: "noindex,follow",
  pageType: "404",
  bodyClass: "error-page",
  content: '<section class="page-hero section-shell error-hero"><div><p class="eyebrow"><span></span> 404</p><h1>That page does not exist.</h1><p>Return to the portfolio, explore capabilities or start a project.</p><div class="hero-actions"><a class="button button-primary" href="/">Back to home</a><a class="button button-ghost" href="/portfolio.html">View Work</a></div></div></section>'
}));

console.log("Generated " + routes.length + " indexed routes.");
