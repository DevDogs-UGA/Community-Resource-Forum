/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  async redirects() {
    return [
      {
        source: "/api/auth/callback/google",
        destination: "/api/auth",
        permanent: true,
      },
      {
        source: "/",
        destination: "/posts",
        permanent: false,
      },
      {
        source: "/moderate",
        destination: "/moderate/review/posts",
        permanent: false,
      },
      {
        source: "/moderate/review",
        destination: "/moderate/review/posts",
        permanent: false,
      },
    ];
  },
};

export default config;
