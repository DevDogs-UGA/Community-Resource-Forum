import { db } from "~/server/db"; 
import { posts, profiles, events, likes, flags } from "~/server/db/schema"; 
import { sql } from "drizzle-orm"; 

import Post from "~/components/Post"; 

export default async function AdminPage() {
    const results = await db.query.posts.findMany({
        with: {
            author: true, 
            event: true, 
            flags: true 
        }, 
        where: sql`EXISTS (SELECT 1 FROM ${flags} WHERE ${flags.postId} = ${posts.id})`, 
        orderBy: sql`(SELECT COUNT(*) FROM ${flags} WHERE ${flags.postId} = ${posts.id}) DESC`,
    }); 

    return (
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-6">
            {results.map(({ id, createdAt, updatedAt, content, authorId, eventId, likeCount, event, flags, author }) => (
                <Post key={id} post={{ id, createdAt, updatedAt, content, authorId, eventId, likeCount }} profile={author} event={event!} like={null} session={null} />   
            ))}
        </div>
    ); 
}