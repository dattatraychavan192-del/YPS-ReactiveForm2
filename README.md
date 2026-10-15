# YPS Academy Student Form

Angular reactive form for adding students to the YPS Academy student service.

## Run locally

The backend is maintained as a separate project in the sibling folder
`YPS-ReactiveForm2-Backend`.

1. In the backend VS Code window, run `npm start` to start the API at `http://localhost:3000`.
2. In this frontend project, run `npm install` once and then `npm start` to start Angular at `http://localhost:4200`.

The form submits a `POST` request to `http://localhost:3000/api/students`. It sends
`firstName`, `lastName`, `email` (omitted when blank), `phone`, `dateOfBirth`,
`gender`, `standard`, `course`, `guardianName`, `guardianPhone`, and `address`.
The browser-side validators match the supplied student schema.

Student records are stored in the backend project's `data/students.json`. The
API provides `GET /api/health` and `GET /api/students`. Set `PORT`, `HOST`, or
comma-separated `CORS_ORIGINS` environment variables to configure the server.

The API base URL is configured in `src/environments/environment.ts` and
`src/environments/environment.prod.ts`. Development points to the local API;
set the production value to the deployed backend URL before deploying this frontend.

## Build and test

- `npm run build`
- `npm test -- --watch=false --browsers=ChromeHeadless`
