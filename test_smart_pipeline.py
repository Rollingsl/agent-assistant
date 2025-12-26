"""Test script for smart pipeline quality improvements.

Run: python3 test_smart_pipeline.py           # offline tests (Parts 1-4)
     python3 test_smart_pipeline.py --live     # adds live URL fetch test (Part 5)
     python3 test_smart_pipeline.py --full     # adds full pipeline e2e (Part 6, needs DB)
"""

import sys

# ═══════════════════════════════════════════════════════════════
# Part 1: Analyzer — Intent Classification & Title-Priority
# ═══════════════════════════════════════════════════════════════

def test_analyzer():
    from src.backend.smart_pipeline.analyzer import analyze_task

    tests = [
        {
            "title": "Research Tesla Inc",
            "desc": "Research Tesla Inc funding, tech stack, leadership and recent product launches",
            "expected_intent": "RESEARCH",
            "note": "Was TECHNICAL before fix — 'tech stack' triggered it",
        },
        {
            "title": "Compare React vs Vue",
            "desc": "Compare React vs Vue for building modern web applications",
            "expected_intent": "COMPARISON",
            "note": "Should detect comparison items",
        },
        {
            "title": "Research OpenAI",
            "desc": "Research OpenAI company overview, funding rounds, and market position",
            "expected_intent": "RESEARCH",
            "note": "Pure research, no competing signals",
        },
        {
            "title": "Latest AI news",
            "desc": "Latest news and announcements in artificial intelligence this week",
            "expected_intent": "NEWS",
            "note": "NEWS should win with 'latest' + 'news' + 'this week'",
        },
        {
            "title": "OSINT stripe.com",
            "desc": "Who owns stripe.com, WHOIS data, and company background",
            "expected_intent": "OSINT",
            "note": "Explicit OSINT keyword + domain + WHOIS signals",
        },
        {
            "title": "How to deploy a FastAPI app",
            "desc": "How to deploy a FastAPI application to AWS with Docker",
            "expected_intent": "HOWTO",
            "note": "Should not be TECHNICAL despite tech keywords",
        },
        {
            "title": "Research Anthropic",
            "desc": "Research Anthropic AI company, their Claude models, and tech stack details",
            "expected_intent": "RESEARCH",
            "note": "Title says 'Research' — should override 'tech stack' in desc",
        },
    ]

    print("=" * 60)
    print("PART 1: Analyzer — Intent Classification")
    print("=" * 60)

    passed = 0
    failed = 0

    for t in tests:
        a = analyze_task(t["title"], t["desc"])
        ok = a.intent == t["expected_intent"]

        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1

        print(f"\n[{status}] {t['title']}")
        print(f"  Note: {t['note']}")
        print(f"  Expected: {t['expected_intent']}  Got: {a.intent} (confidence: {a.confidence:.0%})")

        top3 = sorted(a.intent_scores.items(), key=lambda x: x[1], reverse=True)[:3]
        print(f"  Top scores: {', '.join(f'{k}={v:.1f}' for k, v in top3)}")
        print(f"  Entities: {a.entities[:3]}")

        if not ok:
            print(f"  >>> MISMATCH: expected {t['expected_intent']}, got {a.intent}")

    print(f"\nAnalyzer results: {passed} passed, {failed} failed out of {len(tests)}")
    return failed


# ═══════════════════════════════════════════════════════════════
# Part 2: Synthesizer — Filtering Quality
# ═══════════════════════════════════════════════════════════════

def test_synthesizer():
    from src.backend.smart_pipeline.analyzer import analyze_task
    from src.backend.smart_pipeline.synthesizer import synthesize, _is_non_english, _split_sentences

    print("\n" + "=" * 60)
    print("PART 2: Synthesizer — Content Filtering")
    print("=" * 60)

    passed = 0
    failed = 0

    # Test 2a: Non-English text detection
    print("\n--- 2a: Non-English text filter ---")
    non_english_samples = [
        # German uses mostly ASCII — caught by noise patterns + URL TLD filter instead
        ("Tesla ist ein Automobilhersteller mit Sitz in Austin, Texas.", False, "German (ASCII-heavy, filtered by noise/TLD)"),
        ("特斯拉是一家美国电动汽车公司。", True, "Chinese"),
        ("Tesla is an American electric vehicle company based in Austin, Texas.", False, "English"),
        ("テスラは電気自動車メーカーです。", True, "Japanese"),
    ]
    for text, expected, label in non_english_samples:
        result = _is_non_english(text)
        ok = result == expected
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] {label}: is_non_english={result} (expected {expected})")

    # Test 2b: Noise pattern filtering
    print("\n--- 2b: Noise pattern filtering ---")
    noise_samples = [
        "Fazit zum Tesla Model 3 Performance Testbericht.",
        "Cookie policy: This site uses cookies to improve your experience.",
        "Posted by user123 | March 2025",
        "Breadcrumb > Home > Cars > Tesla",
        "4.5/5 stars rating based on user reviews",
    ]
    clean_samples = [
        "Tesla reported revenue of $96 billion in 2024, a 15% increase year over year.",
        "The company was founded by Elon Musk and incorporated in Delaware in 2003.",
        "Tesla operates Gigafactories in Nevada, Shanghai, Berlin, and Austin.",
    ]

    print("  Noise (should be filtered):")
    for text in noise_samples:
        sentences = _split_sentences(text)
        filtered = len(sentences) == 0
        ok = filtered
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        short = text[:60] + "..." if len(text) > 60 else text
        print(f"    [{status}] \"{short}\" → filtered={filtered}")

    print("  Clean (should pass through):")
    for text in clean_samples:
        sentences = _split_sentences(text)
        kept = len(sentences) > 0
        ok = kept
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        short = text[:60] + "..." if len(text) > 60 else text
        print(f"    [{status}] \"{short}\" → kept={kept}")

    # Test 2c: Score threshold + per-source cap
    print("\n--- 2c: Score threshold (>1.5) and per-source cap (8) ---")

    analysis = analyze_task("Research Tesla Inc", "Research Tesla Inc company overview")

    content = "\n".join([
        "Tesla Inc is an American electric vehicle and clean energy company.",
        "Tesla was founded in 2003 and is headquartered in Austin, Texas.",
        "Tesla reported annual revenue of $96 billion in fiscal year 2024.",
        "The Tesla Model Y became the world's best-selling car in 2023.",
        "The weather in San Francisco is usually mild throughout the year.",
        "Python is a popular programming language for data science.",
        "Many companies are exploring new opportunities in various markets.",
    ])

    many_facts_content = "\n".join([
        f"Tesla fact number {i}: Tesla Inc continues to expand operations globally."
        for i in range(1, 16)
    ])

    content_items = [
        ("https://example.com/tesla", content),
        ("https://noisy.com/tesla-spam", many_facts_content),
    ]

    result = synthesize(content_items, analysis)

    noisy_facts = []
    for section_facts in result.sections.values():
        noisy_facts.extend(f for f in section_facts if f.source_url == "https://noisy.com/tesla-spam")

    capped = len(noisy_facts) <= 8
    status = "PASS" if capped else "FAIL"
    if capped:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] Per-source cap: noisy source has {len(noisy_facts)} facts (max 8)")

    print(f"  Total facts synthesized: {result.total_facts}")
    print(f"  Sections: {', '.join(f'{k}({len(v)})' for k, v in result.sections.items())}")

    print(f"\nSynthesizer results: {passed} passed, {failed} failed")
    return failed


# ═══════════════════════════════════════════════════════════════
# Part 3: URL Filtering (with language preferences)
# ═══════════════════════════════════════════════════════════════

def test_url_filtering():
    print("\n" + "=" * 60)
    print("PART 3: URL Language Filtering")
    print("=" * 60)

    try:
        from src.backend.smart_pipeline.engine import _is_non_english_url, _rank_urls
    except (ImportError, ModuleNotFoundError) as e:
        print(f"  [SKIP] Cannot import engine (missing dependency: {e})")
        return 0

    from src.backend.smart_pipeline.analyzer import analyze_task

    passed = 0
    failed = 0

    # Test non-English URL detection
    url_tests = [
        ("https://www.motor-talk.de/tesla-model-3", True, "German .de"),
        ("https://baike.baidu.cn/tesla", True, "Chinese .cn"),
        ("https://forum.auto.fr/tesla", True, "French .fr"),
        ("https://en.wikipedia.org/wiki/Tesla", False, "English .org"),
        ("https://www.reuters.com/tesla", False, "English .com"),
        ("https://auto.jp/review/tesla", True, "Japanese .jp"),
    ]

    for url, expected, label in url_tests:
        result = _is_non_english_url(url)
        ok = result == expected
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] {label}: {url} → non_english={result}")

    # Test English user: filters .de and .cn
    print("\n--- Rank URLs: English user (filters .de, .cn) ---")
    analysis = analyze_task("Research Tesla Inc", "Research Tesla Inc")
    urls = [
        "https://en.wikipedia.org/wiki/Tesla,_Inc.",
        "https://www.motor-talk.de/forum/tesla-model-3-t123.html",
        "https://www.reuters.com/companies/tesla",
        "https://baike.baidu.cn/tesla",
        "https://www.bloomberg.com/tesla",
    ]
    ranked = _rank_urls(urls, analysis, max_urls=4, user_language="English")

    has_de = any(".de" in u for u in ranked)
    has_cn = any(".cn" in u for u in ranked)
    ok = not has_de and not has_cn
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] English user: {ranked}")
    print(f"    No .de: {not has_de}, No .cn: {not has_cn}")

    # Test German user: keeps .de, filters .cn
    print("\n--- Rank URLs: German user (keeps .de, filters .cn) ---")
    ranked_de = _rank_urls(urls, analysis, max_urls=4, user_language="German")

    has_de = any(".de" in u for u in ranked_de)
    has_cn = any(".cn" in u for u in ranked_de)
    ok = has_de and not has_cn
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] German user: {ranked_de}")
    print(f"    Has .de: {has_de}, No .cn: {not has_cn}")

    # Test Chinese user: keeps .cn, filters .de
    print("\n--- Rank URLs: Chinese user (keeps .cn, filters .de) ---")
    ranked_cn = _rank_urls(urls, analysis, max_urls=4, user_language="Chinese")

    has_de = any(".de" in u for u in ranked_cn)
    has_cn = any(".cn" in u for u in ranked_cn)
    ok = not has_de and has_cn
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] Chinese user: {ranked_cn}")
    print(f"    No .de: {not has_de}, Has .cn: {has_cn}")

    print(f"\nURL filtering results: {passed} passed, {failed} failed")
    return failed


# ═══════════════════════════════════════════════════════════════
# Part 4: Report Builder
# ═══════════════════════════════════════════════════════════════

def test_report_builder():
    print("\n" + "=" * 60)
    print("PART 4: Report Builder")
    print("=" * 60)

    from src.backend.smart_pipeline.analyzer import analyze_task
    from src.backend.smart_pipeline.synthesizer import ScoredFact, SynthesisResult
    from src.backend.smart_pipeline.report_builder import build_report

    passed = 0
    failed = 0

    analysis = analyze_task("Research Tesla Inc", "Research Tesla Inc")

    facts_general = [
        ScoredFact(text=f"General fact {i} about Tesla operations.", score=2.0,
                   source_url="https://example.com/tesla", section="General")
        for i in range(10)
    ]
    facts_overview = [
        ScoredFact(text="Tesla Inc is an electric vehicle manufacturer.", score=5.0,
                   source_url="https://en.wikipedia.org/wiki/Tesla", section="Overview"),
    ]
    facts_search = [
        ScoredFact(text="Tesla search snippet result.", score=2.0,
                   source_url="search-1", section="General"),
    ]

    synthesis = SynthesisResult(
        sections={
            "Overview": facts_overview,
            "General": facts_general + facts_search,
        },
        total_facts=12,
        sources=["https://en.wikipedia.org/wiki/Tesla", "https://example.com/tesla", "search-1", "search-2"],
    )

    report = build_report("Tesla Inc Research Report", analysis, synthesis)

    # Check: search-N not in Sources section
    sources_section = report.split("## Sources")[1] if "## Sources" in report else ""
    has_search_ref = "search-1" in sources_section or "search-2" in sources_section
    ok = not has_search_ref
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] search-N hidden from Sources: {not has_search_ref}")

    # Check: General section capped at 5
    general_section = ""
    if "## General" in report:
        parts = report.split("## General")[1]
        next_section = parts.find("\n## ")
        if next_section > 0:
            general_section = parts[:next_section]
        else:
            general_section = parts
    general_bullets = general_section.count("\n- ")
    ok = general_bullets <= 5
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] General section capped: {general_bullets} items (max 5)")

    # Check: source count in summary excludes search-N
    ok = "from 2 sources" in report
    status = "PASS" if ok else "FAIL"
    if ok:
        passed += 1
    else:
        failed += 1
    print(f"  [{status}] Source count excludes search-N: {'from 2 sources' in report}")

    print(f"\nReport builder results: {passed} passed, {failed} failed")
    return failed


# ═══════════════════════════════════════════════════════════════
# Part 5: Smart Reader — Live URL Fetch Tests
# ═══════════════════════════════════════════════════════════════

def test_smart_reader_live():
    print("\n" + "=" * 60)
    print("PART 5: Smart Reader — Live Fetch Tests")
    print("=" * 60)

    try:
        from src.backend.tools.smart_reader import smart_read_page, _language_matches
    except (ImportError, ModuleNotFoundError) as e:
        print(f"  [SKIP] Cannot import smart_reader: {e}")
        return 0

    passed = 0
    failed = 0

    # Test 5a: Language matching logic (offline)
    print("\n--- 5a: Language matching logic ---")
    lang_tests = [
        ("en", "English", True, "English page + English pref"),
        ("en-US", "English", True, "en-US page + English pref"),
        ("de", "English", False, "German page + English pref"),
        ("de", "German", True, "German page + German pref"),
        ("zh-CN", "Chinese", True, "Chinese page + Chinese pref"),
        ("zh-CN", "English", False, "Chinese page + English pref"),
        ("fr", "French", True, "French page + French pref"),
        ("", "English", True, "No lang attr + English pref (pass through)"),
    ]
    for page_lang, user_lang, expected, label in lang_tests:
        result = _language_matches(page_lang, user_lang)
        ok = result == expected
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] {label}: match={result}")

    # Test 5b: Live fetch — English Wikipedia (should have metadata + content)
    print("\n--- 5b: Live fetch — English Wikipedia ---")
    try:
        result = smart_read_page("https://en.wikipedia.org/wiki/Tesla,_Inc.", user_language="English")
        has_metadata = "## Metadata" in result
        has_content = "## Content" in result
        not_skipped = not result.startswith("[SKIPPED]")

        ok = has_metadata and has_content and not_skipped
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] Wikipedia Tesla: metadata={has_metadata}, content={has_content}, not_skipped={not_skipped}")
        print(f"    Output length: {len(result)} chars")
        # Show first 200 chars of content
        if has_content:
            content_start = result.split("## Content")[1][:200]
            print(f"    Content preview: {content_start.strip()[:150]}...")
    except Exception as e:
        failed += 1
        print(f"  [FAIL] Wikipedia fetch error: {e}")

    # Test 5c: Live fetch — German page should be SKIPPED for English user
    print("\n--- 5c: Live fetch — German page (should skip for English user) ---")
    try:
        result = smart_read_page("https://de.wikipedia.org/wiki/Tesla,_Inc.", user_language="English")
        ok = result.startswith("[SKIPPED]")
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] German Wikipedia skipped: {result[:100]}")
    except Exception as e:
        failed += 1
        print(f"  [FAIL] German fetch error: {e}")

    # Test 5d: Live fetch — German page ALLOWED for German user
    print("\n--- 5d: Live fetch — German page (allowed for German user) ---")
    try:
        result = smart_read_page("https://de.wikipedia.org/wiki/Tesla,_Inc.", user_language="German")
        not_skipped = not result.startswith("[SKIPPED]")
        has_content = "## Content" in result or "## Metadata" in result
        ok = not_skipped and has_content
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] German Wikipedia for German user: not_skipped={not_skipped}, has_content={has_content}")
        print(f"    Output length: {len(result)} chars")
    except Exception as e:
        failed += 1
        print(f"  [FAIL] German (German user) fetch error: {e}")

    # Test 5e: Live fetch — structured metadata extraction (use Wikipedia which is reliable)
    print("\n--- 5e: Metadata extraction quality (Wikipedia) ---")
    try:
        result = smart_read_page("https://en.wikipedia.org/wiki/OpenAI", user_language="English")
        has_title = "**Title:**" in result
        has_any_meta = "## Metadata" in result
        ok = has_any_meta and has_title
        status = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  [{status}] Wikipedia OpenAI metadata: has_title={has_title}, has_metadata_section={has_any_meta}")
        if has_any_meta:
            meta_end = result.find("## Content")
            if meta_end == -1:
                meta_end = min(500, len(result))
            print(f"    Metadata: {result[:meta_end].strip()[:300]}")
    except Exception as e:
        failed += 1
        print(f"  [FAIL] Wikipedia fetch error: {e}")

    print(f"\nSmart reader results: {passed} passed, {failed} failed")
    return failed


# ═══════════════════════════════════════════════════════════════
# Part 6: Full end-to-end (optional, requires DB + network)
# ═══════════════════════════════════════════════════════════════

def test_full_pipeline():
    print("\n" + "=" * 60)
    print("PART 6: Full Pipeline (requires DB + network)")
    print("=" * 60)

    try:
        from src.backend.smart_pipeline.engine import run_smart_pipeline
    except (ImportError, ModuleNotFoundError) as e:
        print(f"  [SKIP] Cannot import engine: {e}")
        return

    tasks = [
        {"id": 9990, "title": "Research Tesla Inc",
         "description": "Research Tesla Inc funding, tech stack, leadership and recent product launches"},
        {"id": 9991, "title": "Compare React vs Vue",
         "description": "Compare React vs Vue for building modern web applications"},
    ]

    for task in tasks:
        print(f"\n--- Running: {task['title']} ---")
        try:
            run_smart_pipeline(task)
            print(f"  Completed: task {task['id']}")
        except Exception as e:
            print(f"  Error: {e}")


# ═══════════════════════════════════════════════════════════════
# Main
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    total_failures = 0

    # Always run offline tests
    total_failures += test_analyzer()
    total_failures += test_synthesizer()
    total_failures += test_url_filtering()
    total_failures += test_report_builder()

    # Live URL fetch tests (needs network, not DB)
    if "--live" in sys.argv or "--full" in sys.argv:
        total_failures += test_smart_reader_live()
    else:
        print("\n(Skipping live fetch tests. Pass --live to run them.)")

    # Full pipeline e2e (needs DB + network)
    if "--full" in sys.argv:
        test_full_pipeline()

    print("\n" + "=" * 60)
    if total_failures == 0:
        print("ALL TESTS PASSED")
    else:
        print(f"TOTAL FAILURES: {total_failures}")
    print("=" * 60)

    sys.exit(1 if total_failures > 0 else 0)
