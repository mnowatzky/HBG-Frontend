// The tests run against the built image (see README), with the API mocked.
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
    testDir: 'tests',
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    use: {
        baseURL: process.env.BASE_URL || 'http://localhost:8080',
        locale: 'de-DE',
        timezoneId: 'Europe/Berlin',
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ],
});
