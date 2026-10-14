# YPS Academy Student Form

Angular reactive form for adding students to the YPS Academy student service.

## Run locally

1. Start the backend at `http://localhost:3000` with the student route at `/api/students`.
2. Ensure it accepts cross-origin requests from `http://localhost:4200`.
3. Run `npm install`, then `npm start`.
4. Open `http://localhost:4200`.

The form submits a `POST` request to `http://localhost:3000/api/students`. It sends
`firstName`, `lastName`, `email` (omitted when blank), `phone`, `dateOfBirth`,
`gender`, `standard`, `course`, `guardianName`, `guardianPhone`, and `address`.
The browser-side validators match the supplied student schema.

The API base URL is configured in `src/environments/environment.ts` and
`src/environments/environment.prod.ts`. Set the production value to the
deployed backend URL before deploying this frontend.

## Build and test

- `npm run build`
- `npm test -- --watch=false --browsers=ChromeHeadless`
