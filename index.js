
// import "dotenv/config";
// import fetch from "node-fetch";
// import { Facebook } from "facebook-sdk";

// const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
// const PAGE_ID = process.env.PAGE_ID;

// const graph = new Facebook(ACCESS_TOKEN);

// async function getNewComments() {
//   try {
//     //console.log(`Fetching posts for page: ${PAGE_ID}`);
//     const posts = await fetch(
//       `https://graph.facebook.com/v21.0/515812101950051/posts?access_token=${ACCESS_TOKEN}`
//     ).then((res) => res.json());

//     //console.log("posts data", posts.data);

//     if (!posts || !posts.data) {
//       console.error("No posts returned. Check your PAGE_ID or ACCESS_TOKEN.");
//       return [];
//     }

//     //console.log(`Fetched posts:`, posts);

//     let allComments = [];
//     for (const post of posts.data) {
//       //console.log(`Fetching comments for post: ${post.id}`);
//       const comments = await fetch(
//         `https://graph.facebook.com/v21.0/${post.id}/comments?access_token=${ACCESS_TOKEN}`
//       ).then((res) => res.json());
//       //console.log("comments", comments);
//       if (comments && comments.data) {
//         allComments = allComments.concat(comments.data);
//       } else {
//         console.log(`No comments found for post: ${post.id}`);
//       }
//     }
//     return allComments;
//   } catch (error) {
//     console.error("Error retrieving comments:", error.message, error.response);
//     return [];
//   }
// }

// async function analyzeAndReply(comments) {
//   for (const comment of comments) {
//     const commentId = comment.id;
//     const replyMessage = "This is a reply to a comment.";

//     try {
//       await fetch(
//         `https://graph.facebook.com/v21.0/${commentId}/comments?message=replyMessage&access_token=${ACCESS_TOKEN}`,
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             message: replyMessage,
//           }),
//         }
//       );
//       //console.log(`Replied to comment ${commentId} with '${replyMessage}'`);
//     } catch (error) {
//       console.error(`Error replying to comment ${commentId}:`, error.message);
//     }
//   }
// }

// async function main() {
//   const comments = await getNewComments();

//   if (comments && comments.length > 0) {
//     await analyzeAndReply(comments);
//   } else {
//     console.log("No new comments found.");
//   }
// }

// setInterval(() => {
//   main();
// }, 1000);

import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

// متغيرات البيئة
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "your_verify_token";
const graphUrl = "https://graph.facebook.com/v21.0";

// إعداد الخادم باستخدام Express
const app = express();
app.use(express.json());

// التحقق من إعداد Webhook
app.get("/webhooks", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook verified successfully!");
    res.status(200).send(challenge); // إرسال قيمة التحدي للتحقق
  } else {
    console.error("Verification failed. Token mismatch or invalid mode.");
    res.status(403).send("Verification failed"); // إذا لم يتطابق الرمز
  }
});

// معالجة الإشعارات الواردة من Facebook
app.post("/webhooks", async (req, res) => {
  const body = req.body;

  // التحقق من أن الإشعار خاص بالصفحة
  if (body.object === "page") {
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === "feed" && change.value && change.value.item === "comment") {
          const commentId = change.value.comment_id;
          const commentMessage = change.value.message || "";

          console.log(`New comment received: ${commentMessage}`);

          // الرد على التعليق
          const replyMessage = "شكراً لتفاعلك معنا!";
          try {
            await fetch(`${graphUrl}/${commentId}/comments`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                message: replyMessage,
                access_token: ACCESS_TOKEN,
              }),
            });
            console.log(`Replied to comment ${commentId} with '${replyMessage}'`);
          } catch (error) {
            console.error(`Error replying to comment ${commentId}:`, error.message);
          }
        }
      }
    }
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.status(404).send();
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Webhook server is running on port ${PORT}`);
});

export default app;