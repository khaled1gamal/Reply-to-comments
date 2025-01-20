import "dotenv/config";
import fetch from "node-fetch";
import { Facebook } from "facebook-sdk";

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PAGE_ID = process.env.PAGE_ID;

const graph = new Facebook(ACCESS_TOKEN);

async function getNewComments() {
  try {
    //console.log(`Fetching posts for page: ${PAGE_ID}`);
    const posts = await fetch(
      `https://graph.facebook.com/v21.0/515812101950051/posts?access_token=${ACCESS_TOKEN}`
    ).then((res) => res.json());

    //console.log("posts data", posts.data);

    if (!posts || !posts.data) {
      console.error("No posts returned. Check your PAGE_ID or ACCESS_TOKEN.");
      return [];
    }

    //console.log(`Fetched posts:`, posts);

    let allComments = [];
    for (const post of posts.data) {
      //console.log(`Fetching comments for post: ${post.id}`);
      const comments = await fetch(
        `https://graph.facebook.com/v21.0/${post.id}/comments?access_token=${ACCESS_TOKEN}`
      ).then((res) => res.json());
      //console.log("comments", comments);
      if (comments && comments.data) {
        allComments = allComments.concat(comments.data);
      } else {
        console.log(`No comments found for post: ${post.id}`);
      }
    }
    return allComments;
  } catch (error) {
    console.error("Error retrieving comments:", error.message, error.response);
    return [];
  }
}

async function analyzeAndReply(comments) {
  for (const comment of comments) {
    const commentId = comment.id;
    const replyMessage = "This is a reply to a comment.";

    try {
      await fetch(
        `https://graph.facebook.com/v21.0/${commentId}/comments?message=replyMessage&access_token=${ACCESS_TOKEN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: replyMessage,
          }),
        }
      );
      //console.log(`Replied to comment ${commentId} with '${replyMessage}'`);
    } catch (error) {
      console.error(`Error replying to comment ${commentId}:`, error.message);
    }
  }
}

async function main() {
  const comments = await getNewComments();

  if (comments && comments.length > 0) {
    await analyzeAndReply(comments);
  } else {
    console.log("No new comments found.");
  }
}

main();
