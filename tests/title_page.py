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


def switch_layout(page, label):
    page.evaluate("go({screen:'text',textId:'test-edition'})")
    page.click("#more")
    page.get_by_role("button", name=label, exact=True).click()


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
    second = html.replace("<title>Hyperpolitics", "<title>Zeros + Ones").replace('content="Anton Jäger"', 'content="Sadie Plant"')
    assert page.evaluate(f"async src => (await ({parse})(src)).blocks[2].openingArt.blob instanceof Blob", second)
    assert page.evaluate(f"async src => !(await ({parse})(src)).blocks.some(b=>b.openingRole)", second.replace('content="Sadie Plant"', 'content="Different author"'))
    assert all("unused.invalid" not in url for url in requests)
    assert page.evaluate(f"async src => (await ({parse})(src)).blocks[0].openingRole === 'book-title'", html.replace('<p data-role="subtitle">An invented subtitle for a narrow screen</p>', '').replace(f'<img alt="Test rectangle" src="{raster}">', ''))
    assert page.evaluate(f"""async src => {{
      const p = await ({parse})(src);
      const parts = p.blocks.filter(b => b.openingRole === 'copyright');
      return parts.length >= 2 && parts.at(-1).x.endsWith('Lastword.');
    }}""", html.replace('Test credit','Test credit ' * 4200 + 'Lastword.'))
    page.evaluate("""async () => {
      const plain = parsed.blocks.map(b => {
        if (!b.openingRole) return b;
        return {k:'p',x:b.x};
      });
      await put('texts','test-edition',{title:parsed.title,author:parsed.author,sections:parsed.sections,
        pos:7,hasContent:true,total:plain.length,bookmarks:[{at:7,page:'1'}],updatedAt:1});
      await put('content','test-edition',plain);
      await put('notes','test-note',{textId:'test-edition',kind:'passage',passage:'Test passage',at:7,page:'1',anchor:{a:7,ao:0,b:7,bo:12},updatedAt:1});
      await put('notes','opening-note',{textId:'test-edition',kind:'passage',passage:'Opening',at:0,anchor:{a:0,ao:5,b:0,bo:12},updatedAt:1});
      await put('mastery','test-term',{met:1});
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
      return same(now.mastery,original.mastery) && same(now.notes,original.notes) && same(now.texts[id].bookmarks,original.texts[id].bookmarks)
        && same(now.texts[id].sections,original.texts[id].sections) && now.texts[id].pos===7
        && same(now.content[id].map(b=>b.x),original.content[id].map(b=>b.x))
        && same(now.content[id].slice(5),original.content[id].slice(5));
    }""")
    assert page.locator("#book mark[data-note=opening-note]").text_content() == "Opening"
    assert page.locator("#book mark[data-note=test-note]").text_content() == "Test passage"
    assert page.evaluate("R.pageAt[7] === '1' && R.secAt[7] === parsed.sections[0].id")
    assert page.evaluate("""async () => {
      const bad = structuredClone(parsed); bad.blocks[0].x += ' changed';
      const before = await backupData();
      try { await attachOpening('test-edition',bad); return false; }
      catch { const after = await backupData(); return JSON.stringify(before.content) === JSON.stringify(after.content)
        && JSON.stringify(before.texts) === JSON.stringify(after.texts); }
    }""")
    switch_layout(page, "Use plain title page")
    page.wait_for_selector("#book p.bp[data-i='0']")
    assert page.locator("#book .opening").count() == 0
    assert page.locator("#book mark[data-note=opening-note]").text_content() == "Opening"
    assert page.evaluate("async () => (await backupData()).texts['test-edition'].openingPlain === true")
    switch_layout(page, "Restore illustrated title page")
    page.wait_for_selector("#book .opening-art")
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
    # A prior app may have restored the transport form to IndexedDB. Re-open and export that copy.
    restored.evaluate("""async data => {
      const b = data.content['test-edition'];
      await idbDo('content', s => s.put(b,'test-edition'));
      S.content.delete('test-edition');
      await openReader('test-edition',0);
    }""", backup)
    assert restored.evaluate("async ()=>(await backupData()).content['test-edition'][2].openingArt.src") == raster
    assert restored.locator("#book svg.opening-art").count() == 1
    # Deliberately span many columns. Measure real text ranges, including the final word of the credits.
    title = 'Bookkeeping' * 12
    subtitle = 'A long subtitle from the synthetic press ' * 9
    credit = 'This sentence forms part of the synthetic publication details. ' * 64 + 'Endmarker.'
    stress = html.replace('Test Opening',title).replace('An invented subtitle for a narrow screen',subtitle).replace('Test credit',credit)
    for w,h,fs,tone,font in [(320,568,44,'night','monospace'),(740,360,36,'sepia','sans-serif'),(820,1180,24,'paper','serif')]:
        restored.set_viewport_size({"width":w,"height":h})
        restored.evaluate(f"""async ([src,fs,tone,font]) => {{
          const p = await ({parse})(src);
          const id = 'stress';
          await saveNewText(id,{{title:p.title, author:p.author, hasContent:true, sections:p.sections}},p.blocks,null,null);
          document.documentElement.style.setProperty('--f-text',font);
          Object.assign(RS,{{flow:'pages',fs,tone}}); await openReader(id,0);
        }}""", [stress,fs,tone,font])
        restored.wait_for_timeout(100)
        geometry = restored.evaluate("""() => {
          const book = document.querySelector('#book'), results = [];
          setPage(0);
          const left = book.getBoundingClientRect().left;
          const stride = pageStride(), style = getComputedStyle(book), pad = parseFloat(style.paddingLeft);
          for (const node of book.querySelectorAll('.opening')) {
            const walk = document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
            while (walk.nextNode()) {
              const r = document.createRange(); r.selectNodeContents(walk.currentNode);
              for (const line of r.getClientRects()) {
                if (!line.width) continue;
                const col = Math.floor((line.x + 1 - left)/stride), x = line.x-left-col*stride;
                if (col < 0 || col > lastPage() || x < pad-2 || x+line.width > stride-pad+2 ||
                    line.top < book.getBoundingClientRect().top-2 || line.bottom > book.getBoundingClientRect().bottom+2) {
                  results.push([node.className,col,x,line.width,line.y,line.height]);
                }
              }
            }
          }
          const art = book.querySelector('.opening-art').getBoundingClientRect();
          const mid = (art.x-left+art.width/2)%stride;
          const credits = book.querySelector('.opening-copyright');
          const r = document.createRange(); r.selectNodeContents(credits); const lines=[...r.getClientRects()];
          const finalColumn = Math.floor((lines.at(-1).x-left+1)/stride);
          setPage(finalColumn);
          return {issues:results.slice(0,3),center:Math.abs(mid-stride/2),pages:lastPage()+1,
            reachesEnd:credits.textContent.endsWith('Endmarker.') && currentPage()===finalColumn,
            font:getComputedStyle(credits).fontFamily};
        }""")
        assert not geometry["issues"] and geometry["center"] < 2 and geometry["reachesEnd"] and geometry["pages"] > 1 and geometry["font"] == font, geometry
    browser.close()
server.shutdown()
print("all passed")
