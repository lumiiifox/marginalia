"""Exercise a private illustrated opening with invented paragraphs and a generated bitmap."""
import os
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from playwright.sync_api import sync_playwright


class Quiet(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(("127.0.0.1", int(os.getenv("MG_PORT", 0))), partial(Quiet, directory=root))
Thread(target=server.serve_forever, daemon=True).start()
origin = f"http://127.0.0.1:{server.server_port}"
def wait_ready(page):
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        if page.evaluate(ready):
            return
        page.wait_for_timeout(50)
    raise AssertionError("Reading database did not open")


ready = "typeof S !== 'undefined' && S.mode === 'ready' && !!idb"
with sync_playwright() as pw:
    browser = pw.chromium.launch()
    ctx = browser.new_context(viewport={"width": 360, "height": 740})
    page = ctx.new_page()
    requests = []
    page.on("request", lambda r: requests.append(r.url))
    page.goto(origin)
    wait_ready(page)
    raster = page.evaluate("""() => {
      const c = document.createElement('canvas'); c.width = 180; c.height = 240;
      const g = c.getContext('2d'); g.fillStyle = '#837454'; g.fillRect(10,10,100,200);
      return c.toDataURL('image/png');
    }""")
    # Only the two identifying metadata fields name the pilot. All displayed text is invented.
    html = f"""<title>Hyperpolitics</title><meta name="author" content="Anton Jäger">
    <section data-marginalia="title-page"><header><h1 data-role="book-title">Test Opening</h1>
    <p data-role="subtitle">An invented subtitle for a narrow screen</p></header>
    <figure data-role="title-artwork"><img alt="Test rectangle" src="{raster}"></figure>
    <p data-role="author">Test Author</p><hr><section data-role="publication-details">
    <p>Made for the <i>reader test</i>.</p><p data-role="copyright">Test credit</p></section></section>
    """ + "".join(f'<h2>Section {n}</h2><span role="doc-pagebreak" aria-label="{n}"></span><p>Test passage {n}.</p>' for n in range(1, 4))
    file = {"name": "reader-test.html", "mimeType": "text/html", "buffer": html.encode()}
    parse = "s => parseFile(new File([s],'test.html',{type:'text/html'}),()=>{})"
    page.evaluate(f"async src => {{ window.parsed = await ({parse})(src); }}", html)
    assert page.evaluate("parsed.sections.length === 3 && parsed.pages === 3 && parsed.blocks[2].openingArt.blob instanceof Blob")
    assert page.evaluate(f"async src => !(await ({parse})(src)).blocks.some(b=>b.openingRole)", html.replace("<title>Hyperpolitics", "<title>Other"))
    assert page.evaluate(f"async src => !(await ({parse})(src)).blocks.some(b=>b.openingArt)", html.replace(raster, "https://unused.invalid/picture"))
    assert all("unused.invalid" not in url for url in requests)
    assert page.evaluate(f"async src => (await ({parse})(src)).blocks[0].openingRole === 'book-title'", html.replace('<p data-role="subtitle">An invented subtitle for a narrow screen</p>', '').replace(f'<img alt="Test rectangle" src="{raster}">', ''))
    page.evaluate("""async () => {
      const plain = parsed.blocks.map(b => {
        if (!b.openingRole) return b;
        return {k:'p',x:b.x};
      });
      await put('texts','test-edition',{title:parsed.title,author:parsed.author,sections:parsed.sections,
        pos:7,hasContent:true,total:plain.length,bookmarks:[{at:7,page:'1'}],updatedAt:1});
      await put('content','test-edition',plain);
      await put('notes','test-note',{textId:'test-edition',kind:'passage',passage:'Test passage',at:7,page:'1',anchor:{a:7,ao:0,b:7,bo:12},updatedAt:1});
      window.original = await backupData();
      go({screen:'text',textId:'test-edition'});
    }""")
    page.click("#more")
    page.click("#m-opening")
    page.set_input_files("#opening-file", file)
    page.click("button[type=submit]")
    page.locator("#book .opening-art").wait_for()
    assert page.locator("#book .opening-art").evaluate("e=>e.complete && e.naturalWidth===180 && e.alt==='Test rectangle'")
    assert page.locator("#book .opening-publication em").inner_text() == "reader test"
    assert page.evaluate("""async () => {
      const now = await backupData(), id = 'test-edition', same = (a,b) => JSON.stringify(a)===JSON.stringify(b);
      return same(now.notes,original.notes) && same(now.texts[id].bookmarks,original.texts[id].bookmarks)
        && same(now.texts[id].sections,original.texts[id].sections) && now.texts[id].pos===7
        && same(now.content[id].map(b=>b.x),original.content[id].map(b=>b.x))
        && same(now.content[id].slice(5),original.content[id].slice(5));
    }""")
    for w, h, flow, tone, size in [(360, 740, "scroll", "paper", 20), (360, 740, "pages", "night", 32), (740, 360, "pages", "paper", 32)]:
        page.set_viewport_size({"width": w, "height": h})
        page.evaluate("([flow,tone,fs])=>{Object.assign(RS,{flow,tone,fs});applyFs();renderBook(0);layoutPages();}", [flow, tone, size])
        assert page.evaluate("""() => {
          const b = document.querySelector('#book'), get = cls => b.querySelector('.opening-'+cls);
          const css = el => getComputedStyle(el), fs = el => parseFloat(css(el).fontSize);
          return ['book-title','subtitle','author','publication','copyright'].every(k=>css(get(k)).textAlign==='center' && css(get(k)).textIndent==='0px' && css(get(k)).fontFamily===css(b).fontFamily)
            && +css(get('book-title')).fontWeight>=700 && fs(get('book-title'))>fs(get('subtitle'))
            && fs(get('publication'))<fs(b) && get('art').parentElement===get('author')
            && Math.abs(get('art').clientWidth/get('art').clientHeight-.75)<.02
            && get('art').getBoundingClientRect().width<b.clientWidth && !!get('rule');
        }""")
    page.evaluate("go({screen:'text',textId:'test-edition'})")
    page.click("#more"); page.click("#m-art")
    page.fill("input[name=left]", "20"); page.fill("#art-credit", "Invented art credit")
    page.click("button[type=submit]")
    page.locator("#book svg.opening-art").wait_for()
    backup = page.evaluate("backupData()")
    art = backup["content"]["test-edition"][2]["openingArt"]
    assert art["src"] == raster and art["crop"] == [20, 0, 0, 0]
    page.evaluate("go({screen:'text',textId:'test-edition'})")
    page.click("#more"); page.click("#m-art"); page.check("input[name=remove]"); page.click("button[type=submit]")
    page.locator("#book .opening-author").wait_for()
    assert page.locator("#book .opening-art").count() == 0
    fresh = browser.new_context()
    restored = fresh.new_page()
    restored.goto(origin); wait_ready(restored)
    fresh.set_offline(True)
    restored.evaluate("async d=>{await applyRestore(planRestore(d),false);await openReader('test-edition',0);}", backup)
    assert restored.locator("#book svg.opening-art").get_attribute("aria-label") == "Invented art credit"
    assert restored.evaluate("async ()=>(await backupData()).content['test-edition'][2].openingArt.src") == raster
    browser.close()
server.shutdown()
print("all passed")
