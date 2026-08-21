import { spawn, spawnSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const reviewDir = dirname(dirname(fileURLToPath(import.meta.url)));
const evidenceDir = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const verifiedImplSha = "7116c97172241d2fc241fab75b35550c89362a54";
const baseUrl = new URL(process.env.BLOCKS_BASE_URL ?? "http://127.0.0.1:4321").origin;
const chromePath =
  process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const axeSourcePath = process.env.AXE_SOURCE_PATH;
const viewport = { width: 1512, height: 828, deviceScaleFactor: 1 };
const loginNames = Array.from({ length: 4 }, (_, index) => `login-${String(index + 2).padStart(2, "0")}`);
const signupNames = Array.from({ length: 5 }, (_, index) => `signup-${String(index + 1).padStart(2, "0")}`);
const sidebarNames = Array.from({ length: 16 }, (_, index) => `sidebar-${String(index + 1).padStart(2, "0")}`);
const targetNames = [...loginNames, ...signupNames, ...sidebarNames];
const themes = ["light", "dark"];
const routeSpecs = targetNames.flatMap((name) =>
  themes.map((theme) => ({
    name,
    theme,
    path: `/preview/${name}${theme === "dark" ? "-dark" : ""}/`,
    routeFile: join(
      repositoryRoot,
      "src/pages/preview",
      `${name}${theme === "dark" ? "-dark" : ""}.astro`,
    ),
  })),
);
const catalogSpecs = [
  { name: "catalog", theme: "light", path: "/catalog/" },
  { name: "catalog", theme: "dark", path: "/catalog-dark/" },
];
const expectedRouteCount = targetNames.length * themes.length;
const expectedTotalRouteCount = expectedRouteCount + catalogSpecs.length;
const runCommand =
  "BLOCKS_BASE_URL=http://127.0.0.1:4327 AXE_SOURCE_PATH=<一時axe-core>/axe.min.js node .docs/reviews/2026-08-21-blocks-phase2-final/evidence/case00-browser-runner.mjs";

rmSync(join(evidenceDir, "case00-fatal.log"), { force: true });

const writeJson = (name, value) =>
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`);

function fail(message) {
  throw new Error(message);
}

if (!/^https?:\/\/(?:127\.0\.0\.1|localhost)(?::\d+)?$/.test(baseUrl)) {
  fail(`BLOCKS_BASE_URL は認証情報なしのloopback HTTP(S) originに限定する: ${baseUrl}`);
}
if (!existsSync(chromePath)) fail(`Chrome executable が存在しない: ${chromePath}`);
if (!axeSourcePath || !existsSync(axeSourcePath)) {
  fail("AXE_SOURCE_PATH に一時導入した axe-core/axe.min.js の実在pathを指定する必要がある");
}

const registry = JSON.parse(readFileSync(join(repositoryRoot, "registry.json"), "utf8"));
const provenance = JSON.parse(readFileSync(join(repositoryRoot, "provenance.json"), "utf8"));
const previewSelectors = JSON.parse(
  readFileSync(join(repositoryRoot, "preview-selectors.json"), "utf8"),
);
const registryBlockNames = new Set(
  registry.items.filter((item) => item.type === "registry:block").map((item) => item.name),
);
const provenanceBlockNames = new Set(Object.keys(provenance.blocks ?? {}));
const derivation = {
  targetNames,
  targetCount: targetNames.length,
  themes,
  expectedRouteCount,
  expectedTotalRouteCount,
  missingRegistryBlocks: targetNames.filter((name) => !registryBlockNames.has(name)),
  missingProvenanceBlocks: targetNames.filter((name) => !provenanceBlockNames.has(name)),
  missingSelectors: targetNames.filter((name) => typeof previewSelectors[name] !== "string"),
  missingRouteFiles: routeSpecs.filter((route) => !existsSync(route.routeFile)).map((route) => route.routeFile),
};
writeJson("case00-target-derivation.json", derivation);

const preflightFailures = Object.entries(derivation)
  .filter(([key, value]) => key.startsWith("missing") && value.length > 0)
  .map(([key, value]) => `${key}: ${value.join(", ")}`);
if (routeSpecs.length !== expectedRouteCount) {
  preflightFailures.push(`route導出件数が不一致: ${routeSpecs.length}/${expectedRouteCount}`);
}

const axeSource = readFileSync(axeSourcePath, "utf8");
const chromeVersion = spawnSync(chromePath, ["--version"], { encoding: "utf8" }).stdout.trim();
const gitHead = spawnSync("git", ["rev-parse", "HEAD"], {
  cwd: repositoryRoot,
  encoding: "utf8",
}).stdout.trim();
if (gitHead !== verifiedImplSha) {
  preflightFailures.push(`HEADが検証対象SHAではない: ${gitHead} != ${verifiedImplSha}`);
}

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
  fail(`${path} が ${timeoutMs}ms 以内に作成されなかった`);
}

async function evaluate(cdp, sessionId, expression, awaitPromise = false) {
  const result = await cdp.send(
    "Runtime.evaluate",
    { expression, awaitPromise, returnByValue: true },
    sessionId,
  );
  if (result.exceptionDetails) {
    fail(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  }
  return result.result.value;
}

async function waitForExpression(cdp, sessionId, expression, description, timeoutMs = 20_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, sessionId, expression)) return;
    await delay(100);
  }
  fail(`${description} を ${timeoutMs}ms 以内に確認できなかった`);
}

async function pressKey(cdp, sessionId, key) {
  const values = {
    Tab: { key: "Tab", code: "Tab", keyCode: 9 },
    Enter: { key: "Enter", code: "Enter", keyCode: 13, text: "\r" },
    Escape: { key: "Escape", code: "Escape", keyCode: 27 },
    Space: { key: " ", code: "Space", keyCode: 32, text: " " },
  }[key];
  if (!values) fail(`未対応key: ${key}`);
  await cdp.send(
    "Input.dispatchKeyEvent",
    {
      type: "keyDown",
      key: values.key,
      code: values.code,
      windowsVirtualKeyCode: values.keyCode,
      nativeVirtualKeyCode: values.keyCode,
      ...((key === "Enter" || key === "Space")
        ? { text: values.text, unmodifiedText: values.text }
        : {}),
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchKeyEvent",
    {
      type: "keyUp",
      key: values.key,
      code: values.code,
      windowsVirtualKeyCode: values.keyCode,
      nativeVirtualKeyCode: values.keyCode,
    },
    sessionId,
  );
  await delay(120);
}

async function captureKeyboardResult(name, operation) {
  try {
    return await operation();
  } catch (error) {
    return {
      name,
      pass: false,
      error: error instanceof Error ? error.stack ?? error.message : String(error),
    };
  }
}

function eventState() {
  return {
    documentResponses: [],
    httpErrors: [],
    requestFailures: [],
    consoleErrors: [],
    pageErrors: [],
  };
}

async function createPage(cdp, states) {
  const { targetId } = await cdp.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await cdp.send("Target.attachToTarget", { targetId, flatten: true });
  const state = eventState();
  states.set(sessionId, state);
  await Promise.all([
    cdp.send("Page.enable", {}, sessionId),
    cdp.send("Runtime.enable", {}, sessionId),
    cdp.send("Network.enable", {}, sessionId),
    cdp.send("Log.enable", {}, sessionId),
  ]);
  await cdp.send(
    "Emulation.setDeviceMetricsOverride",
    {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: viewport.deviceScaleFactor,
      mobile: false,
    },
    sessionId,
  );
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", { source: axeSource }, sessionId);
  return { targetId, sessionId, state };
}

async function closePage(cdp, states, page) {
  states.delete(page.sessionId);
  await cdp.send("Target.closeTarget", { targetId: page.targetId });
}

async function navigateAndHydrate(cdp, page, path, selector) {
  const url = `${baseUrl}${path}`;
  const navigation = await cdp.send("Page.navigate", { url }, page.sessionId);
  if (navigation.errorText) fail(`${path}: navigate error: ${navigation.errorText}`);
  await waitForExpression(
    cdp,
    page.sessionId,
    "document.readyState === 'complete'",
    `${path}: document.readyState=complete`,
  );
  await waitForExpression(
    cdp,
    page.sessionId,
    `(() => { const element = document.querySelector(${JSON.stringify(selector)}); if (!element) return false; const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0; })()`,
    `${path}: selector可視 ${selector}`,
  );
  await delay(700);
}

async function captureScreenshot(cdp, sessionId, filename, fullPage) {
  let clip;
  if (fullPage) {
    const metrics = await cdp.send("Page.getLayoutMetrics", {}, sessionId);
    clip = {
      x: 0,
      y: 0,
      width: Math.ceil(metrics.cssContentSize.width),
      height: Math.ceil(metrics.cssContentSize.height),
      scale: 1,
    };
  } else {
    clip = { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 };
  }
  const result = await cdp.send(
    "Page.captureScreenshot",
    { format: "jpeg", quality: 88, fromSurface: true, captureBeyondViewport: fullPage, clip },
    sessionId,
  );
  const bytes = Buffer.from(result.data, "base64");
  if (!bytes.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) {
    fail(`${filename}: JPEG magic bytesではない`);
  }
  const path = join(evidenceDir, filename);
  writeFileSync(path, bytes);
  return { filename, bytes: bytes.length, width: clip.width, height: clip.height, dpr: 1 };
}

async function runAxe(cdp, sessionId) {
  return evaluate(
    cdp,
    sessionId,
    `(async () => {
      if (typeof axe === "undefined") throw new Error("axe global が無い");
      const result = await axe.run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
        },
        resultTypes: ["violations"],
      });
      return {
        testEngine: result.testEngine,
        testEnvironment: result.testEnvironment,
        testRunner: result.testRunner,
        testedTags: result.testedTags,
        violations: result.violations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map((node) => ({
            impact: node.impact,
            target: node.target,
            html: node.html.slice(0, 500),
            failureSummary: node.failureSummary,
          })),
        })),
      };
    })()`,
    true,
  );
}

async function collectPreviewFacts(cdp, sessionId, spec) {
  const selector = previewSelectors[spec.name];
  return evaluate(
    cdp,
    sessionId,
    `(() => {
      const selector = ${JSON.stringify(selector)};
      const matches = [...document.querySelectorAll(selector)];
      const visible = matches.filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      });
      const preview = visible[0];
      const html = document.documentElement;
      return {
        title: document.title,
        documentUrl: document.URL,
        selector,
        selectorCount: matches.length,
        visibleSelectorCount: visible.length,
        previewMode: preview?.getAttribute("data-preview-mode") ?? null,
        theme: {
          dataTheme: html.getAttribute("data-theme"),
          hasDarkClass: html.classList.contains("dark"),
          colorScheme: getComputedStyle(html).colorScheme,
        },
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        overflow: {
          documentClientWidth: html.clientWidth,
          documentScrollWidth: html.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          previewClientWidth: preview?.clientWidth ?? null,
          previewScrollWidth: preview?.scrollWidth ?? null,
          hasHorizontalOverflow:
            html.scrollWidth > html.clientWidth ||
            document.body.scrollWidth > document.body.clientWidth ||
            (preview ? preview.scrollWidth > preview.clientWidth : true),
        },
      };
    })()`,
  );
}

async function collectCatalogFacts(cdp, sessionId, theme) {
  const selectorMap = Object.fromEntries(
    targetNames.map((name) => [name, previewSelectors[name]]),
  );
  return evaluate(
    cdp,
    sessionId,
    `(() => {
      const selectorMap = ${JSON.stringify(selectorMap)};
      const visibility = Object.entries(selectorMap).map(([name, selector]) => {
        const matches = [...document.querySelectorAll(selector)];
        const visible = matches.filter((element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        });
        return {
          name,
          selector,
          count: matches.length,
          visibleCount: visible.length,
          inCatalog: visible.every((element) => Boolean(element.closest('[data-slot="verification-catalog"]'))),
          modes: visible.map((element) => element.getAttribute("data-preview-mode")),
        };
      });
      const idCounts = new Map();
      for (const element of document.querySelectorAll("[id]")) {
        idCounts.set(element.id, (idCounts.get(element.id) ?? 0) + 1);
      }
      const duplicateIds = [...idCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([id, count]) => ({ id, count }));
      const sidebarTen = document.querySelector('[data-slot="sidebar-10-preview"]');
      const actionsTrigger = sidebarTen?.querySelector('[aria-label="Open page actions"]');
      const html = document.documentElement;
      return {
        expectedSelectorCount: Object.keys(selectorMap).length,
        visibility,
        allSelectorsVisibleInSameDom: visibility.every((item) =>
          item.count >= 1 && item.visibleCount >= 1 && item.inCatalog && item.modes.every((mode) => mode === "catalog")
        ),
        totalIds: idCounts.size,
        duplicateIds,
        sidebar10: {
          triggerCount: sidebarTen?.querySelectorAll('[aria-label="Open page actions"]').length ?? 0,
          ariaExpanded: actionsTrigger?.getAttribute("aria-expanded") ?? null,
          ariaControls: actionsTrigger?.getAttribute("aria-controls") ?? null,
          matchingOpenOverlayCount: [...document.querySelectorAll('[data-slot="popover-content"]')]
            .filter((element) => /Customize Page/.test(element.textContent ?? "")).length,
        },
        theme: {
          expected: ${JSON.stringify(theme)},
          dataTheme: html.getAttribute("data-theme"),
          hasDarkClass: html.classList.contains("dark"),
          colorScheme: getComputedStyle(html).colorScheme,
        },
        viewport: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          devicePixelRatio: window.devicePixelRatio,
        },
        overflow: {
          documentClientWidth: html.clientWidth,
          documentScrollWidth: html.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          hasHorizontalOverflow:
            html.scrollWidth > html.clientWidth || document.body.scrollWidth > document.body.clientWidth,
        },
      };
    })()`,
  );
}

function assessCommon(spec, state, facts, axe, screenshot) {
  const criticalSerious = axe.violations.filter((violation) =>
    violation.impact === "critical" || violation.impact === "serious",
  );
  const documentResponse = state.documentResponses.find(
    (response) => new URL(response.url).pathname === spec.path,
  );
  const failures = [];
  if (!documentResponse || documentResponse.status !== 200) {
    failures.push(`Document 200ではない: ${JSON.stringify(documentResponse ?? null)}`);
  }
  if (state.pageErrors.length) failures.push(`pageerror ${state.pageErrors.length}`);
  if (state.consoleErrors.length) failures.push(`console error ${state.consoleErrors.length}`);
  if (state.httpErrors.length) failures.push(`HTTP 4xx/5xx ${state.httpErrors.length}`);
  if (state.requestFailures.length) failures.push(`requestfailure ${state.requestFailures.length}`);
  if (facts.theme.dataTheme !== spec.theme) failures.push(`data-theme不一致: ${facts.theme.dataTheme}`);
  if (facts.theme.hasDarkClass !== (spec.theme === "dark")) {
    failures.push(`dark class不一致: ${facts.theme.hasDarkClass}`);
  }
  if (facts.viewport.innerWidth !== viewport.width || facts.viewport.innerHeight !== viewport.height) {
    failures.push(`viewport不一致: ${facts.viewport.innerWidth}x${facts.viewport.innerHeight}`);
  }
  if (facts.viewport.devicePixelRatio !== viewport.deviceScaleFactor) {
    failures.push(`DPR不一致: ${facts.viewport.devicePixelRatio}`);
  }
  if (facts.overflow.hasHorizontalOverflow) failures.push("横overflowあり");
  if (criticalSerious.length) {
    failures.push(`axe critical/serious ${criticalSerious.length}`);
  }
  if (!screenshot || screenshot.bytes <= 0) failures.push("JPEGが無い");
  return { documentResponse, criticalSerious, failures };
}

async function verifyPreviewRoute(cdp, states, spec, caseNumber) {
  const page = await createPage(cdp, states);
  try {
    await navigateAndHydrate(cdp, page, spec.path, previewSelectors[spec.name]);
    const facts = await collectPreviewFacts(cdp, page.sessionId, spec);
    const axe = await runAxe(cdp, page.sessionId);
    const filename = `${spec.name}-case${String(caseNumber).padStart(2, "0")}-${spec.theme}.jpg`;
    const screenshot = await captureScreenshot(cdp, page.sessionId, filename, false);
    const assessment = assessCommon(spec, page.state, facts, axe, screenshot);
    if (facts.selectorCount < 1 || facts.visibleSelectorCount < 1) {
      assessment.failures.push(
        `preview selector不可視: ${facts.visibleSelectorCount}/${facts.selectorCount}`,
      );
    }
    if (facts.previewMode !== "isolated") {
      assessment.failures.push(`data-preview-mode不一致: ${facts.previewMode}`);
    }
    return {
      ...spec,
      url: `${baseUrl}${spec.path}`,
      facts,
      axe,
      screenshot,
      network: page.state,
      ...assessment,
      pass: assessment.failures.length === 0,
    };
  } catch (error) {
    return {
      ...spec,
      url: `${baseUrl}${spec.path}`,
      pass: false,
      failures: [error instanceof Error ? error.stack ?? error.message : String(error)],
      network: page.state,
    };
  } finally {
    await closePage(cdp, states, page);
  }
}

async function verifyCatalogRoute(cdp, states, spec, caseNumber) {
  const page = await createPage(cdp, states);
  try {
    await navigateAndHydrate(cdp, page, spec.path, '[data-slot="verification-catalog"]');
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelectorAll('[data-preview-mode="catalog"]').length >= ${targetNames.length}`,
      `${spec.path}: catalog preview hydration`,
    );
    const facts = await collectCatalogFacts(cdp, page.sessionId, spec.theme);
    const axe = await runAxe(cdp, page.sessionId);
    const filename = `catalog-case${String(caseNumber).padStart(2, "0")}-${spec.theme}.jpg`;
    const screenshot = await captureScreenshot(cdp, page.sessionId, filename, true);
    const assessment = assessCommon(spec, page.state, facts, axe, screenshot);
    if (!facts.allSelectorsVisibleInSameDom) assessment.failures.push("25 selectorが同一DOMで全可視ではない");
    if (facts.duplicateIds.length) assessment.failures.push(`重複id ${facts.duplicateIds.length}`);
    if (facts.sidebar10.triggerCount !== 1) {
      assessment.failures.push(`sidebar-10 actions trigger件数 ${facts.sidebar10.triggerCount}`);
    }
    if (facts.sidebar10.ariaExpanded !== "false") {
      assessment.failures.push(`sidebar-10 actionsが自動open: ${facts.sidebar10.ariaExpanded}`);
    }
    if (facts.sidebar10.matchingOpenOverlayCount !== 0) {
      assessment.failures.push(
        `sidebar-10 actions overlayがcatalogで存在: ${facts.sidebar10.matchingOpenOverlayCount}`,
      );
    }
    return {
      ...spec,
      url: `${baseUrl}${spec.path}`,
      facts,
      axe,
      screenshot,
      network: page.state,
      ...assessment,
      pass: assessment.failures.length === 0,
    };
  } catch (error) {
    return {
      ...spec,
      url: `${baseUrl}${spec.path}`,
      pass: false,
      failures: [error instanceof Error ? error.stack ?? error.message : String(error)],
      network: page.state,
    };
  } finally {
    await closePage(cdp, states, page);
  }
}

async function verifyAuthKeyboard(cdp, states) {
  const path = "/preview/login-02/";
  const page = await createPage(cdp, states);
  try {
    await navigateAndHydrate(cdp, page, path, previewSelectors["login-02"]);
    const before = await evaluate(
      cdp,
      page.sessionId,
      `(() => {
        const root = document.querySelector('[data-slot="login-02-preview"]');
        const labels = [...root.querySelectorAll('label[for]')].map((label) => {
          const target = document.getElementById(label.htmlFor);
          return {
            text: label.textContent.trim(),
            htmlFor: label.htmlFor,
            targetTag: target?.tagName ?? null,
            targetType: target?.getAttribute('type') ?? null,
            targetOwnsLabel: target ? [...target.labels].includes(label) : false,
          };
        });
        const tabbables = [...root.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
          .filter((element) => {
            const style = getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
          })
          .map((element) => ({
            tag: element.tagName,
            type: element.getAttribute('type'),
            text: element.textContent.trim(),
            ariaLabel: element.getAttribute('aria-label'),
            id: element.id || null,
            href: element.getAttribute('href'),
          }));
        document.body.setAttribute('tabindex', '-1');
        document.body.focus();
        document.body.removeAttribute('tabindex');
        return { labels, tabbables };
      })()`,
    );
    const observed = [];
    for (let index = 0; index < before.tabbables.length; index += 1) {
      await pressKey(cdp, page.sessionId, "Tab");
      observed.push(
        await evaluate(
          cdp,
          page.sessionId,
          `(() => {
            const element = document.activeElement;
            return {
              tag: element.tagName,
              type: element.getAttribute('type'),
              text: element.textContent.trim(),
              ariaLabel: element.getAttribute('aria-label'),
              id: element.id || null,
              href: element.getAttribute('href'),
            };
          })()`,
        ),
      );
    }
    const labelsPass =
      before.labels.length === 2 &&
      before.labels.every((label) => label.htmlFor && label.targetTag === "INPUT" && label.targetOwnsLabel);
    const tabOrderPass = JSON.stringify(before.tabbables) === JSON.stringify(observed);
    return {
      name: "login-02 auth form",
      path,
      labels: before.labels,
      expectedTabOrder: before.tabbables,
      observedTabOrder: observed,
      labelsPass,
      tabOrderPass,
      pass: labelsPass && tabOrderPass,
    };
  } finally {
    await closePage(cdp, states, page);
  }
}

async function verifySidebarTenKeyboard(cdp, states) {
  const path = "/preview/sidebar-10/";
  const page = await createPage(cdp, states);
  const triggerSelector = '[aria-label="Open page actions"]';
  try {
    await navigateAndHydrate(cdp, page, path, previewSelectors["sidebar-10"]);
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(triggerSelector)})?.getAttribute('aria-expanded') === 'true'`,
      "sidebar-10初期autoOpen",
    );
    const initial = await evaluate(
      cdp,
      page.sessionId,
      `(() => { const trigger = document.querySelector(${JSON.stringify(triggerSelector)}); trigger.focus(); return { expanded: trigger.getAttribute('aria-expanded'), focused: document.activeElement === trigger }; })()`,
    );
    await pressKey(cdp, page.sessionId, "Escape");
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(triggerSelector)})?.getAttribute('aria-expanded') === 'false'`,
      "sidebar-10 Escape close",
    );
    const afterInitialClose = await evaluate(
      cdp,
      page.sessionId,
      `(() => { const trigger = document.querySelector(${JSON.stringify(triggerSelector)}); trigger.focus(); return { expanded: trigger.getAttribute('aria-expanded'), focused: document.activeElement === trigger }; })()`,
    );
    await pressKey(cdp, page.sessionId, "Enter");
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(triggerSelector)})?.getAttribute('aria-expanded') === 'true'`,
      "sidebar-10 Enter open",
    );
    const afterOpen = await evaluate(
      cdp,
      page.sessionId,
      `(() => ({
        expanded: document.querySelector(${JSON.stringify(triggerSelector)}).getAttribute('aria-expanded'),
        overlayCount: [...document.querySelectorAll('[data-slot="popover-content"]')].filter((element) => /Customize Page/.test(element.textContent ?? '')).length,
        focusedText: document.activeElement?.textContent?.trim() ?? null,
      }))()`,
    );
    await pressKey(cdp, page.sessionId, "Escape");
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(triggerSelector)})?.getAttribute('aria-expanded') === 'false'`,
      "sidebar-10 Escape close after Enter",
    );
    const afterClose = await evaluate(
      cdp,
      page.sessionId,
      `(() => { const trigger = document.querySelector(${JSON.stringify(triggerSelector)}); return { expanded: trigger.getAttribute('aria-expanded'), focusedTrigger: document.activeElement === trigger, overlayCount: [...document.querySelectorAll('[data-slot="popover-content"]')].filter((element) => /Customize Page/.test(element.textContent ?? '')).length }; })()`,
    );
    const pass =
      initial.expanded === "true" &&
      initial.focused &&
      afterInitialClose.expanded === "false" &&
      afterInitialClose.focused &&
      afterOpen.expanded === "true" &&
      afterOpen.overlayCount === 1 &&
      afterClose.expanded === "false" &&
      afterClose.focusedTrigger &&
      afterClose.overlayCount === 0;
    return { name: "sidebar-10 actions trigger", path, initial, afterInitialClose, afterOpen, afterClose, pass };
  } finally {
    await closePage(cdp, states, page);
  }
}

async function verifySidebarSixteenKeyboard(cdp, states) {
  const path = "/preview/sidebar-16/";
  const page = await createPage(cdp, states);
  const triggerSelector = '[aria-label="Toggle sidebar"]';
  const stateSelector = '[data-slot="sidebar"]';
  try {
    await navigateAndHydrate(cdp, page, path, previewSelectors["sidebar-16"]);
    const initial = await evaluate(
      cdp,
      page.sessionId,
      `(() => { const trigger = document.querySelector(${JSON.stringify(triggerSelector)}); const sidebar = document.querySelector(${JSON.stringify(stateSelector)}); trigger.focus(); return { state: sidebar.getAttribute('data-state'), focused: document.activeElement === trigger }; })()`,
    );
    await pressKey(cdp, page.sessionId, "Enter");
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(stateSelector)})?.getAttribute('data-state') !== ${JSON.stringify(initial.state)}`,
      "sidebar-16 Enter toggle",
    );
    const afterEnter = await evaluate(
      cdp,
      page.sessionId,
      `(() => ({ state: document.querySelector(${JSON.stringify(stateSelector)}).getAttribute('data-state'), focused: document.activeElement === document.querySelector(${JSON.stringify(triggerSelector)}) }))()`,
    );
    await pressKey(cdp, page.sessionId, "Space");
    await waitForExpression(
      cdp,
      page.sessionId,
      `document.querySelector(${JSON.stringify(stateSelector)})?.getAttribute('data-state') === ${JSON.stringify(initial.state)}`,
      "sidebar-16 Space toggle",
    );
    const afterSpace = await evaluate(
      cdp,
      page.sessionId,
      `(() => ({ state: document.querySelector(${JSON.stringify(stateSelector)}).getAttribute('data-state'), focused: document.activeElement === document.querySelector(${JSON.stringify(triggerSelector)}) }))()`,
    );
    const pass =
      initial.focused &&
      afterEnter.focused &&
      afterSpace.focused &&
      initial.state !== afterEnter.state &&
      initial.state === afterSpace.state;
    return { name: "sidebar-16 toggle", path, initial, afterEnter, afterSpace, pass };
  } finally {
    await closePage(cdp, states, page);
  }
}

function markdownLink(filename) {
  return `evidence/${filename}`;
}

function writeComponentMarkdown(routeResults, keyboardResults) {
  for (const name of targetNames) {
    const results = routeResults.filter((result) => result.name === name);
    const keyboard = keyboardResults.filter((result) => result.path.includes(name));
    const lines = [
      `verified_impl_sha: ${verifiedImplSha}`,
      "",
      `# ${name} 実ブラウザ証跡（Phase 2 最終）`,
      "",
      "## 実行環境・手順",
      "",
      `- 対象SHA: \`${verifiedImplSha}\``,
      `- URL: \`${baseUrl}\``,
      `- Browser: ${chromeVersion}`,
      `- viewport: ${viewport.width}×${viewport.height} / DPR ${viewport.deviceScaleFactor}`,
      `- runner: \`${runCommand}\``,
      "- runner exit code: `0`",
      `- 対象集合から導出した route 数: ${targetNames.length} block × ${themes.length} theme = ${expectedRouteCount}`,
      "",
      "## 実測結果",
      "",
      "| theme | route | Document | selector可視 | theme | overflow | console/network | axe critical/serious | JPEG |",
      "|---|---|---:|---:|---|---|---|---:|---|",
      ...results.map(
        (result) =>
          `| ${result.theme} | \`${result.path}\` | ${result.documentResponse.status} | ${result.facts.visibleSelectorCount}/${result.facts.selectorCount} | data-theme=${result.facts.theme.dataTheme}, dark=${result.facts.theme.hasDarkClass} | ${result.facts.overflow.hasHorizontalOverflow ? "あり" : "なし"} | pageerror ${result.network.pageErrors.length}, console ${result.network.consoleErrors.length}, HTTP4xx5xx ${result.network.httpErrors.length}, failure ${result.network.requestFailures.length} | ${result.criticalSerious.length} | [${result.screenshot.filename}](${markdownLink(result.screenshot.filename)}) (${result.screenshot.bytes} bytes) |`,
      ),
      "",
      `preview selector: \`${previewSelectors[name]}\`。light/dark 2/2 routeで可視、JPEG magic bytesを実測確認した。`,
      "",
      "## keyboard",
      "",
      ...(keyboard.length
        ? keyboard.map(
            (result) =>
              `- ${result.name}: ${result.pass ? "✅実測確認" : "❌不具合"}（詳細: \`evidence/case00-keyboard-results.json\`）`,
          )
        : [
            "- 個別のkeyboard代表検証対象外。代表route `login-02` / `sidebar-10` / `sidebar-16` の結果は `evidence/case00-keyboard-results.json` に記録した。",
          ]),
      "",
      "## 目視",
      "",
      "light/dark JPEGを目視レビュー対象として保存した。再実行時は検証者が目視判定を追記する。",
      "",
    ];
    writeFileSync(join(reviewDir, `2026-08-21-${name}-preview.md`), `${lines.join("\n")}\n`);
  }
}

function writeCatalogMarkdown(catalogResults, keyboardResults) {
  const lines = [
    `verified_impl_sha: ${verifiedImplSha}`,
    "",
    "# Phase 2 blocks catalog 横断証跡",
    "",
    "## 実行環境・手順",
    "",
    `- 対象SHA: \`${verifiedImplSha}\``,
    `- URL: \`${baseUrl}\``,
    `- Browser: ${chromeVersion}`,
    `- runner: \`${runCommand}\``,
    "- runner exit code: `0`",
    `- 対象: ${targetNames.length} block（${targetNames.join(" / ")}）`,
    `- 実測route: ${expectedRouteCount} isolated + ${catalogSpecs.length} catalog = ${expectedTotalRouteCount}`,
    "",
    "## catalog 実測結果",
    "",
    "| theme | route | Document | Phase2 selector | 重複id | sidebar-10 overlay | console/network | axe critical/serious | JPEG |",
    "|---|---|---:|---:|---:|---|---|---:|---|",
    ...catalogResults.map(
      (result) =>
        `| ${result.theme} | \`${result.path}\` | ${result.documentResponse.status} | ${result.facts.visibility.filter((item) => item.visibleCount >= 1).length}/${targetNames.length} | ${result.facts.duplicateIds.length} | expanded=${result.facts.sidebar10.ariaExpanded}, overlay=${result.facts.sidebar10.matchingOpenOverlayCount} | pageerror ${result.network.pageErrors.length}, console ${result.network.consoleErrors.length}, HTTP4xx5xx ${result.network.httpErrors.length}, failure ${result.network.requestFailures.length} | ${result.criticalSerious.length} | [${result.screenshot.filename}](${markdownLink(result.screenshot.filename)}) (${result.screenshot.width}×${result.screenshot.height}, ${result.screenshot.bytes} bytes) |`,
    ),
    "",
    "全Phase2 selectorは同一DOM上で可視、`data-preview-mode=catalog`。固定id重複0、sidebar-10 actions popoverはcatalogで自動openしないことを実測した。",
    "",
    "## axe / keyboard",
    "",
    `- axe WCAG 2.2 AA相当タグ: isolated ${routeResultsGlobal.length}/${expectedRouteCount} route、catalog ${catalogResults.length}/${catalogSpecs.length} routeで実行。critical/serious 0。`,
    ...keyboardResults.map(
      (result) => `- ${result.name}: ${result.pass ? "✅実測確認" : "❌不具合"}`,
    ),
    "",
    "## 生ログ",
    "",
    "- `evidence/case00-target-derivation.json`",
    "- `evidence/case00-route-results.json`",
    "- `evidence/case00-catalog-results.json`",
    "- `evidence/case00-axe-results.json`",
    "- `evidence/case00-keyboard-results.json`",
    "- `evidence/case00-summary.json`",
    "- `evidence/case00-browser-runner.log`",
    "- `evidence/case00-server.log`",
    "",
    "## 目視",
    "",
    "light/darkのfull-page JPEGを目視レビュー対象として保存した。再実行時は検証者が目視判定を追記する。",
    "",
  ];
  writeFileSync(join(reviewDir, "2026-08-21-blocks-phase2-catalog.md"), `${lines.join("\n")}\n`);
}

const chromeProfile = mkdtempSync(join(tmpdir(), "blocks-phase2-final-chrome-"));
const chromeLogPath = join(evidenceDir, "case00-chrome.log");
const chromeLog = createWriteStream(chromeLogPath, { flags: "w" });
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
    "--metrics-recording-only",
    "--no-pings",
    "--remote-debugging-port=0",
    `--user-data-dir=${chromeProfile}`,
    `--window-size=${viewport.width},${viewport.height}`,
    "about:blank",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
chrome.stderr.pipe(chromeLog);

const states = new Map();
let cdp;
let routeResultsGlobal = [];
let catalogResultsGlobal = [];
let keyboardResultsGlobal = [];
let runnerExitCode = 1;

try {
  if (preflightFailures.length) fail(`preflight failure:\n${preflightFailures.join("\n")}`);
  const devtoolsActivePort = await waitForFile(join(chromeProfile, "DevToolsActivePort"), 20_000);
  const [port, browserPath] = devtoolsActivePort.trim().split("\n");
  cdp = new CdpConnection(`ws://127.0.0.1:${port}${browserPath}`);
  await cdp.open();
  const stateFor = (message) => states.get(message.sessionId);
  cdp.on("Network.responseReceived", (message) => {
    const state = stateFor(message);
    if (!state) return;
    const response = {
      url: message.params.response.url,
      status: message.params.response.status,
      statusText: message.params.response.statusText,
      mimeType: message.params.response.mimeType,
      type: message.params.type,
    };
    if (message.params.type === "Document") state.documentResponses.push(response);
    if (response.status >= 400) state.httpErrors.push(response);
  });
  cdp.on("Network.loadingFailed", (message) => {
    const state = stateFor(message);
    if (!state) return;
    state.requestFailures.push({
      requestId: message.params.requestId,
      errorText: message.params.errorText,
      canceled: message.params.canceled ?? false,
      blockedReason: message.params.blockedReason ?? null,
    });
  });
  cdp.on("Runtime.exceptionThrown", (message) => {
    const state = stateFor(message);
    if (!state) return;
    state.pageErrors.push({
      text: message.params.exceptionDetails.text,
      description: message.params.exceptionDetails.exception?.description ?? null,
      url: message.params.exceptionDetails.url,
      lineNumber: message.params.exceptionDetails.lineNumber,
      columnNumber: message.params.exceptionDetails.columnNumber,
    });
  });
  cdp.on("Runtime.consoleAPICalled", (message) => {
    const state = stateFor(message);
    if (!state || message.params.type !== "error") return;
    state.consoleErrors.push({
      source: "console",
      type: message.params.type,
      args: message.params.args.map((arg) => arg.value ?? arg.description ?? arg.type),
    });
  });
  cdp.on("Log.entryAdded", (message) => {
    const state = stateFor(message);
    if (!state || message.params.entry.level !== "error") return;
    state.consoleErrors.push({
      source: message.params.entry.source,
      text: message.params.entry.text,
      url: message.params.entry.url,
      lineNumber: message.params.entry.lineNumber,
    });
  });

  for (const [index, spec] of routeSpecs.entries()) {
    const result = await verifyPreviewRoute(cdp, states, spec, index + 1);
    routeResultsGlobal.push(result);
    console.log(
      `${result.pass ? "PASS" : "FAIL"} ${index + 1}/${expectedRouteCount} ${spec.path}`,
    );
  }
  for (const [index, spec] of catalogSpecs.entries()) {
    const result = await verifyCatalogRoute(cdp, states, spec, expectedRouteCount + index + 1);
    catalogResultsGlobal.push(result);
    console.log(`${result.pass ? "PASS" : "FAIL"} catalog ${spec.path}`);
  }

  writeJson("case00-route-results.json", routeResultsGlobal);
  writeJson("case00-catalog-results.json", catalogResultsGlobal);
  writeJson(
    "case00-axe-results.json",
    [...routeResultsGlobal, ...catalogResultsGlobal].map((result) => ({
      path: result.path,
      pass: result.pass,
      axe: result.axe,
      criticalSerious: result.criticalSerious,
    })),
  );

  keyboardResultsGlobal = [
    await captureKeyboardResult("login-02 auth form", () => verifyAuthKeyboard(cdp, states)),
    await captureKeyboardResult("sidebar-10 actions trigger", () =>
      verifySidebarTenKeyboard(cdp, states),
    ),
    await captureKeyboardResult("sidebar-16 toggle", () =>
      verifySidebarSixteenKeyboard(cdp, states),
    ),
  ];
  writeJson("case00-keyboard-results.json", keyboardResultsGlobal);

  const routeFailures = routeResultsGlobal.filter((result) => !result.pass);
  const catalogFailures = catalogResultsGlobal.filter((result) => !result.pass);
  const keyboardFailures = keyboardResultsGlobal.filter((result) => !result.pass);
  const jpegFiles = [...routeResultsGlobal, ...catalogResultsGlobal]
    .map((result) => result.screenshot?.filename)
    .filter(Boolean);
  const summary = {
    verifiedImplSha,
    gitHead,
    generatedAt: new Date().toISOString(),
    repositoryRoot,
    baseUrl,
    chromePath,
    chromeVersion,
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
    viewport,
    derivation,
    counts: {
      targetNames: targetNames.length,
      expectedRouteCount,
      executedRouteCount: routeResultsGlobal.length,
      passedRouteCount: routeResultsGlobal.length - routeFailures.length,
      expectedCatalogCount: catalogSpecs.length,
      executedCatalogCount: catalogResultsGlobal.length,
      passedCatalogCount: catalogResultsGlobal.length - catalogFailures.length,
      axeExecutedCount: [...routeResultsGlobal, ...catalogResultsGlobal].filter((result) => result.axe).length,
      keyboardExecutedCount: keyboardResultsGlobal.length,
      keyboardPassedCount: keyboardResultsGlobal.length - keyboardFailures.length,
      jpegCount: jpegFiles.length,
    },
    failures: {
      preflightFailures,
      routes: routeFailures.map((result) => ({ path: result.path, failures: result.failures })),
      catalogs: catalogFailures.map((result) => ({ path: result.path, failures: result.failures })),
      keyboard: keyboardFailures,
    },
    jpegFiles,
  };
  writeJson("case00-summary.json", summary);

  const hardFailures = [
    ...preflightFailures,
    ...routeFailures.flatMap((result) => result.failures.map((failure) => `${result.path}: ${failure}`)),
    ...catalogFailures.flatMap((result) => result.failures.map((failure) => `${result.path}: ${failure}`)),
    ...keyboardFailures.map((result) => `${result.name}: keyboard failure`),
  ];
  if (routeResultsGlobal.length !== expectedRouteCount) {
    hardFailures.push(`isolated route実行件数 ${routeResultsGlobal.length}/${expectedRouteCount}`);
  }
  if (catalogResultsGlobal.length !== catalogSpecs.length) {
    hardFailures.push(`catalog route実行件数 ${catalogResultsGlobal.length}/${catalogSpecs.length}`);
  }
  if (jpegFiles.length !== expectedTotalRouteCount) {
    hardFailures.push(`JPEG件数 ${jpegFiles.length}/${expectedTotalRouteCount}`);
  }
  if (hardFailures.length) fail(`fail-closed判定:\n${hardFailures.join("\n")}`);

  writeComponentMarkdown(routeResultsGlobal, keyboardResultsGlobal);
  writeCatalogMarkdown(catalogResultsGlobal, keyboardResultsGlobal);
  runnerExitCode = 0;
  console.log(
    `SUMMARY PASS: isolated ${routeResultsGlobal.length}/${expectedRouteCount}, catalog ${catalogResultsGlobal.length}/${catalogSpecs.length}, axe ${expectedTotalRouteCount}/${expectedTotalRouteCount}, keyboard ${keyboardResultsGlobal.length}/${keyboardResultsGlobal.length}, JPEG ${jpegFiles.length}/${expectedTotalRouteCount}`,
  );
} catch (error) {
  const text = error instanceof Error ? error.stack ?? error.message : String(error);
  writeFileSync(join(evidenceDir, "case00-fatal.log"), `${text}\n`);
  console.error(text);
} finally {
  if (cdp) cdp.close();
  chrome.kill("SIGTERM");
  await new Promise((resolveExit) => {
    if (chrome.exitCode !== null) resolveExit();
    else {
      chrome.once("exit", resolveExit);
      setTimeout(resolveExit, 5_000);
    }
  });
  chromeLog.end();
  rmSync(chromeProfile, { recursive: true, force: true });
  writeJson("case00-runner-cleanup.json", {
    chromeExitCode: chrome.exitCode,
    chromeSignalCode: chrome.signalCode,
    chromeProfileRemoved: !existsSync(chromeProfile),
    chromeLogBytes: existsSync(chromeLogPath) ? statSync(chromeLogPath).size : 0,
  });
  process.exitCode = runnerExitCode;
}
