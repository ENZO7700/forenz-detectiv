// e2e/visualGlassmorphismAudit.spec.js
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.resolve('screenshots');

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe('Ultra-Visual Glassmorphic & Layout Audit Across All Endpoints', () => {

  test('01. Domovská stránka & Upload Dropzone (/ & hero view)', async ({ page }) => {
    await page.goto('/?view=hero');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_home_hero.png`, fullPage: true });

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('02. Pavúk vzťahov (/?view=graph)', async ({ page }) => {
    await page.goto('/?view=graph');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_view_graph.png`, fullPage: true });

    const workspace = page.locator('div.flex-1');
    await expect(workspace.first()).toBeVisible();
  });

  test('03. Spis & Kartotéka (/?view=archive)', async ({ page }) => {
    await page.goto('/?view=archive');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03_view_archive.png`, fullPage: true });

    const archive = page.locator('div.flex-1');
    await expect(archive.first()).toBeVisible();
  });

  test('04. Alibi & Geografická mapa (/?view=map)', async ({ page }) => {
    await page.goto('/?view=map');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04_view_alibi_map.png`, fullPage: true });

    const mapContainer = page.locator('div.flex-1');
    await expect(mapContainer.first()).toBeVisible();
  });

  test('05. Časová os vyšetrovania (/?view=timeline)', async ({ page }) => {
    await page.goto('/?view=timeline');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05_view_timeline.png`, fullPage: true });

    const timelineContainer = page.locator('div.flex-1');
    await expect(timelineContainer.first()).toBeVisible();
  });

  test('06. Prepojené identity (/?view=identity)', async ({ page }) => {
    await page.goto('/?view=identity');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06_view_identity.png`, fullPage: true });

    const identityContainer = page.locator('div.flex-1');
    await expect(identityContainer.first()).toBeVisible();
  });

  test('07. Executive Dashboard (/dashboard)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07_executive_dashboard.png`, fullPage: true });

    const heading = page.getByRole('heading', { name: /Vyšetrovací Dashboard/i });
    await expect(heading).toBeVisible();
  });

  test('08. Zdieľaný prípad (/shared/demo-token)', async ({ page }) => {
    await page.goto('/shared/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/08_shared_case.png`, fullPage: true });

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('09. Sherlock AI Plávajúci Chat', async ({ page }) => {
    await page.goto('/?view=graph');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(600);

    const sherlockBtn = page.getByTitle(/Sherlock AI Forenzný Asistent/i).or(page.getByRole('button', { name: /Sherlock/i })).first();
    if (await sherlockBtn.isVisible()) {
      await sherlockBtn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/09_sherlock_chat_modal.png` });
    }
  });

  test('10. Rýchle vyhľadávanie Ctrl+K (QuickSearchDialog)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(400);

    await page.keyboard.press('Control+KeyK');
    await page.waitForTimeout(500);

    const searchInput = page.getByPlaceholder(/Hľadať osobu, alibi, spis/i).or(page.locator('input[type="text"]')).first();
    if (await searchInput.isVisible()) {
      await page.screenshot({ path: `${SCREENSHOT_DIR}/10_quick_search_dialog.png` });
    }
  });

});
