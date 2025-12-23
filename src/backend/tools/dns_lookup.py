"""DNS records and WHOIS registration data lookup."""

import socket


def dns_lookup(domain: str) -> str:
    """Look up DNS records (A, MX, NS, TXT) for a domain."""
    domain = domain.strip().lower()
    if domain.startswith("http"):
        # Extract domain from URL
        domain = domain.split("//", 1)[-1].split("/", 1)[0]

    results = [f"## DNS Records for {domain}\n"]

    # A records
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, "A")
        ips = [str(r) for r in answers]
        results.append(f"**A Records:** {', '.join(ips)}")
    except Exception:
        # Fallback to socket
        try:
            ip = socket.gethostbyname(domain)
            results.append(f"**A Record:** {ip}")
        except Exception:
            results.append("**A Records:** Not found")

    # MX records
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, "MX")
        mx = [f"{r.preference} {r.exchange}" for r in answers]
        results.append(f"**MX Records:** {', '.join(mx)}")
    except Exception:
        results.append("**MX Records:** Not found")

    # NS records
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, "NS")
        ns = [str(r) for r in answers]
        results.append(f"**NS Records:** {', '.join(ns)}")
    except Exception:
        results.append("**NS Records:** Not found")

    # TXT records
    try:
        import dns.resolver
        answers = dns.resolver.resolve(domain, "TXT")
        txt = [str(r) for r in answers][:5]  # Limit to 5
        results.append(f"**TXT Records:** {'; '.join(txt)}")
    except Exception:
        results.append("**TXT Records:** Not found")

    return "\n".join(results)


def whois_lookup(domain: str) -> str:
    """Look up WHOIS registration data for a domain."""
    domain = domain.strip().lower()
    if domain.startswith("http"):
        domain = domain.split("//", 1)[-1].split("/", 1)[0]

    try:
        import whois
        w = whois.whois(domain)

        lines = [f"## WHOIS Data for {domain}\n"]

        if w.registrar:
            lines.append(f"**Registrar:** {w.registrar}")
        if w.creation_date:
            date = w.creation_date[0] if isinstance(w.creation_date, list) else w.creation_date
            lines.append(f"**Created:** {date}")
        if w.expiration_date:
            date = w.expiration_date[0] if isinstance(w.expiration_date, list) else w.expiration_date
            lines.append(f"**Expires:** {date}")
        if w.updated_date:
            date = w.updated_date[0] if isinstance(w.updated_date, list) else w.updated_date
            lines.append(f"**Updated:** {date}")
        if w.name_servers:
            ns = w.name_servers if isinstance(w.name_servers, list) else [w.name_servers]
            lines.append(f"**Nameservers:** {', '.join(str(n) for n in ns[:5])}")
        if w.org:
            lines.append(f"**Organization:** {w.org}")
        if w.country:
            lines.append(f"**Country:** {w.country}")
        if w.state:
            lines.append(f"**State:** {w.state}")
        if w.status:
            status = w.status if isinstance(w.status, list) else [w.status]
            lines.append(f"**Status:** {', '.join(str(s) for s in status[:3])}")

        return "\n".join(lines)

    except Exception as e:
        return f"WHOIS lookup failed for {domain}: {e}"
