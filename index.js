import "dotenv/config";
import express from "express";
import fetch from "node-fetch";

// متغيرات البيئة
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "reply_to_comments_938271";
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
        if (
          change.field === "feed" &&
          change.value &&
          change.value.item === "comment"
        ) {
          const commentId = change.value.comment_id;
          const commentMessage = change.value.message || "";
          const commenterId = change.value.from.id;
          const commenterName = change.value.from.name;

          console.log(`New comment received: ${commentMessage}`);

          // التحقق من أن التعليق ليس من الصفحة نفسها
          if (commenterId === process.env.PAGE_ID) {
            console.log(`Skipping comment ${commentId} from the page itself.`);
            continue;
          }

          // تقسيم الاسم الكامل إلى الاسم الأول والأخير
          const [firstName, ...lastNameParts] = commenterName.split(" ");
          const lastName = lastNameParts.join(" ");
          // تنسيق ألوان الرد على التعليق
          const replyColor = "blue";
          const replyBackgroundColor = "lightblue";
          const replyStyle = `color: ${replyColor}; background-color: ${replyBackgroundColor}; padding: 5px; border-radius: 5px;`;

          // عرض اسم المستخدم بشكل منسق
          let formattedName = `${firstName} ${lastName}`;
          // الرد على التعليق
          const replyMessage = `
            شكراً لك يا ${formattedName} على تفاعلك معنا! سيقوم أحد مسؤولي المبيعات بالرد عليكم.
          `;
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
            console.log(
              `Replied to comment ${commentId} with '${replyMessage}'`
            );
          } catch (error) {
            console.error(
              `Error replying to comment ${commentId}:`,
              error.message
            );
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
