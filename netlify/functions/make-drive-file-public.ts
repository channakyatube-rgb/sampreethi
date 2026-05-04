export const handler = async (event: { httpMethod: string; body: string }) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const parsedBody = JSON.parse(event.body || "{}");
    const fileId = String(parsedBody.fileId || "").trim();
    const token = String(parsedBody.token || "").trim();

    if (!fileId || !token) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "fileId and token are required" }),
      };
    }

    // Grant public read access to the file
    const permRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: "reader", type: "anyone" }),
      }
    );

    if (!permRes.ok) {
      const detail = await permRes.text();
      throw new Error(`Permission set failed: ${detail}`);
    }

    // Return a direct view URL
    const publicUrl = `https://drive.google.com/file/d/${fileId}/view`;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicUrl }),
    };
  } catch (err) {
    console.error("Drive make-public error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to make file public" }),
    };
  }
};
