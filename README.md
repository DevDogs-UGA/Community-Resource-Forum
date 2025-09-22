# Community-Resource-Forum

DevDogs' 2025-2026 project: a community forum website for computer science students at UGA.

## Welcome to the DevDogs Community Resource Forum project!

We’re excited to have you here! If you’re interested in contributing to our project, please request to join the 2025-2026 Project Contributers team [here](https://github.com/orgs/DevDogs-UGA/teams/25-26-project-contributors) and join our [Discord server](https://discord.com/invite/BdDdkNQhqp). If you're a new member or want a refresher, check out our [wiki!](https://github.com/DevDogs-UGA/Community-Resource-Forum/wiki)

## Getting Started

1. **Join the Team**: Request to join the 2025-2026 Project Contributor team on our GitHub Organization.
2. **Review Issues**: Check the Issues tab to see what work needs to be done.
3. **Fork the Repository**: Create a fork of this repository to work on your own copy of the code. Assign yourself an issue to work on.
4. **Clone the Repository**: Use Git or GitHub Desktop to clone your forked repository to your local machine.
5. **Work on the Issue**: Complete the tasks associated with your assigned issue.
6. **Push Changes**: Push your local changes to your forked GitHub repository.
7. **Create a Pull Request**: Once your work is complete, submit a pull request (PR) to the original repository. Be sure to document your changes thoroughly and include any relevant screenshots.

## Docker (local development / quick start)

This project supports running locally with Docker Compose. The repository includes a `.env.example` you can copy to `.env`.

1. Copy `.env.example` to `.env` and fill values (do not commit `.env`):

```bash
cp .env.example .env
# Edit .env and add secrets
```

2. Generate an `AUTH_SECRET` for NextAuth (required):

```bash
npx auth secret
# Copy the output into AUTH_SECRET in .env
```

3. OAuth client secret: create a Google OAuth client in Google Cloud Console and set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` in `.env`.

4. Start services (Compose will load `.env` automatically):

```bash
docker compose up -d --build
```

5. Open http://localhost:3000. To stop:

```bash
docker compose down
```

Notes
- `.env` is ignored by Docker build and git (safe). Compose injects env values at runtime via `env_file`.
- For production, use a secret manager or Docker secrets instead of a local `.env` file.

**Important**: Always sync your forked repository with the original before starting any new coding session, and pull the latest changes to your local machine.
