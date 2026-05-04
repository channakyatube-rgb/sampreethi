import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (event: { httpMethod: string; body: string }) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const requiredEnv = [
      "R2_ENDPOINT",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
      "R2_PUBLIC_URL",
    ];

    const missingEnv = requiredEnv.filter((key) => !process.env[key] || process.env[key]?.trim().length === 0);
    if (missingEnv.length > 0) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: `Missing Netlify function env vars: ${missingEnv.join(", ")}`,
        }),
      };
    }

    const parsedBody = JSON.parse(event.body || "{}");
    const fileName = String(parsedBody.fileName || "").trim();
    const contentType = String(parsedBody.contentType || "application/octet-stream");
    const category = String(parsedBody.category || "other");

    if (!fileName) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "fileName is required" }),
      };
    }

    const s3 = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });

    const sanitizedCategory = category.replace(/[^a-zA-Z0-9-_]/g, "_");
    const key = `${sanitizedCategory}/${Date.now()}-${fileName}`;

    const uploadUrl = await getSignedUrl(
      s3,
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        ContentType: contentType || "application/octet-stream",
      }),
      { expiresIn: 3600 }
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadUrl, publicUrl }),
    };
  } catch (err) {
    console.error("R2 presign error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to generate upload URL" }),
    };
  }
};
