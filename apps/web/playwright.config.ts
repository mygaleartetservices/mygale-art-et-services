import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  // A single Next.js dev server compiles routes on demand — the first hit to
  // an uncompiled route (especially tiptap-heavy admin forms) can take well
  // over 30s on this stack, so the default budget is too tight.
  timeout: 60_000,
  // A single Next.js dev server compiles routes on demand; running spec
  // files across parallel workers contends for that and causes spurious
  // navigation timeouts unrelated to app behavior. Serialize instead.
  workers: 1,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10_000,
    permissions: ['camera'],
  },
  // Uses the system-installed Chrome instead of Playwright's bundled Chromium,
  // so `pnpm test` works without a separate `playwright install` download step.
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        // Headless Chrome has no real camera, so my-attendance's in-app QR
        // scanner (QrScanner.tsx, getUserMedia) would otherwise only ever
        // be testable via its failure path. These make getUserMedia
        // deterministically succeed with a synthetic test-pattern feed
        // instead — standard practice for testing WebRTC/camera features.
        launchOptions: {
          args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
        },
      },
    },
  ],
})
