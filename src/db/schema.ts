import { createId } from "@paralleldrive/cuid2";
import { type SQL, sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  mysqlTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  varchar,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm/relations";

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
    content: d.text(),
    authorId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    eventId: d.varchar({ length: 255 }).references(() => events.id),
    createdAt: d.timestamp().defaultNow().notNull(),
    updatedAt: d.timestamp().onUpdateNow(),
  }),
  (t) => [index("author_idx").on(t.authorId)],
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  tags: many(tagsToPosts),
  replies: many(replies),
  author: one(profiles, {
    fields: [posts.authorId],
    references: [profiles.id],
  }),
  event: one(events, {
    fields: [posts.eventId],
    references: [events.id],
  }),
}));

export const replies = mysqlTable(
  "reply",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    content: d.text().notNull(),
    authorId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
    parentId: d.varchar({ length: 255 }),
    createdAt: d.timestamp().defaultNow().notNull(),
    updatedAt: d.timestamp().onUpdateNow(),
  }),
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }),
    index("author_idx").on(t.authorId),
  ],
);

export const repliesRelations = relations(replies, ({ one, many }) => ({
  post: one(posts, {
    fields: [replies.postId],
    references: [posts.id],
  }),
  parent: one(replies, {
    fields: [replies.parentId],
    references: [replies.id],
    relationName: "parent",
  }),
  replies: many(replies, { relationName: "replies" }),
  author: one(profiles, {
    fields: [replies.authorId],
    references: [profiles.id],
  }),
}));

export const tags = mysqlTable(
  "tag",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    name: d.varchar({ length: 255 }).notNull().unique(),
    parentId: d.varchar({ length: 255 }),
  }),
  (t) => [
    foreignKey({
      columns: [t.parentId],
      foreignColumns: [t.id],
    }),
  ],
);

export const tagsRelations = relations(tags, ({ one, many }) => ({
  posts: many(tagsToPosts),
  subscribers: many(subscriptions),
  parent: one(tags, {
    fields: [tags.parentId],
    references: [tags.id],
  }),
  children: many(tags),
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
  image: d.varchar({ length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").onUpdateNow(),
}));

export const profilesRelations = relations(profiles, ({ many }) => ({
  posts: many(posts),
  replies: many(replies),
  events: many(events),
}));

export function lower(email: AnyMySqlColumn): SQL {
  return sql`(lower(${email}))`;
}

export const users = mysqlTable(
  "user",
  (d) => ({
    id: d
      .varchar({ length: 255 })
      .primaryKey()
      .references(() => profiles.id),
    email: varchar("email", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").onUpdateNow(),
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
