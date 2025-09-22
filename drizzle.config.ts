import { type Config } from "drizzle-kit";
import { env } from "~/env";

export default {
  schema: "./src/db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: env.MYSQL_HOST,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    port: env.MYSQL_PORT,
    database: env.MYSQL_DATABASE,
  },
} satisfies Config;
