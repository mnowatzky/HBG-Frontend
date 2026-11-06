# HBG Frontend

[![CI](https://github.com/mnowatzky/HBG-Frontend/actions/workflows/ci.yml/badge.svg)](https://github.com/mnowatzky/HBG-Frontend/actions/workflows/ci.yml)
[![Docker Hub](https://img.shields.io/docker/v/maltenow/hbg-frontend?sort=semver&label=docker%20hub)](https://hub.docker.com/r/maltenow/hbg-frontend)

The pages of the HBG sticker map, in German: plain HTML, CSS and JavaScript with no build step, served by Apache. All data comes from [HBG-Fast-API](https://github.com/mnowatzky/HBG-Fast-API), which Apache makes available to the browser below `/api`.

| Page | Purpose |
| --- | --- |
| `/karte` | Map of all stickers. `?name=Timo` shows only one person's. |
| `/sticker` | Saves a sticker at the browser's current location. |
| `/stats` | Totals and the change from last month: stickers, cities, countries and people. |
| `/bar_chart?data=names` or `?data=countries` | Stickers per person or per country. |
| `/datenschutz` | The privacy policy. |

`/` redirects to `/karte`.

## Running it

Run the image `maltenow/hbg-frontend` as part of the stack: the [compose file and the steps](https://github.com/mnowatzky/HBG-Fast-API#running-it) are in HBG-Fast-API. Apache's settings are in [`deploy/apache.conf`](deploy/apache.conf). It forwards `/api/` to the `sticker-api` service, serves `/karte` from `karte.html`, compresses responses and sets the security headers. The Content-Security-Policy is report-only, so violations show in the browser console without blocking anything. HSTS is left to the reverse proxy that terminates TLS.

## Development

To run the pages against a real API, use the [stack from source](https://github.com/mnowatzky/HBG-Fast-API#development), and rebuild after changing a page. To look at the pages alone, without any stickers:

```sh
docker build -t hbg-frontend:dev .
docker run --rm -p 127.0.0.1:8080:80 hbg-frontend:dev
```

The pages show an error message while the API can't be reached. The location features need `localhost` or HTTPS, so open the site as http://localhost:8080.

The API's address is `API_BASE_URL` in [`js/api.js`](js/api.js), and all pages use the helpers in that file. Names are free text from anyone, so pass them through `escapeHtml` before inserting them into HTML.

A page that loads something from another site needs it added to the Content-Security-Policy in [`deploy/apache.conf`](deploy/apache.conf).

### Tests

The tests use [Playwright](https://playwright.dev) against the running image, with the API mocked, so they need no stack. They also check accessibility with axe. The pages are checked with [html-validate](https://html-validate.org). CI runs all of this on each push. You need Node.js (the version in `.nvmrc`):

```sh
npm ci
npx playwright install chromium
npm run lint
docker build -t hbg-frontend:dev . && docker run --rm -d -p 127.0.0.1:8080:80 hbg-frontend:dev
npm test
```

`BASE_URL` points the tests at another address, e.g. `BASE_URL=http://127.0.0.1:8089 npm test`.

## Outside services

| Service | Used for |
| --- | --- |
| [Cloudflare](https://www.cloudflare.com/) | Sits in front of the whole site in production: TLS and protection against attacks. It sees every request. NPM takes the visitor's address from its `CF-Connecting-IP` header. |
| [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/) and its geocoder | The map and its search on `/karte`. The token in `karte.html` is a public one (`pk.`), which every browser sees. When changing the version, update the `integrity` hashes next to it. |
| [Chart.js](https://www.chartjs.org/) from jsDelivr | The charts on `/bar_chart`. |
| [SweetAlert2](https://sweetalert2.github.io/) | Dialogs on `/sticker`. Included in `js/` under the MIT License. |
| [Oswald](https://github.com/googlefonts/OswaldFont) | The font of all pages. Included in `css/fonts/` under the SIL Open Font License. |

When this list changes, update `/datenschutz` too.

## Releasing

Versions follow [SemVer](https://semver.org). Each push runs CI. A version tag on `main` runs the checks again, pushes the image with the version and as `latest` for `linux/amd64` and `linux/arm64`, and creates a GitHub release. A tag that isn't on `main` fails before anything is pushed. The repository needs the secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`.

```sh
git tag -a v0.2.0 -m "Release 0.2.0"
git push --follow-tags
```

Then set `FRONTEND_TAG` on the server, as described under [updates](https://github.com/mnowatzky/HBG-Fast-API#updates-and-rollback).

## License

The code is under the [MIT License](LICENSE). The HBG name and logo and the images in [`bilder/`](bilder/) are not covered by it; all rights to them are reserved.
