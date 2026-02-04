import { createId } from "@paralleldrive/cuid2";
import { type SQL, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/mysql-core";
import { lower } from "../utils";

export const events = mysqlTable("event", (d) => ({
  id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
  organizerId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => profiles.id),
  title: d.varchar({ length: 255 }).notNull(),
  start: d.datetime().notNull(),
  end: d.datetime().notNull(),
  allDay: d.boolean().notNull(),
  // TODO: add recurrence rules!
  location: d.varchar({ length: 255 }),
  tags: d.json(),
}));

export const posts = mysqlTable(
  "post",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    content: d.text(), // HTML content
    textContent: d.text(),
    authorId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    eventId: d.varchar({ length: 255 }).references(() => events.id),
    upvoteCount: d.int().notNull().default(0),
    downvoteIncorrectCount: d.int().notNull().default(0),
    downvoteHarmfulCount: d.int().notNull().default(0),
    downvoteSpamCount: d.int().notNull().default(0),
    downvoteCount: d
      .int()
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`${posts.downvoteIncorrectCount} + ${posts.downvoteHarmfulCount} + ${posts.downvoteSpamCount}`,
      ),
    score: d
      .int()
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`${posts.upvoteCount} - ${posts.downvoteCount}`,
      ),
    quarantined: d.boolean().notNull().default(false),
    commentCount: d.int().notNull().default(0),
    createdAt: d.timestamp().defaultNow().notNull(),
    updatedAt: d.timestamp().onUpdateNow(),
  }),
  (t) => [index("author_idx").on(t.authorId)],
);

export const voteValue = mysqlEnum([
  "up",
  "down.incorrect",
  "down.harmful",
  "down.spam",
]);

export const postVotes = mysqlTable(
  "postVote",
  (d) => ({
    userProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.profileId),
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
    value: voteValue.notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userProfileId, t.postId] })],
);

export const comments = mysqlTable(
  "comments",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    content: d.text().notNull(),
    quarantined: d.boolean().notNull().default(false),
    authorId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
    replyCount: d.int().notNull().default(0),
    upvoteCount: d.int().notNull().default(0),
    downvoteIncorrectCount: d.int().notNull().default(0),
    downvoteHarmfulCount: d.int().notNull().default(0),
    downvoteSpamCount: d.int().notNull().default(0),
    downvoteCount: d
      .int()
      .notNull()
      .generatedAlwaysAs(
        (): SQL =>
          sql`${comments.downvoteIncorrectCount} + ${comments.downvoteHarmfulCount} + ${comments.downvoteSpamCount}`,
      ),
    score: d
      .int()
      .notNull()
      .generatedAlwaysAs(
        (): SQL => sql`${comments.upvoteCount} - ${comments.downvoteCount}`,
      ),
    parentId: d.varchar({ length: 255 }),
    createdAt: d.timestamp().defaultNow().notNull(),
  }),
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }),
    index("author_idx").on(t.authorId),
  ],
);

export const commentVotes = mysqlTable(
  "commentVote",
  (d) => ({
    userProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.profileId),
    commentId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => comments.id),
    value: voteValue.notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userProfileId, t.commentId] })],
);

export const tags = mysqlTable("tag", (d) => ({
  id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
  lft: d.int().notNull(),
  rgt: d.int().notNull(),
  depth: d.int().notNull(),
  name: d.varchar({ length: 255 }).notNull().unique(),
}));

export const tagsToPosts = mysqlTable(
  "tags_to_posts",
  (d) => ({
    tagId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tags.id),
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
  }),
  (t) => [primaryKey({ columns: [t.tagId, t.postId] })],
);

export const profiles = mysqlTable("profile", (d) => ({
  id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
  type: d.mysqlEnum(["user", "organization"]).notNull(),
  name: d.varchar({ length: 255 }).notNull(),
  bio: d.text({}),
  linkedin: d.varchar({ length: 255 }),
  github: d.varchar({ length: 255 }),
  personalSite: d.varchar({ length: 255 }),
  image: d.varchar({ length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
}));

export const users = mysqlTable(
  "user",
  (d) => ({
    profileId: d
      .varchar({ length: 255 })
      .primaryKey()
      .references(() => profiles.id),
    email: d.varchar({ length: 255 }).notNull(),
    role: d.mysqlEnum(["user", "moderator"]).notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    updatedAt: d.timestamp("updated_at").onUpdateNow(),
  }),
  (t) => [uniqueIndex("email_idx").on(lower(t.email))],
);

export const organizations = mysqlTable(
  "organization",
  (d) => ({
    organizationProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    userProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.profileId),
    role: d.mysqlEnum(["member", "officer", "owner"]),
  }),
  (t) => [
    primaryKey({ columns: [t.organizationProfileId, t.userProfileId] }),
    // TODO: how can we constrain organizationId to profiles only with `profile.type = 'organization'`?
  ],
);

export const sessions = mysqlTable("session", (d) => ({
  createdAt: d.timestamp().defaultNow().notNull(),
  userAgent: d.text(),
  userProfileId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.profileId, { onDelete: "cascade" }),
  token: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() =>
      Buffer.from(crypto.getRandomValues(new Uint8Array(128))).toString(
        "base64",
      ),
    ),
}));
