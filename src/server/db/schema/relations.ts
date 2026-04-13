import { defineRelations } from "drizzle-orm";
import * as tables from "./tables";

const relations = defineRelations(tables, (r) => ({
  events: {
    organizer: r.one.profiles({
      from: r.events.organizerId,
      to: r.profiles.id,
      optional: false,
    }),
    minPermissionGroup: r.one.permissionGroups({
      from: [r.events.organizerId, r.events.accessRank],
      to: [r.permissionGroups.organizationProfileId, r.permissionGroups.rank],
    }),
  },
  posts: {
    author: r.one.profiles({
      from: r.posts.authorId,
      to: r.profiles.id,
      optional: false,
    }),
    event: r.one.events({
      from: r.posts.eventId,
      to: r.events.id,
    }),
    tags: r.many.tags({
      from: r.posts.id.through(r.postTags.postId),
      to: r.tags.id.through(r.postTags.tagId),
    }),
    votes: r.many.postVotes({
      from: r.posts.id,
      to: r.postVotes.postId,
    }),
    comments: r.many.comments({
      from: r.posts.id,
      to: r.comments.postId,
    }),
    attachments: r.many.postAttachments({
      from: r.posts.id,
      to: r.postAttachments.postId,
    }),
    minPermissionGroup: r.one.permissionGroups({
      from: [r.posts.authorId, r.posts.accessRank],
      to: [r.permissionGroups.organizationProfileId, r.permissionGroups.rank],
    }),
  },
  postAttachments: {
    post: r.one.posts({
      from: r.postAttachments.postId,
      to: r.posts.id,
    }),
    upload: r.one.uploads({
      from: [r.postAttachments.ownerId, r.postAttachments.contentHash],
      to: [r.uploads.ownerId, r.uploads.contentHash],
    }),
  },
  comments: {
    author: r.one.profiles({
      from: r.comments.authorId,
      to: r.profiles.id,
      optional: false,
    }),
    originalPost: r.one.posts({
      from: r.comments.postId,
      to: r.posts.id,
      optional: false,
    }),
    parentComment: r.one.comments({
      from: r.comments.parentId,
      to: r.comments.id,
    }),
    votes: r.many.commentVotes({
      from: r.comments.id,
      to: r.commentVotes.commentId,
    }),
    replies: r.many.comments({
      from: r.comments.id,
      to: r.comments.parentId,
    }),
  },
  users: {
    profile: r.one.profiles({
      from: r.users.profileId,
      to: r.profiles.id,
      optional: false,
    }),
    organizationMemberships: r.many.organizations({
      from: r.users.profileId,
      to: r.organizations.userProfileId,
    }),
    organizationPermissions: r.many.permissionGroups({
      from: r.users.profileId.through(r.organizations.userProfileId),
      to: r.permissionGroups.organizationProfileId.through(
        r.organizations.organizationProfileId,
      ),
    }),
  },
  organizations: {
    profile: r.one.profiles({
      from: r.organizations.organizationProfileId,
      to: r.profiles.id,
      optional: false,
    }),
    events: r.many.events({
      from: r.organizations.organizationProfileId,
      to: r.events.organizerId,
    }),
    members: r.many.users({
      from: r.organizations.userProfileId,
      to: r.users.profileId,
    }),
    permissionGroups: r.many.permissionGroups({
      from: [r.organizations.organizationProfileId, r.organizations.rank],
      to: [r.permissionGroups.organizationProfileId, r.permissionGroups.rank],
    }),
  },
  permissionGroups: {
    profile: r.one.profiles({
      from: r.permissionGroups.organizationProfileId,
      to: r.profiles.id,
      optional: false,
    }),
  },
  profiles: {
    posts: r.many.posts({
      from: r.profiles.id,
      to: r.posts.authorId,
    }),
    events: r.many.events({
      from: r.profiles.id,
      to: r.events.organizerId,
    }),
    comments: r.many.comments({
      from: r.profiles.id,
      to: r.comments.authorId,
    }),
    uploads: r.many.uploads({
      from: r.profiles.id,
      to: r.uploads.ownerId,
    }),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userProfileId,
      to: r.users.profileId,
      optional: false,
    }),
  },
  uploads: {
    owner: r.one.profiles({
      from: r.uploads.ownerId,
      to: r.profiles.id,
    }),
    attachedProfile: r.one.profiles({
      from: [r.uploads.ownerId, r.uploads.contentHash],
      to: [r.profiles.id, r.profiles.image],
    }),
    attachedPost: r.many.posts({
      from: [
        r.uploads.ownerId.through(r.postAttachments.ownerId),
        r.uploads.contentHash.through(r.postAttachments.contentHash),
      ],
      to: r.posts.id.through(r.postAttachments.postId),
    }),
  },
}));

export default relations;
