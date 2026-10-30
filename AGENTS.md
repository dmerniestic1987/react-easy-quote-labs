# React Easy Quote Labs

## Role

Act as an expert software engineer specialized in UI/UX, with many years of experience building mobile and web graphical
interfaces using TypeScript, React and MUI.

## Language Conventions

- Instructions given to agents may be written in Spanish.
- All files, comments and source code must be written in English.

## Overview

A graphical interface for quoting medical orders in a simple and fast way.

The UI must be responsive and work across devices, with a focus on:

- Desktop.
- Mobile, preferably Android phones with medium/large screens.

## Tech Stack

- TypeScript
- Node 24
- React
- MUI
- JWT-based authentication
- REST API consumption

## API Server

The UI consumes the REST services defined in `./data/swagger.json`, which is the source of truth for endpoints and schemas.

## Roles and Permissions

| Role             | Login | Create quotes | Search and view quotes |
|------------------|:-----:|:-------------:|:----------------------:|
| `SECRETARY`      |  Yes  |      Yes      |          Yes           |
| `BUSINESS_ADMIN` |  Yes  |      Yes      |          Yes           |

## Flows

### 1. Login

1. The user opens the main URL.
2. The system verifies that the JWT is valid and not expired (`GET /auth/me`).
3. If it is not, the system shows a login screen asking for username and password and authenticates with `POST /auth/login`.

### 2. Create Quotes

Context: a patient contacts a secretary and requests a quote for medical studies. The patient sends the digital medical
orders as PNG, JPG or PDF files.

#### 2.1 Select items

1. The secretary filters the studies by name or code and selects the items to quote.
2. The system sums the prices in real time.
3. When finished, the order is created with `POST /health-orders`.

Current implementation: `LabQuoteDesktop.tsx`, `LabQuoteMobile.tsx`, `lab-calculator.ts`.

#### 2.2 Upload order files

The secretary uploads the files of the medical orders:

- **Desktop:** browse the hard drive or drag and drop files onto the UI.
- **Mobile:** pick files from the device (file manager or photo gallery) or open the camera to photograph a physical order.

The UI must detect the type of each uploaded file:

- **JPG / PNG:**
  1. Process the image and convert it to grayscale using a 2 bits-per-pixel palette, to reduce its size before transmission.
  2. Show a preview of the processed grayscale image.
  3. Ask the user for approval before publishing.
  4. For each approved image, send `POST /health-orders/{id}/prescription`.
- **PDF:** upload as is.

#### 2.3 Quote summary

When the upload finishes, show a summary with:

- Quote number.
- QR code of the quote ID.
- Quote date.
- List of quoted items (code and name only, **no prices**).
- Final quote price.

Sharing the summary:

- **Mobile:** show a share button that sends the summary as an image to other apps (WhatsApp, Gmail, Telegram, other social networks).
- **Desktop:** allow copying the image so it can be pasted easily into WhatsApp Web or any other communication tool used by the secretary.

### 3. Search and View Quotes

1. **Search:** call `GET /health-orders`, which supports several filters: `status`, `clientId` and creation date range.
2. **Detail:** when the user selects an order, call `GET /health-orders/{id}` and `GET /health-orders/{id}/files`.
3. **Files:** for each file, call `GET /health-orders/{id}/files/{fileId}`.
4. **Caching:** the UI may store the images in local storage (or another storage mechanism) to simulate a cache.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
