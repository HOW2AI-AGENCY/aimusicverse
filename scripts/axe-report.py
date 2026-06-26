import asyncio, json
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path("axe-report"); OUT.mkdir(exist_ok=True)
ROUTES = ["/", "/library", "/pricing", "/auth", "/community", "/projects", "/rewards"]

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(headless=True)
        ctx = await b.new_context(viewport={"width":1280,"height":1800})
        page = await ctx.new_page()
        with open("/tmp/browser/axe/axe.min.js") as f:
            axe_src = f.read()
        all_results = {}
        summary = []
        for r in ROUTES:
            try:
                await page.goto(f"http://localhost:8080{r}", wait_until="networkidle", timeout=20000)
            except Exception as e:
                all_results[r] = {"error": str(e)}; continue
            await page.add_script_tag(content=axe_src)
            res = await page.evaluate("async () => await axe.run(document, {resultTypes:['violations']})")
            v = res.get("violations", [])
            all_results[r] = v
            for x in v:
                summary.append({
                    "route": r, "id": x["id"], "impact": x["impact"],
                    "nodes": len(x["nodes"]),
                    "targets": [n["target"] for n in x["nodes"][:5]],
                    "help": x.get("help",""),
                })
        (OUT/"axe-report.json").write_text(json.dumps(all_results, indent=2))
        counts = {"critical":0,"serious":0,"moderate":0,"minor":0}
        rows = []
        for s in summary:
            counts[s["impact"]] = counts.get(s["impact"], 0) + 1
            rows.append(
                "<tr><td>" + s["route"] + "</td>"
                + "<td class='imp-" + s["impact"] + "'>" + s["impact"] + "</td>"
                + "<td><code>" + s["id"] + "</code><br><small>" + s["help"] + "</small></td>"
                + "<td>" + str(s["nodes"]) + "</td>"
                + "<td><code>" + json.dumps(s["targets"]) + "</code></td></tr>"
            )
        style = (
            "body{font:14px/1.5 system-ui;margin:24px;color:#111}"
            "table{border-collapse:collapse;width:100%}"
            "td,th{border:1px solid #ddd;padding:6px 8px;vertical-align:top;text-align:left}"
            ".imp-critical{color:#b00;font-weight:600}.imp-serious{color:#c50}"
            ".imp-moderate{color:#a60}.imp-minor{color:#666}"
            "code{font:12px ui-monospace,monospace}"
            ".s{display:flex;gap:16px;margin:12px 0}"
            ".s div{padding:8px 12px;background:#f3f4f6;border-radius:6px}"
        )
        body_rows = "".join(rows) if rows else "<tr><td colspan=5>No violations</td></tr>"
        html = (
            "<!doctype html><meta charset=utf-8><title>axe-core report</title>"
            "<style>" + style + "</style>"
            "<h1>axe-core accessibility report</h1>"
            "<p>Routes scanned: " + str(len(ROUTES)) + ". Total violations: " + str(len(summary)) + ".</p>"
            "<div class=s>"
            "<div><b>Critical:</b> " + str(counts["critical"]) + "</div>"
            "<div><b>Serious:</b> " + str(counts["serious"]) + "</div>"
            "<div><b>Moderate:</b> " + str(counts["moderate"]) + "</div>"
            "<div><b>Minor:</b> " + str(counts["minor"]) + "</div>"
            "</div>"
            "<table><thead><tr><th>Route</th><th>Impact</th><th>Rule</th><th>Nodes</th>"
            "<th>Targets (first 5)</th></tr></thead><tbody>"
            + body_rows + "</tbody></table>"
        )
        (OUT/"axe-report.html").write_text(html)
        print(json.dumps(counts))
        await b.close()

asyncio.run(main())
