import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const candidates =
  process.platform === "win32"
    ? [
        "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      ]
    : ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"];

async function findBrowser(explicit) {
  for (const file of explicit ? [explicit] : candidates) {
    try {
      await access(file);
      return file;
    } catch {}
  }
  throw new Error("Chrome, Chromium ou Edge não encontrado; use --browser <arquivo>");
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function json(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CDP respondeu HTTP ${response.status}`);
  return response.json();
}

async function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  let sequence = 0;
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });
  return {
    call(method, params = {}) {
      const id = ++sequence;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close() {
      socket.close();
    },
  };
}

const extractionExpression = `(() => {
  const clean = value => String(value || '').replace(/\\u00a0/g, ' ').replace(/\\s+/g, ' ').trim();
  const directLinks = [...document.querySelectorAll('a')].filter(a => /modalAberto/i.test(a.href || a.outerHTML));
  const coinImages = [...document.querySelectorAll('img')].filter(img =>
    /cedulas.{0,20}moedas|moedasemitidas|moedas_emitidas/i.test(img.currentSrc || img.src || '')
  );
  const links = directLinks.length
    ? directLinks
    : coinImages.map(img => img.closest('a,button,[role="button"]') || img);
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')];
  const headingsBefore = (element) => {
    return headings
      .filter(h => (h.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING))
      .map(h => ({level:Number(h.tagName.slice(1)), text:clean(h.textContent)}));
  };
  return links.map((link, index) => {
    const href = link.href || '';
    const url = new URL(href && !href.startsWith('javascript:') ? href : location.href, location.href);
    const encoded = (link.outerHTML.match(/modalAberto(?:=|%3D)([^"'&\\s>]+)/i) || [])[1];
    const ownImage = link.matches?.('img') ? link : link.querySelector?.('img');
    const imageKey = (ownImage?.currentSrc || ownImage?.src || '').split('/').pop()?.replace(/\\.[^.]+$/, '') || '';
    const modalKey = url.searchParams.get('modalAberto') || (encoded ? decodeURIComponent(encoded) : '') || imageKey;
    if (modalKey && !url.searchParams.has('modalAberto')) {
      url.searchParams.set('modalAberto', modalKey);
    }
    const candidates = [...document.querySelectorAll('bcb-modal,[role="dialog"],.modal')];
    const modal = document.getElementById(modalKey) ||
      candidates.find(el => el.outerHTML.includes(modalKey)) ||
      (candidates.length === links.length ? candidates[index] : null);
    const scope = modal || link.closest('article,section,li,div') || link;
    const fields = {};
    for (const row of scope.querySelectorAll('tr')) {
      const cells = [...row.querySelectorAll('th,td')].map(cell => clean(cell.textContent));
      if (cells.length > 1 && cells[0]) fields[cells[0]] = cells.slice(1).join(' / ');
    }
    const image = ownImage || scope.querySelector?.('img') || link.closest('div')?.querySelector('img');
    const text = clean(scope.textContent);
    const part = label => {
      const match = text.match(new RegExp(label + '\\\\s*:?\\\\s*(.*?)(?=Anverso|Reverso|$)', 'i'));
      return match ? clean(match[1]) : '';
    };
    const previous = headingsBefore(link);
    const ancestors = [...link.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => clean(h.textContent));
    const systemIndex = previous.findLastIndex(({text}) =>
      /(?:^|\\b)(?:real|r[eé]is|cruzeiro|cruzado)(?:\\b|$)/i.test(text) &&
      !/fam[ií]lia/i.test(text)
    );
    const monetarySystem = previous[systemIndex]?.text ||
      previous[previous.length - 1]?.text || ancestors[0] || 'Não identificado';
    const family = previous.slice(systemIndex + 1)
      .findLast(({text}) => /fam[ií]lia/i.test(text))?.text || '';
    return {
      modalKey,
      url: url.href,
      title: clean(link.getAttribute?.('title') || image?.alt || link.textContent || modalKey),
      monetarySystem,
      family,
      imageUrl: image?.currentSrc || image?.src || '',
      fields,
      obverse: part('Anverso'),
      reverse: part('Reverso')
    };
  });
})()`;

const detailExpression = `(() => {
  const clean = value => String(value || '').replace(/\\u00a0/g, ' ').replace(/\\s+/g, ' ').trim();
  const visible = element => {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' &&
      (element.offsetWidth > 0 || element.offsetHeight > 0);
  };
  const dialogs = [...document.querySelectorAll('bcb-modal,[role="dialog"],.modal')];
  const scope = dialogs.find(el => visible(el) && el.querySelector('table')) ||
    dialogs.find(el => el.querySelector('table')) || document;
  const fields = {};
  for (const row of scope.querySelectorAll('tr')) {
    const cells = [...row.querySelectorAll('th,td')].map(cell => clean(cell.textContent));
    if (cells.length > 1 && cells[0]) fields[cells[0]] = cells.slice(1).join(' / ');
  }
  const text = clean(scope.textContent);
  const part = label => {
    const match = text.match(new RegExp(label + '\\\\s*:?\\\\s*(.*?)(?=Anverso|Reverso|$)', 'i'));
    return match ? clean(match[1]) : '';
  };
  const image = scope.querySelector('img');
  return {
    title: clean(scope.querySelector('h1,h2,h3,h4,h5,.modal-title')?.textContent),
    imageUrl: image?.currentSrc || image?.src || '',
    fields,
    obverse: part('Anverso'),
    reverse: part('Reverso')
  };
})()`;

export async function captureRenderedPage({
  sourceUrl,
  browser,
  timeoutMs = 45000,
  maxItems = 0,
  monetarySystem,
}) {
  const executable = await findBrowser(browser);
  const port = 9223 + Math.floor(Math.random() * 500);
  const profile = join(tmpdir(), `my-coins-bcb-${process.pid}-${Date.now()}`);
  const child = spawn(
    executable,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--disable-background-networking",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore", windowsHide: true },
  );
  let cdp;
  try {
    const deadline = Date.now() + timeoutMs;
    let version;
    while (!version && Date.now() < deadline) {
      try {
        version = await json(`http://127.0.0.1:${port}/json/version`);
      } catch {
        await wait(150);
      }
    }
    if (!version) throw new Error("O navegador não iniciou dentro do tempo limite");
    const pages = await json(`http://127.0.0.1:${port}/json/list`);
    const page =
      pages.find((entry) => entry.type === "page" && entry.url === "about:blank") ||
      pages.find(
        (entry) => entry.type === "page" && !entry.url.startsWith("chrome-extension://"),
      );
    if (!page) throw new Error("Nenhuma aba controlável foi criada pelo navegador");
    cdp = await connectCdp(page.webSocketDebuggerUrl);
    await cdp.call("Page.enable");
    await cdp.call("Page.navigate", { url: sourceUrl });
    let items = [];
    while (Date.now() < deadline) {
      const result = await cdp.call("Runtime.evaluate", {
        expression: extractionExpression,
        returnByValue: true,
      });
      items = result.result?.value || [];
      if (items.length) {
        await wait(1200);
        const stable = await cdp.call("Runtime.evaluate", {
          expression: extractionExpression,
          returnByValue: true,
        });
        items = stable.result?.value || items;
        break;
      }
      await wait(300);
    }
    if (!items.length) {
      const diagnostics = await cdp.call("Runtime.evaluate", {
        expression:
          `JSON.stringify({url:location.href,title:document.title,` +
          `text:document.body?.innerText?.slice(0,120),anchors:document.links.length,` +
          `images:document.images.length,modals:document.querySelectorAll('bcb-modal,[role="dialog"],.modal').length})`,
        returnByValue: true,
      });
      throw new Error(
        `A página renderizou, mas nenhuma moeda foi encontrada. Estado: ${diagnostics.result?.value}`,
      );
    }
    const normalizedFilter = monetarySystem
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    const filtered = normalizedFilter
      ? items.filter((item) =>
          item.monetarySystem
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .includes(normalizedFilter),
        )
      : items;
    if (normalizedFilter && !filtered.length) {
      throw new Error(`Nenhuma moeda encontrada para o padrão "${monetarySystem}"`);
    }
    const selected = maxItems > 0 ? filtered.slice(0, maxItems) : filtered;
    for (const item of selected) {
      const amount = item.modalKey.match(/CrS(\d+)_00/i)?.[1];
      const label = amount ? `${amount} cruzeiros reais` : "";
      const clicked = await cdp.call("Runtime.evaluate", {
        expression: `(() => {
          const wanted = ${JSON.stringify(label.toLowerCase())};
          const sourceKey = ${JSON.stringify(item.modalKey)};
          const controls = [...document.querySelectorAll('button,a,[role="button"]')];
          const button = controls.find(element =>
            element.textContent.replace(/\\s+/g, ' ').trim().toLowerCase() === 'moeda de ' + wanted
          ) || controls.find(element => element.outerHTML.includes(sourceKey));
          if (!button) return false;
          button.click();
          return true;
        })()`,
        returnByValue: true,
      });
      if (!clicked.result?.value) continue;
      const itemDeadline = Math.min(deadline, Date.now() + 6000);
      while (Date.now() < itemDeadline) {
        const detail = await cdp.call("Runtime.evaluate", {
          expression: detailExpression,
          returnByValue: true,
        });
        const value = detail.result?.value;
        if (value && Object.keys(value.fields || {}).length) {
          item.title = value.title || item.title;
          item.imageUrl = value.imageUrl || item.imageUrl;
          item.fields = value.fields;
          item.obverse = value.obverse || item.obverse;
          item.reverse = value.reverse || item.reverse;
          break;
        }
        await wait(250);
      }
      await cdp.call("Runtime.evaluate", {
        expression: `(() => {
          const dialog = [...document.querySelectorAll('[role="dialog"],.modal')].find(element => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden' && element.querySelector('table');
          });
          const close = dialog?.querySelector('button.close,[data-dismiss="modal"],button[aria-label="Close"],button[aria-label="Fechar"]') ||
            [...(dialog?.querySelectorAll('button') || [])].find(button => /fechar|close/i.test(button.textContent));
          close?.click();
        })()`,
      });
      await wait(700);
    }
    return {
      schemaVersion: 1,
      sourceUrl,
      capturedAt: new Date().toISOString(),
      browser: executable,
      items: selected,
    };
  } finally {
    cdp?.close();
    child.kill();
  }
}
