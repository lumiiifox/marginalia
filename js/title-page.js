// Illustrated openings are opt-in for this edition. The owner supplies all text and artwork locally.
const hasIllustratedEdition = t => /^hyperpolitics(?:\s*:|$)/i.test(t?.title?.trim() || "") && norm(fold(t.author || "")) === "antonjager";
const OPENING_ROLES = new Set(["book-title", "subtitle", "author", "translator", "editor", "publication", "copyright"]);
const MAX_OPENING_URL = 2 * 1024 * 1024;
function localArtSource(src) {
  return typeof src === "string" && src.length <= MAX_OPENING_URL && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(src);
}
function artBlob(src) {
  const comma = src.indexOf(",");
  const bytes = Uint8Array.from(atob(src.slice(comma + 1)), ch => ch.charCodeAt(0));
  return new Blob([bytes], { type: src.slice(5, src.indexOf(";")) });
}
// Reject oversized bitmaps before decode. Only static PNG, JPEG and WebP headers are accepted.
function bitmapSize(bytes, type) {
  const d = new DataView(bytes.buffer), tag = i => String.fromCharCode(...bytes.subarray(i, i + 4));
  if (type === "image/png" && d.getUint32(0) === 0x89504e47 && d.getUint32(4) === 0x0d0a1a0a && tag(12) === "IHDR") {
    for (let i = 8; i + 12 <= bytes.length; i += 12 + d.getUint32(i)) {
      if (tag(i + 4) === "acTL") return [];
      if (tag(i + 4) === "IDAT") return [d.getUint32(16), d.getUint32(20)];
    }
  }
  if (type === "image/webp" && tag(0) === "RIFF" && tag(8) === "WEBP") {
    if (tag(12) === "VP8L" && bytes[20] === 0x2f) {
      const packed = d.getUint32(21, true);
      return [1 + (packed & 16383), 1 + ((packed >>> 14) & 16383)];
    }
    if (tag(12) === "VP8 ") return [d.getUint16(26, true) & 16383, d.getUint16(28, true) & 16383];
    if (tag(12) === "VP8X" && !(bytes[20] & 2)) {
      const size = i => 1 + bytes[i] + 256 * bytes[i + 1] + 65536 * bytes[i + 2];
      return [size(24), size(27)];
    }
  }
  if (type === "image/jpeg" && d.getUint16(0) === 0xffd8) {
    let i = 2;
    while (i + 4 < bytes.length && bytes[i++] === 0xff) {
      while (bytes[i] === 0xff) i++;
      const marker = bytes[i++], length = d.getUint16(i);
      if (length < 2 || i + length > bytes.length || marker === 0xda) return [];
      if ([0xc0, 0xc1, 0xc2].includes(marker)) return [d.getUint16(i + 5), d.getUint16(i + 3)];
      i += length;
    }
  }
  return [];
}
async function checkedArtwork(blob) {
  if (!blob.size || blob.size > MAX_OPENING_URL * .75) return null;
  let url;
  try {
    const [w, h] = bitmapSize(new Uint8Array(await blob.arrayBuffer()), blob.type);
    if (!(w > 0 && h > 0 && w * h <= 4000000)) return null;
    url = URL.createObjectURL(blob);
    const img = new Image();
    img.src = url;
    await img.decode();
    if (img.naturalWidth * img.naturalHeight !== w * h) return null;
    return { blob, width: img.naturalWidth, height: img.naturalHeight };
  } catch { return null; }
  finally { if (url) URL.revokeObjectURL(url); }
}
async function openingImage(src) {
  if (!localArtSource(src)) return null;
  try { return await checkedArtwork(artBlob(src)); } catch { return null; }
}
async function decodeOpeningArt(blocks) {
  const result = blocks.slice();
  for (const [i, b] of blocks.entries()) {
    if (!b.openingArt || b.openingArt.blob instanceof Blob) continue;
    const { src, crop, alt } = b.openingArt;
    const art = await openingImage(src);
    if (!art) throw new UErr("The title artwork could not be restored.");
    result[i] = { ...b, openingArt: { ...art, alt, ...(crop ? { crop } : {}) } };
  }
  return result;
}
const cropEdges = ["left", "top", "right", "bottom"];
function validCrop(c) {
  return Array.isArray(c) && c.length === 4 && c.every(v => Number.isInteger(v) && v >= 0 && v < 100)
    && c[0] + c[2] < 100 && c[1] + c[3] < 100;
}
// Remember the former presentation without copying its words, chapter ID or artwork.
function originalOpeningKind(b) {
  if (b.openingRole) return b.openingKind || "p";
  return b.k === "h" ? "h" + (b.l || 2) : b.k;
}
async function markImportedOpening(section, blocks) {
  const parts = [];
  for (const el of section.querySelectorAll("p,h1,h2,h3,h4,h5,h6")) {
    const role = el.dataset.role || (el.closest('[data-role="publication-details"]') ? "publication" : "");
    if (!OPENING_ROLES.has(role)) return;
    const from = [];
    domToBlocks(el, from);
    if (from.length !== 1 || from[0].x !== blocks[parts.length]?.x || blocks[parts.length].s || parts.length >= 64) return;
    parts.push(role);
  }
  const rank = { "book-title": 0, subtitle: 1, author: 2, translator: 3, editor: 3, publication: 4, copyright: 4 };
  if (parts[0] !== "book-title" || parts.filter(r => r === "book-title").length !== 1 ||
      parts.filter(r => r === "author").length !== 1 || parts.some((r, i) => i && rank[r] < rank[parts[i - 1]])) return;
  for (const [i, role] of parts.entries()) {
    blocks[i].openingKind = originalOpeningKind(blocks[i]);
    blocks[i].k = "front"; blocks[i].openingRole = role;
    delete blocks[i].l;
  }
  const img = section.querySelector('figure[data-role="title-artwork"] img');
  if (!img) return;
  const art = await openingImage(img.getAttribute("src"));
  if (art) blocks[parts.indexOf("author")].openingArt = { ...art, alt: (img.getAttribute("alt") || "").slice(0, 1000) };
}
function clearOpeningImage() {
  if (R.openingImage) URL.revokeObjectURL(R.openingImage.url);
  R.openingImage = null;
}
function openingHTML(b, i, marks) {
  const role = b.openingRole, art = b.openingArt;
  let before = "";
  if (role === "author" && art?.blob instanceof Blob) {
    if (R.openingImage?.blob !== art.blob) {
      clearOpeningImage();
      R.openingImage = { blob: art.blob, url: URL.createObjectURL(art.blob) };
    }
    before = `<img class="opening-art" src="${R.openingImage.url}" width="${Number(art.width)}" height="${Number(art.height)}" alt="${esc(art.alt)}">`;
    if (art.crop && validCrop(art.crop)) {
      const [left, top, right, bottom] = art.crop;
      const w = art.width * (100 - left - right) / 100, h = art.height * (100 - top - bottom) / 100;
      before = `<svg class="opening-art" role="img" aria-label="${esc(art.alt)}" viewBox="${art.width * left / 100} ${art.height * top / 100} ${w} ${h}" width="${w}" height="${h}"><image href="${R.openingImage.url}" width="${art.width}" height="${art.height}"/></svg>`;
    }
  }
  const detail = role === "publication" || role === "copyright";
  if (detail && !["publication", "copyright"].includes(R.blocks[i - 1]?.openingRole)) before = '<hr class="opening-rule">';
  const tag = role === "book-title" ? "h1" : "div";
  let html = inlineHTML(b.x, marks);
  if (detail && !html.includes('class="vs"')) html = html.replaceAll(" / ", VBR);
  return `<${tag} class="opening opening-${role}" data-i="${i}">${before}${html}${marginHTML(marks, b.x)}</${tag}>`;
}
// Read and write the current book in the same transaction. Only the matched front paragraphs change.
async function attachOpening(id, parsed) {
  const front = [];
  for (const b of parsed.blocks) { if (!b.openingRole) break; front.push(b); }
  if (!front.length || !hasIllustratedEdition(parsed)) throw new UErr("Choose the HTML with the illustrated title page.");
  if (!idb) throw new UErr("Local storage is unavailable. Reopen Marginalia to save the title page.");
  return editOpening(id, (old) => {
    if (!front.every((b, i) => old[i]?.x === b.x && ["p", "front", "h"].includes(old[i].k)
        && !old[i].s && !old[i].stj && !old[i].sth && (!old[i].st || old[i].st === "title"))) {
      throw new UErr("The opening paragraphs differ from this edition. Your book was kept.");
    }
    const next = old.slice();
    front.forEach((b, i) => {
      next[i] = { ...old[i], k: "front", openingKind: originalOpeningKind(old[i]), openingRole: b.openingRole };
      delete next[i].l;
      delete next[i].openingArt;
      if (b.openingArt) next[i].openingArt = b.openingArt;
    });
    return next;
  }, true);
}
async function editOpening(id, edit, showIllustrated = false) {
  let next, record, problem;
  await idbTx(["texts", "content"], store => {
    const t = store("texts").get(id), c = store("content").get(id);
    c.onsuccess = () => {
      const old = c.result;
      if (!hasIllustratedEdition(t.result) || !Array.isArray(old)) {
        problem = new UErr("This edition is unavailable."); return;
      }
      try { next = edit(old, t.result); } catch (e) { problem = e; return; }
      record = { ...t.result, openingRevision: gid(), updatedAt: Date.now() };
      if (showIllustrated) delete record.openingPlain;
      store("content").put(next, id); store("texts").put(record, id);
    };
  });
  if (problem) throw problem;
  S.content.set(id, next); S.texts.set(id, record); render();
}
async function setOpeningPlain(id, plain) {
  let record;
  await idbDo("texts", store => {
    const request = store.get(id);
    request.onsuccess = () => {
      if (!hasIllustratedEdition(request.result) || !request.result.openingRevision) return;
      record = { ...request.result, updatedAt: Date.now() };
      if (plain) record.openingPlain = true;
      else delete record.openingPlain;
      store.put(record, id);
    };
  });
  if (!record) throw new UErr("This illustrated title page is unavailable.");
  S.texts.set(id, record);
  go({ screen: "reader", textId: id, at: 0 });
}
function openingSheet(id) {
  openSheet('<h2>Apply illustrated title page</h2><p class="hint">Choose your illustrated HTML for this edition. Only the matching opening paragraphs are updated.</p><div class="field"><label for="opening-file">Book HTML</label><input id="opening-file" type="file" name="opening" required accept=".html,.htm,.xhtml"></div>', async fd => {
    const f = fd.get("opening");
    if (!f?.size) return "Choose the illustrated HTML first.";
    await attachOpening(id, await parseFile(f, () => {}));
    return () => go({ screen: "reader", textId: id, at: 0 });
  });
}

async function artworkSheet(id) {
  const t = S.texts.get(id), blocks = await loadContent(id);
  const art = blocks?.find(b => b.openingRole === "author")?.openingArt;
  const fields = cropEdges.map((edge, i) => `<label>${edge[0].toUpperCase() + edge.slice(1)} (%)<input name="${edge}" type="number" min="0" max="99" value="${art?.crop?.[i] || 0}"></label>`).join("");
  openSheet(`<h2>Title-page artwork</h2><div class="field"><label for="art-file">Choose a local image</label><input type="file" id="art-file" name="image" accept="image/png,image/jpeg,image/webp"></div>
    <p class="hint">JPEG, PNG or WebP, up to 1.5 MiB and 4 megapixels. The shelf cover is separate.</p>
    <div class="field"><label for="art-credit">Image description and credit</label><input id="art-credit" name="alt" maxlength="1000" value="${esc(art?.alt || "")}"></div>
    <fieldset><legend>Crop from each edge</legend><div class="opening-crop">${fields}</div></fieldset>
    ${art ? '<label><input type="checkbox" name="remove"> Remove interior artwork</label>' : ""}`, async fd => {
    const crop = cropEdges.map(edge => Number(fd.get(edge)));
    if (!validCrop(crop)) return "Leave part of the photograph visible. Enter whole percentages.";
    let image = art;
    if (fd.has("remove")) image = null;
    else {
      const file = fd.get("image");
      if (file?.size) image = await checkedArtwork(file);
      if (!image) return "Choose a supported local image within the size limits.";
      image = { ...image, alt: String(fd.get("alt") || "").slice(0, 1000), crop };
    }
    await editOpening(id, (current, record) => {
      if (record.openingRevision !== t.openingRevision) throw new UErr("The title page changed. Reopen artwork settings.");
      const at = current.findIndex(b => b.openingRole === "author");
      if (at < 0) throw new UErr("Apply an illustrated title page first.");
      const next = current.slice();
      next[at] = { ...next[at] };
      if (image) next[at].openingArt = image; else delete next[at].openingArt;
      return next;
    });
    return () => go({ screen: "reader", textId: id, at: 0 });
  });
}
