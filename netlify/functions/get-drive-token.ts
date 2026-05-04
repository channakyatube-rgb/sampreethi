import { google } from "googleapis";

export const handler = async (event: { httpMethod: string; body: string }) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const requiredEnv = [
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY",
      "GOOGLE_DRIVE_ROOT_FOLDER",
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
    const category = String(parsedBody.category || "").trim();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    });

    const client = await auth.getClient();
    const { token } = await client.getAccessToken();

    // Map category name to its Drive folder ID
    // GOOGLE_DRIVE_FOLDER_IDS should be a JSON string like:
    // {"Plywood Sheets":"folderID1","Doors":"folderID2",...}
    const folderIds: Record<string, string> = JSON.parse(
      process.env.GOOGLE_DRIVE_FOLDER_IDS || "{}"
    );

    const folderId = folderIds[category] || process.env.GOOGLE_DRIVE_ROOT_FOLDER!;

    if (!folderId) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          error: "No Drive folderId could be resolved. Set GOOGLE_DRIVE_ROOT_FOLDER or GOOGLE_DRIVE_FOLDER_IDS.",
        }),
      };
    }

    if (!token) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Google auth did not return an access token." }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, folderId }),
    };
  } catch (err) {
    console.error("Drive token error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to get Drive token" }),
    };
  }
};
