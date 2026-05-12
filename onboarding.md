# Developer Onboarding & Development Logging Process

Welcome to the **Gravity Claw** development onboarding protocol! Any AI agent taking over development duties *must* follow this workflow to ensure consistent versioning, standard onboarding processes, and continuous tracking.

## 1. Versioning Protocol

All container images and components must stay aligned to our formal versioning, currently tracking from **`0.1.0`**.

*   **Docker Compose:** Images are explicitly tagged via the `image:` property (e.g., `image: gravity-claw-bot:0.1.0`) inside `docker-compose.yml`. DO NOT USE the `latest` tag blindly for builds as we need persistent version control.
*   **Package.json:** Both the primary agent (`package.json`) and the Mission Control UI (`mission-control/package.json`) must maintain synchronized version strings.
*   **Mission Control UI:** Ensure the visual version indicator inside the UI (`Sidebar.tsx`) strictly reflects the current `package.json` version.

## 2. Agent Onboarding Checklist

When a new agent session begins for active development, please run through this immediate checklist before generating changes:

1.  **Check Current Version:** Read `package.json` and `mission-control/package.json` to understand the target application version.
2.  **Verify Existing Docker Containers:** Check running containers (via docker CLI) to see if the current code corresponds to what is running.
3.  **Check Open Tasks/Workflows:** Review existing `.agent/workflows/` like `status.md` or `plan.md` to see what your predecessor was currently working on.
4.  **Acknowledge This Protocol:** Formally outline you have read this `onboarding.md` when setting up your immediate development log.

## 3. Development Logging (Diary Protocol)

To maintain context across sessions ("handovers"):

*   If performing major system changes, explicitly create or update an internal artifact, or leverage local logging inside the scratch/diary pad.
*   Every significant update should be documented inside `.agent/workflows/status.md`.
*   When rebuilding containers, ensure you append building standard commands and logs using `docker build` targeting the explicit version tags (e.g., `docker compose up --build -d`).

By following this standardized onboarding procedure, we prevent fragmentation between the backend bot version, the frontend UI, and our tracking containers while ensuring consistent project lifecycle management.
