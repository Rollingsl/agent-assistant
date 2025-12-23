"""Detect technology stack from HTML content and HTTP headers."""

import re
import logging

logging.getLogger("scrapling").setLevel(logging.WARNING)


# Technology signatures: (name, detection_type, pattern)
TECH_SIGNATURES = [
    # JavaScript frameworks (detected in HTML/scripts)
    ("React", "html", r'react[-.]|__react|reactDOM|_jsx|react\.production'),
    ("Next.js", "html", r'__next|next[-/]|_next/static|nextjs'),
    ("Vue.js", "html", r'vue[-.]|__vue|v-if=|v-for=|v-bind|vue\.runtime'),
    ("Nuxt", "html", r'__nuxt|nuxt[-/]|_nuxt/'),
    ("Angular", "html", r'ng-version|angular[-.]|ng-app|ng-controller'),
    ("Svelte", "html", r'svelte[-.]|__svelte'),
    ("jQuery", "html", r'jquery[-.]min\.js|jquery[-.][\d]'),
    ("Gatsby", "html", r'gatsby[-.]|/gatsby-'),

    # CSS frameworks
    ("Tailwind CSS", "html", r'tailwindcss|tw-[\w]'),
    ("Bootstrap", "html", r'bootstrap[-.]min|bootstrap[-.][\d]'),

    # CMS / Platforms
    ("WordPress", "html", r'wp-content|wp-includes|wordpress'),
    ("Shopify", "html", r'cdn\.shopify|shopify[-.]'),
    ("Webflow", "html", r'webflow[-.]|wf-page'),
    ("Squarespace", "html", r'squarespace[-.]|static\.squarespace'),
    ("Wix", "html", r'wix[-.]|wixstatic'),
    ("Ghost", "html", r'ghost[-.]org|ghost/api'),
    ("Drupal", "html", r'drupal[-.]|/sites/default/files'),

    # Server / Backend
    ("Nginx", "header", r'nginx'),
    ("Apache", "header", r'apache'),
    ("Cloudflare", "header", r'cloudflare'),
    ("Express", "header", r'express'),
    ("ASP.NET", "header", r'asp\.net|x-aspnet'),

    # Analytics / Tracking
    ("Google Analytics", "html", r'google-analytics|googletagmanager|gtag|ga\.js|analytics\.js'),
    ("Google Tag Manager", "html", r'googletagmanager\.com'),
    ("Facebook Pixel", "html", r'facebook\.net/en_US/fbevents|fbq\('),
    ("Hotjar", "html", r'hotjar[-.]|static\.hotjar'),
    ("Segment", "html", r'segment[-.]com/analytics|analytics\.js'),

    # Hosting / CDN
    ("Vercel", "header", r'vercel'),
    ("Netlify", "header", r'netlify'),
    ("AWS", "header", r'amazons3|cloudfront|awselb|x-amz'),
    ("Google Cloud", "header", r'gws|x-goog|google'),
    ("Fastly", "header", r'fastly'),

    # Other
    ("TypeScript", "html", r'\.tsx?|typescript'),
    ("Webpack", "html", r'webpack|webpackChunk'),
    ("Vite", "html", r'/@vite|vite[-.]'),
    ("GraphQL", "html", r'graphql|__apollo|apollographql'),
    ("Stripe", "html", r'js\.stripe\.com|stripe[-.]'),
    ("Intercom", "html", r'intercom[-.]|widget\.intercom'),
    ("HubSpot", "html", r'hubspot[-.]|hs-scripts'),
]


def detect_tech_stack(url: str) -> str:
    """Detect technology stack from a URL by analyzing HTML and headers.

    Uses Scrapling to fetch the page, then matches against known signatures.
    """
    url = url.strip()
    if not url:
        return "No URL provided."
    if not url.startswith("http"):
        url = f"https://{url}"

    try:
        from scrapling.fetchers import Fetcher
        page = Fetcher.get(url, stealthy_headers=True, timeout=15)

        if page.status >= 400:
            return f"Failed to fetch {url}: HTTP {page.status}"

        html = str(page.html_content) if hasattr(page, 'html_content') else ""
        if not html:
            # Try getting body text
            body = page.css("html")
            html = str(body) if body else ""

        # Collect headers
        headers_str = ""
        if hasattr(page, 'headers') and page.headers:
            headers_str = " ".join(f"{k}: {v}" for k, v in page.headers.items()).lower()

        detected = []
        for name, detect_type, pattern in TECH_SIGNATURES:
            target = headers_str if detect_type == "header" else html
            if target and re.search(pattern, target, re.IGNORECASE):
                detected.append(name)

        # Check meta generators
        meta_gen = page.css('meta[name="generator"]::attr(content)').getall()
        for gen in meta_gen:
            if gen and gen.strip():
                detected.append(f"{gen.strip()} (meta generator)")

        # Deduplicate
        detected = list(dict.fromkeys(detected))

        if not detected:
            return f"No technologies confidently detected on {url}."

        lines = [f"## Technology Stack: {url}\n"]
        for tech in detected:
            lines.append(f"- {tech}")

        return "\n".join(lines)

    except Exception as e:
        return f"Tech detection failed for {url}: {e}"
