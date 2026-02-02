import { createId } from "@paralleldrive/cuid2";
import {
  foreignKey,
  index,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";
import { lower } from "./utils";
import { type SQL, sql } from "drizzle-orm";

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

export const eventsRelations = relations(events, ({ one }) => ({
  profile: one(profiles, {
    fields: [events.organizerId],
    references: [profiles.id],
  }),
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
    flagCount: d.int().notNull().default(0),
    createdAt: d.timestamp().defaultNow().notNull(),
    updatedAt: d.timestamp().onUpdateNow(),
  }),
  (t) => [index("author_idx").on(t.authorId)],
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  tags: many(tagsToPosts),
  author: one(profiles, {
    fields: [posts.authorId],
    references: [profiles.id],
  }),
  event: one(events, {
    fields: [posts.eventId],
    references: [events.id],
  }),
  votes: many(postVotes),
  comments: many(comments),
}));

export const voteValue = mysqlEnum([
  "up",
  "down.incorrect",
  "down.harmful",
  "down.spam",
]);

export const postVotes = mysqlTable(
  "postVote",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
    value: voteValue.notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.postId] })],
);

export const postVotesRelations = relations(postVotes, ({ one }) => ({
  post: one(posts, {
    fields: [postVotes.postId],
    references: [posts.id],
  }),
}));

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

export const commentRelations = relations(comments, ({ one, many }) => ({
  author: one(profiles, {
    fields: [comments.authorId],
    references: [profiles.id],
  }),
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  votes: many(commentVotes),
  replies: many(comments, { relationName: "replies" }),
  parent: one(comments, {
    relationName: "replies",
    fields: [comments.parentId],
    references: [comments.id],
  }),
}));

export const commentVotes = mysqlTable(
  "commentVote",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    commentId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => comments.id),
    value: voteValue.notNull(),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.commentId] })],
);

export const commentVotesRelations = relations(commentVotes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentVotes.commentId],
    references: [comments.id],
  }),
}));

export const tags = mysqlTable("tag", (d) => ({
  id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
  lft: d.int().notNull(),
  rgt: d.int().notNull(),
  depth: d.int().notNull(),
  name: d.varchar({ length: 255 }).notNull().unique(),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(tagsToPosts),
  subscribers: many(subscriptions),
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

export const tagsToPostsRelations = relations(tagsToPosts, ({ one }) => ({
  tag: one(tags, {
    fields: [tagsToPosts.tagId],
    references: [tags.id],
  }),
  post: one(posts, {
    fields: [tagsToPosts.postId],
    references: [posts.id],
  }),
}));

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

export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  events: many(events),
}));

export const users = mysqlTable(
  "user",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .primaryKey()
      .references(() => profiles.id),
    email: varchar("email", { length: 255 }).notNull(),
    role: d.mysqlEnum(["user", "moderator"]).default("user").notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    updatedAt: d.timestamp("updated_at").onUpdateNow(),
  }),
  (t) => [uniqueIndex("email_idx").on(lower(t.email))],
);

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  subscriptions: many(subscriptions),
  organizations: many(organizations),
  sessions: many(sessions),
}));

export const subscriptions = mysqlTable(
  "subscription",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    tagId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tags.id),
  }),
  (t) => [primaryKey({ columns: [t.userId, t.tagId] })],
);

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  tag: one(tags, {
    fields: [subscriptions.tagId],
    references: [tags.id],
  }),
}));

export const organizations = mysqlTable(
  "organization",
  (d) => ({
    organizationId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    role: d.mysqlEnum(["member", "officer", "owner"]),
  }),
  (t) => [
    primaryKey({ columns: [t.organizationId, t.userId] }),
    // TODO: how can we constrain organizationId to profiles only with `profile.type = 'organization'`?
  ],
);

export const organizationsRelations = relations(organizations, ({ one }) => ({
  organization: one(profiles, {
    fields: [organizations.organizationId],
    references: [profiles.id],
  }),
  user: one(users, {
    fields: [organizations.userId],
    references: [users.id],
  }),
}));

export const sessions = mysqlTable("session", (d) => ({
  createdAt: d.timestamp().defaultNow().notNull(),
  userAgent: d.text(),
  userId: d
    .varchar({ length: 255 })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: d
    .varchar({ length: 255 })
    .primaryKey()
    .$defaultFn(() =>
      Buffer.from(crypto.getRandomValues(new Uint8Array(128))).toString(
        "base64",
      ),
    ),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
