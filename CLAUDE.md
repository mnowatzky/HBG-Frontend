# CLAUDE.md

## Before opening a PR

Test every frontend change end to end with Playwright on this machine before opening a pull request. Passing unit-level checks or reading the code is not enough.

1. Rebuild the image. The tests run against the built image, not the files in the working tree, so a stale container tests old code:
   `docker build -t hbg-frontend:dev .`
2. Run it on a free port. Port 8080 is often taken by a local stack such as `hbg-stats-test`. Leave that stack alone and use another port:
   `docker run --rm -d --name hbg-frontend-check -p 127.0.0.1:8089:80 hbg-frontend:dev`
3. Run the suite against it: `npm run lint` and `BASE_URL=http://127.0.0.1:8089 npm test`. Add or update tests in `tests/` for the change.
4. Look at the change in a real browser with real data. If a local API stack is running, attach the container to its network so `/api` reaches the API (for example `--network hbg-stats-test_app`). Then drive the page with a short Playwright script: click through the affected states, check the console for errors, and take screenshots. On `/stats` the charts load only once `#wann` scrolls into view, so scroll there before reading chart text.
5. Stop the container afterwards, and report what was checked in the PR description.
