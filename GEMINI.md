# GEMINI.md

## Project Overview

This project is a web-based meditative breathing visualization tool called "Breathe". It provides an interactive and customizable animation to guide users through breathing exercises. The application is built with a frontend using HTML, CSS, and JavaScript with SVG.js for animations. The backend is powered by Supabase for user authentication and database storage, and Cloudflare Workers for handling payments with Lemon Squeezy.

### Key Technologies

*   **Frontend:** HTML, CSS, JavaScript, SVG.js
*   **Backend:** Supabase (Authentication, Database), Cloudflare Workers (Serverless Functions)
*   **Payments:** Lemon Squeezy

### Architecture

The application consists of a static frontend that communicates with a Supabase backend and a Cloudflare Worker.

*   **Frontend:** The `index.html`, `styles.css`, and `script.js` files constitute the frontend. The `script.js` file contains the core logic for the animation, user interaction, and communication with the backend.
*   **Supabase:** Supabase is used for user authentication (magic links) and storing user profiles, including their premium status and session history. The database schema is managed through migrations located in the `supabase/migrations` directory.
*   **Cloudflare Workers:** A Cloudflare Worker, defined in `functions/src/index.ts`, handles payment processing. It exposes two endpoints:
    *   `/create-checkout`: Creates a Lemon Squeezy checkout session for purchasing premium features.
    *   `/webhook`: Handles webhooks from Lemon Squeezy to update a user's premium status in the Supabase database after a successful payment.

## Building and Running

### Frontend

The frontend is a static website and can be run by opening the `index.html` file in a web browser. No build step is required.

### Backend

#### Supabase

The Supabase backend can be run locally using the Supabase CLI.

1.  **Install Supabase CLI:**
    ```bash
    npm install -g supabase
    ```
2.  **Start Supabase services:**
    ```bash
    supabase start
    ```

This will start the Supabase Docker containers and provide you with local Supabase credentials.

#### Cloudflare Workers

The Cloudflare Worker can be developed and tested locally using the Wrangler CLI.

1.  **Install Wrangler CLI:**
    ```bash
    npm install -g wrangler
    ```
2.  **Install dependencies:**
    ```bash
    cd functions
    npm install
    ```
3.  **Run the worker locally:**
    ```bash
    wrangler dev
    ```

### Running the Full Application

To run the full application locally, you will need to:

1.  Start the Supabase services.
2.  Run the Cloudflare Worker locally.
3.  Open the `index.html` file in a web browser.

You will also need to configure the necessary environment variables for the Cloudflare Worker, including Supabase and Lemon Squeezy API keys.

## Development Conventions

### Code Style

The code style is not explicitly defined, but the existing code follows a consistent pattern. It is recommended to follow the existing code style when making changes.

### Testing

The Cloudflare Worker has a test suite set up with `vitest`. Tests can be run using the following command:

```bash
cd functions
npm test
```

There are no tests for the frontend code.

### Commits

There is no formal commit message convention, but it is recommended to write clear and descriptive commit messages.
