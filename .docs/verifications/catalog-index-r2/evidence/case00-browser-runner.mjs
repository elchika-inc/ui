import { spawn } from "node:child_process";
import {
  createWriteStream,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = process.cwd();
const evidence = resolve(root, ".docs/verifications/catalog-index-r2/evidence");
const baseUrl = process.env.CATALOG_BASE_URL ?? "http://127.0.0.1:3193";
const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const expectedNames = readdirSync(join(root, "src/previews"))
  .filter((name) => name.endsWith(".tsx"))
  .map((name) => name.replace(/\.tsx$/, ""))
  .sort();
const expectedRoutes = [
  "/catalog/",
  "/catalog-dark/",
  ...expectedNames.flatMap((name) => [`/preview/${name}/`, `/preview/${name}-dark/`]),
];

const writeJson = (name, value) =>
  writeFileSync(join(evidence, name), `${JSON.stringify(value, null, 2)}\n`);

class CdpConnection {
  constructor(url) {
    this.socket = new WebSocket(url);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async open() {
    await new Promise((resolveOpen, rejectOpen) => {
      this.socket.addEventListener("open", resolveOpen, { once: true });
      this.socket.addEventListener("error", rejectOpen, { once: true });
    });
    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(typeof event.data === "string" ? event.data : event.data.toString());
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) ?? []) listener(message);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    return new Promise((resolveSend, rejectSend) => {
      this.pending.set(id, { method, resolve: resolveSend, reject: rejectSend });
      this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  close() {
    this.socket.close();
  }
}

const delay = (milliseconds) => new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));

async function waitForFile(path, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      await delay(100);
    }
  }
  throw new Error(`${path} が ${timeoutMs}ms 以内に作成されなかった`);
}

async function waitForReady(cdp, sessionId) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const result = await cdp.send(
      "Runtime.evaluate",
      { expression: "document.readyState", returnByValue: true },
      sessionId,
    );
    if (result.result.value === "complete") {
      await delay(300);
      return;
    }
    await delay(100);
  }
  throw new Error("document.readyState=complete を待機できなかった");
}

async function evaluate(cdp, sessionId, expression, awaitPromise = false) {
  const result = await cdp.send(
    "Runtime.evaluate",
    { expression, awaitPromise, returnByValue: true },
    sessionId,
  );
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

async function captureFullPage(cdp, sessionId, name) {
  const metrics = await cdp.send("Page.getLayoutMetrics", {}, sessionId);
  const width = Math.ceil(metrics.cssContentSize.width);
  const height = Math.ceil(metrics.cssContentSize.height);
  const screenshot = await cdp.send(
    "Page.captureScreenshot",
    {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    },
    sessionId,
  );
  writeFileSync(join(evidence, name), Buffer.from(screenshot.data, "base64"));
}

async function collectStructure(cdp, sessionId) {
  return evaluate(
    cdp,
    sessionId,
    `(() => {
      const htmlStyle = getComputedStyle(document.documentElement);
      const main = document.querySelector("main");
      const mainStyle = getComputedStyle(main);
      const links = [...document.querySelectorAll("a")].map((link) => ({
        text: link.textContent.trim(),
        href: link.getAttribute("href"),
        absoluteUrl: link.href,
        section: link.closest("li")?.querySelector("h3")?.textContent?.trim() ?? null,
      }));
      return {
        title: document.title,
        lang: document.documentElement.lang,
        htmlClass: document.documentElement.className,
        counts: {
          main: document.querySelectorAll("main").length,
          navigation: document.querySelectorAll("nav").length,
          h1: document.querySelectorAll("h1").length,
          h2: document.querySelectorAll("h2").length,
          h3: document.querySelectorAll("h3").length,
          link: links.length,
        },
        headings: [...document.querySelectorAll("h1,h2,h3")].map((heading) => ({
          level: Number(heading.tagName.slice(1)),
          text: heading.textContent.trim(),
          id: heading.id || null,
        })),
        navigations: [...document.querySelectorAll("nav")].map((navigation) => {
          const labelledBy = navigation.getAttribute("aria-labelledby");
          return {
            labelledBy,
            accessibleName: labelledBy ? document.getElementById(labelledBy)?.textContent?.trim() : null,
            linkCount: navigation.querySelectorAll("a").length,
          };
        }),
        links,
        previewCards: [...document.querySelectorAll("nav[aria-labelledby=preview-heading] li")].map((item) => ({
          title: item.querySelector("h3")?.textContent?.trim() ?? null,
          hrefs: [...item.querySelectorAll("a")].map((link) => link.getAttribute("href")),
        })),
        scroll: {
          viewportWidth: window.innerWidth,
          documentClientWidth: document.documentElement.clientWidth,
          documentScrollWidth: document.documentElement.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          mainClientWidth: main.clientWidth,
          mainScrollWidth: main.scrollWidth,
          hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth ||
            document.body.scrollWidth > document.body.clientWidth || main.scrollWidth > main.clientWidth,
        },
        tokens: {
          colorScheme: htmlStyle.colorScheme,
          backgroundToken: htmlStyle.getPropertyValue("--background").trim(),
          foregroundToken: htmlStyle.getPropertyValue("--foreground").trim(),
          primaryToken: htmlStyle.getPropertyValue("--primary").trim(),
          ringToken: htmlStyle.getPropertyValue("--ring").trim(),
          computedMainBackground: mainStyle.backgroundColor,
          computedMainForeground: mainStyle.color,
        },
      };
    })()`,
  );
}

async function verifyLinks(cdp, sessionId) {
  return evaluate(
    cdp,
    sessionId,
    `(async () => Promise.all([...document.querySelectorAll("a")].map(async (link) => {
      const response = await fetch(link.href, { cache: "no-store" });
      const body = await response.text();
      const parsed = new DOMParser().parseFromString(body, "text/html");
      const title = parsed.title.trim();
      parsed.querySelectorAll("script,style").forEach((element) => element.remove());
      const visibleText = parsed.body.textContent.replace(/\\s+/g, " ").trim();
      const errorBody = /^(?:404|500|error|not found)\\b/i.test(title) ||
        /^(?:404|500|not found|internal server error|cannot get)\\b/i.test(visibleText);
      return {
        href: link.getAttribute("href"),
        finalUrl: response.url,
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get("content-type"),
        bodyLength: body.length,
        errorBody,
        title,
      };
    })))()`,
    true,
  );
}

async function verifyKeyboardFocus(cdp, sessionId, screenshotName) {
  await evaluate(
    cdp,
    sessionId,
    `(() => {
      window.scrollTo(0, 0);
      document.body.setAttribute("tabindex", "-1");
      document.body.focus();
      document.body.removeAttribute("tabindex");
      return document.activeElement.tagName;
    })()`,
  );
  const focused = [];
  for (let index = 0; index < expectedRoutes.length; index += 1) {
    await cdp.send(
      "Input.dispatchKeyEvent",
      { type: "rawKeyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 },
      sessionId,
    );
    await cdp.send(
      "Input.dispatchKeyEvent",
      { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 },
      sessionId,
    );
    await delay(50);
    focused.push(
      await evaluate(
        cdp,
        sessionId,
        `(() => {
          const element = document.activeElement;
          const style = getComputedStyle(element);
          return {
            index: ${index + 1},
            tagName: element.tagName,
            text: element.textContent?.trim() ?? null,
            href: element.getAttribute?.("href") ?? null,
            focusVisible: element.matches?.(":focus-visible") ?? false,
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
            outlineColor: style.outlineColor,
            boxShadow: style.boxShadow,
          };
        })()`,
      ),
    );
    if (index === 0) await captureFullPage(cdp, sessionId, screenshotName);
  }
  return focused;
}

const chromeProfile = mkdtempSync(join(tmpdir(), "catalog-index-r2-chrome-"));
const chromeLog = createWriteStream(join(evidence, "case00-chrome.log"), { flags: "w" });
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-client-side-phishing-detection",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-domain-reliability",
    "--disable-features=AutofillServerCommunication,CertificateTransparencyComponentUpdater,InterestFeedContentSuggestions,MediaRouter,NetworkTimeServiceQuerying,OptimizationHints,PrivacySandboxSettings4,Translate",
    "--disable-sync",
    "--host-resolver-rules=MAP * 0.0.0.0, EXCLUDE localhost",
    "--metrics-recording-only",
    "--no-pings",
    "--remote-debugging-port=0",
    `--user-data-dir=${chromeProfile}`,
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
chrome.stdout.pipe(chromeLog);
chrome.stderr.pipe(chromeLog);

let cdp;
let sessionId;
const checks = [];
const failures = [];
const check = (name, condition, actual) => {
  checks.push({ name, pass: Boolean(condition), actual });
  if (!condition) failures.push({ name, actual });
};

try {
  const activePort = await waitForFile(join(chromeProfile, "DevToolsActivePort"), 15_000);
  const [debugPort, websocketPath] = activePort.trim().split("\n");
  cdp = new CdpConnection(`ws://127.0.0.1:${debugPort}${websocketPath}`);
  await cdp.open();
  const target = await cdp.send("Target.createTarget", { url: "about:blank" });
  ({ sessionId } = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true }));
  await Promise.all([
    cdp.send("Page.enable", {}, sessionId),
    cdp.send("Runtime.enable", {}, sessionId),
    cdp.send("Network.enable", {}, sessionId),
    cdp.send("Log.enable", {}, sessionId),
    cdp.send("Accessibility.enable", {}, sessionId),
    cdp.send(
      "Emulation.setDeviceMetricsOverride",
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false },
      sessionId,
    ),
  ]);

  let modeState = null;
  cdp.on("Network.responseReceived", (message) => {
    if (message.sessionId !== sessionId || !modeState) return;
    const { response, type, requestId } = message.params;
    if (!response.url.startsWith(baseUrl)) return;
    modeState.networkResponses.push({
      requestId,
      url: response.url,
      status: response.status,
      mimeType: response.mimeType,
      type,
      fromDiskCache: response.fromDiskCache,
      fromServiceWorker: response.fromServiceWorker,
    });
  });
  cdp.on("Network.loadingFailed", (message) => {
    if (message.sessionId !== sessionId || !modeState) return;
    modeState.networkFailures.push({
      requestId: message.params.requestId,
      errorText: message.params.errorText,
      type: message.params.type,
      canceled: message.params.canceled,
    });
  });
  cdp.on("Runtime.consoleAPICalled", (message) => {
    if (message.sessionId !== sessionId || !modeState) return;
    modeState.console.push({
      source: "console",
      type: message.params.type,
      args: message.params.args.map((argument) => argument.value ?? argument.description ?? argument.type),
      timestamp: message.params.timestamp,
    });
  });
  cdp.on("Runtime.exceptionThrown", (message) => {
    if (message.sessionId !== sessionId || !modeState) return;
    modeState.console.push({
      source: "exception",
      type: "error",
      text: message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text,
      timestamp: message.params.timestamp,
    });
  });
  cdp.on("Log.entryAdded", (message) => {
    if (message.sessionId !== sessionId || !modeState) return;
    modeState.console.push({
      source: message.params.entry.source,
      type: message.params.entry.level,
      text: message.params.entry.text,
      url: message.params.entry.url,
      timestamp: message.params.entry.timestamp,
    });
  });

  const results = {};
  for (const mode of ["light", "forced-dark"]) {
    modeState = { networkResponses: [], networkFailures: [], console: [] };
    await cdp.send("Network.clearBrowserCache", {}, sessionId);
    const navigation = await cdp.send("Page.navigate", { url: `${baseUrl}/` }, sessionId);
    check(`${mode}: Page.navigate errorTextなし`, !navigation.errorText, navigation.errorText ?? null);
    await waitForReady(cdp, sessionId);
    if (mode === "forced-dark") {
      await evaluate(
        cdp,
        sessionId,
        `new Promise((resolve) => {
          document.documentElement.classList.add("dark");
          requestAnimationFrame(() => requestAnimationFrame(() => resolve(document.documentElement.className)));
        })`,
        true,
      );
    }

    const structure = await collectStructure(cdp, sessionId);
    const html = await evaluate(cdp, sessionId, "document.documentElement.outerHTML");
    const accessibility = await cdp.send("Accessibility.getFullAXTree", {}, sessionId);
    await captureFullPage(
      cdp,
      sessionId,
      mode === "light" ? "case01-light-index.png" : "case02-forced-dark-index.png",
    );
    const focus = await verifyKeyboardFocus(
      cdp,
      sessionId,
      mode === "light" ? "case05-light-focus.png" : "case06-forced-dark-focus.png",
    );
    const linkChecks = await verifyLinks(cdp, sessionId);
    await delay(500);

    const prefix = mode === "light" ? "case01-light" : "case02-forced-dark";
    writeFileSync(join(evidence, `${prefix}-dom.html`), `${html}\n`);
    writeJson(`${prefix}-accessibility.json`, accessibility);
    writeJson(`${prefix}-structure.json`, structure);
    writeJson(`${prefix}-focus.json`, focus);
    writeJson(`${prefix}-link-http.json`, linkChecks);
    writeJson(`${prefix}-console.json`, modeState.console);
    writeJson(`${prefix}-network.json`, {
      responses: modeState.networkResponses,
      loadingFailures: modeState.networkFailures,
    });

    const hrefs = structure.links.map((link) => link.href);
    const axNavigations = accessibility.nodes.filter((node) => node.role?.value === "navigation");
    const axLinks = accessibility.nodes.filter((node) => node.role?.value === "link");
    const consoleErrors = modeState.console.filter(
      (entry) => entry.type === "error" || entry.type === "assert" || entry.source === "exception",
    );
    const httpErrors = modeState.networkResponses.filter((response) => response.status >= 400);
    const focusRoutes = focus.map((item) => item.href);
    const visibleFocus = focus.every(
      (item) =>
        item.focusVisible &&
        ((item.outlineStyle !== "none" && item.outlineWidth !== "0px") || item.boxShadow !== "none"),
    );

    check(`${mode}: preview scan 6件`, expectedNames.length === 6, expectedNames);
    check(
      `${mode}: preview scan名一致`,
      JSON.stringify(expectedNames) ===
        JSON.stringify(["badge", "button", "dialog", "input", "sonner", "tabs"]),
      expectedNames,
    );
    check(`${mode}: リンク14件・route順一致`, JSON.stringify(hrefs) === JSON.stringify(expectedRoutes), hrefs);
    check(
      `${mode}: 構造 main1/nav2/h1=1/h2=2/h3=6/link14`,
      JSON.stringify(structure.counts) ===
        JSON.stringify({ main: 1, navigation: 2, h1: 1, h2: 2, h3: 6, link: 14 }),
      structure.counts,
    );
    check(
      `${mode}: navigation名`,
      JSON.stringify(structure.navigations) ===
        JSON.stringify([
          { labelledBy: "catalog-heading", accessibleName: "横断カタログ", linkCount: 2 },
          { labelledBy: "preview-heading", accessibleName: "隔離プレビュー", linkCount: 12 },
        ]),
      structure.navigations,
    );
    check(`${mode}: AX navigation 2`, axNavigations.length === 2, axNavigations.map((node) => node.name?.value));
    check(`${mode}: AX link 14`, axLinks.length === 14, axLinks.length);
    check(
      `${mode}: 14リンクHTTP 2xx・HTML・error bodyなし`,
      linkChecks.length === 14 &&
        linkChecks.every(
          (item) =>
            item.ok &&
            item.status >= 200 &&
            item.status < 300 &&
            item.contentType?.includes("text/html") &&
            !item.errorBody &&
            item.bodyLength > 0,
        ),
      linkChecks,
    );
    check(`${mode}: console errorなし`, consoleErrors.length === 0, consoleErrors);
    check(`${mode}: network loading failureなし`, modeState.networkFailures.length === 0, modeState.networkFailures);
    check(`${mode}: network HTTP 4xx/5xxなし`, httpErrors.length === 0, httpErrors);
    check(`${mode}: 横スクロールなし`, !structure.scroll.hasHorizontalScroll, structure.scroll);
    check(`${mode}: Tabで14リンク順次到達`, JSON.stringify(focusRoutes) === JSON.stringify(expectedRoutes), focusRoutes);
    check(`${mode}: 14リンクのfocus-visible可視`, visibleFocus, focus);
    results[mode] = { structure, focus, linkChecks, modeState };
  }

  check("light: html dark classなし", !results.light.structure.htmlClass.split(/\s+/).includes("dark"), results.light.structure.htmlClass);
  check(
    "forced-dark: html dark classあり",
    results["forced-dark"].structure.htmlClass.split(/\s+/).includes("dark"),
    results["forced-dark"].structure.htmlClass,
  );
  check("light: color-scheme light", results.light.structure.tokens.colorScheme === "light", results.light.structure.tokens);
  check(
    "forced-dark: color-scheme dark",
    results["forced-dark"].structure.tokens.colorScheme === "dark",
    results["forced-dark"].structure.tokens,
  );
  check(
    "light/dark token実計算色が切替",
    results.light.structure.tokens.computedMainBackground !==
      results["forced-dark"].structure.tokens.computedMainBackground &&
      results.light.structure.tokens.computedMainForeground !==
        results["forced-dark"].structure.tokens.computedMainForeground,
    {
      light: results.light.structure.tokens,
      forcedDark: results["forced-dark"].structure.tokens,
    },
  );
} catch (error) {
  failures.push({ name: "runner fatal error", actual: error.stack ?? String(error) });
} finally {
  const summary = {
    executedAt: new Date().toISOString(),
    baseUrl,
    expectedNames,
    expectedRoutes,
    checks,
    failures,
    pass: failures.length === 0,
  };
  writeJson("case07-verification-summary.json", summary);
  if (sessionId && cdp) {
    try {
      await cdp.send("Target.closeTarget", { targetId: (await cdp.send("Target.getTargets")).targetInfos.find((target) => target.type === "page" && target.url !== "about:blank")?.targetId });
    } catch {
      // 下記の Chrome プロセス終了をクリーンアップの backstop とする。
    }
  }
  cdp?.close();
  chrome.kill("SIGTERM");
  await delay(500);
  if (chrome.exitCode === null) chrome.kill("SIGKILL");
  chromeLog.end();
  rmSync(chromeProfile, { recursive: true, force: true });
}

process.exitCode = failures.length === 0 ? 0 : 1;
