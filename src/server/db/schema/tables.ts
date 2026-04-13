import { createId } from "@paralleldrive/cuid2";
import { sql, type SQL } from "drizzle-orm";
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

export const events = mysqlTable(
  "event",
  (d) => ({
    id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
    organizerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    accessRank: d.int(),
    title: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
    start: d.datetime().notNull(),
    end: d.datetime().notNull(),
    allDay: d.boolean().notNull(),
    rrule: d.text(),
    location: d.text(),
  }),
  (t) => [
    foreignKey({
      columns: [t.organizerId, t.accessRank],
      foreignColumns: [
        permissionGroups.organizationProfileId,
        permissionGroups.rank,
      ],
    }),
  ],
);

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
    accessRank: d.int(),
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
  (t) => [
    index("author_idx").on(t.authorId),
    foreignKey({
      columns: [t.authorId, t.accessRank],
      foreignColumns: [
        permissionGroups.organizationProfileId,
        permissionGroups.rank,
      ],
    }),
  ],
);

export const postAttachments = mysqlTable(
  "post_attachment",
  (d) => ({
    ownerId: d.varchar({ length: 255 }).notNull(),
    contentHash: d.varchar({ length: 255 }).notNull(),
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
  }),
  (t) => [
    primaryKey({ columns: [t.ownerId, t.contentHash] }),
    foreignKey({
      columns: [t.ownerId, t.contentHash],
      foreignColumns: [uploads.ownerId, uploads.contentHash],
    }),
  ],
);

export const voteValue = mysqlEnum([
  "up",
  "down.incorrect",
  "down.harmful",
  "down.spam",
]);

export const postVotes = mysqlTable(
  "post_vote",
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
  "comment",
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
  "comment_vote",
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

export const postTags = mysqlTable(
  "post_tag",
  (d) => ({
    postId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => posts.id),
    tagId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tags.id),
  }),
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const eventTags = mysqlTable(
  "event_tag",
  (d) => ({
    eventId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => events.id),
    tagId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tags.id),
  }),
  (t) => [primaryKey({ columns: [t.eventId, t.tagId] })],
);

export const profiles = mysqlTable("profile", (d) => ({
  id: d.varchar({ length: 255 }).primaryKey().$defaultFn(createId),
  type: d.mysqlEnum(["user", "organization"]).notNull(),
  name: d.varchar({ length: 255 }).notNull(),
  bio: d.text({}),
  linkedin: d.varchar({ length: 255 }),
  github: d.varchar({ length: 255 }),
  personalSite: d.varchar({ length: 255 }),
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
    onboardingCompleted: d.boolean().default(false).notNull(),
    createdAt: d.timestamp("created_at").defaultNow().notNull(),
    updatedAt: d.timestamp("updated_at").onUpdateNow(),
  }),
  (t) => [uniqueIndex("email_idx").on(lower(t.email))],
);

export const userInterests = mysqlTable(
  "user_interest",
  (d) => ({
    userProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.profileId, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    tagId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => tags.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    weight: d.decimal({ precision: 3, scale: 2 }).notNull().default("1.00"),
    createdAt: d.timestamp().defaultNow().notNull(),
    updated: d.timestamp().onUpdateNow(),
  }),
  (t) => [primaryKey({ columns: [t.userProfileId, t.tagId] })],
);

export const permissionGroups = mysqlTable(
  "organization_permission_group",
  (d) => ({
    organizationProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    permissions: d.int().default(0).notNull(),
    display: d.boolean().default(true).notNull(),
    rank: d.int().notNull().default(0),
    title: d.varchar({ length: 255 }).notNull(),
    description: d.text(),
  }),
  (t) => [primaryKey({ columns: [t.organizationProfileId, t.rank] })],
);

export const organizations = mysqlTable(
  "organization",
  (d) => ({
    organizationProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    userProfileId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.profileId, {
        onUpdate: "cascade",
        onDelete: "cascade",
      }),
    rank: d.int().notNull(),
    role: d.varchar({ length: 255 }).notNull().default("Member"),
  }),
  (t) => [
    primaryKey({ columns: [t.organizationProfileId, t.userProfileId] }),
    foreignKey({
      columns: [t.organizationProfileId, t.rank],
      foreignColumns: [
        permissionGroups.organizationProfileId,
        permissionGroups.rank,
      ],
    }),
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

export const uploads = mysqlTable(
  "upload",
  (d) => ({
    ownerId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => profiles.id),
    contentHash: d.varchar({ length: 255 }).notNull(),
    bucket: d.varchar({ length: 255 }).notNull(),
    name: d.varchar({ length: 255 }).notNull(),
    type: d.varchar({ length: 255 }).notNull(),
    size: d.int().notNull(),
    createdAt: d.timestamp().notNull().defaultNow(),
    verified: d.boolean().notNull().default(false),
    expires: d.timestamp(),
  }),
  (t) => [
    index("owner_idx").on(t.ownerId),
    primaryKey({ columns: [t.ownerId, t.contentHash] }),
  ],
);
