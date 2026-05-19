export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const { zip } = req.query;

  try {
    const credentials = Buffer.from(
      `${process.env.KROGER_CLIENT_ID}:${process.env.KROGER_CLIENT_SECRET}`,
    ).toString("base64");

    const tokenRes = await fetch(
      "https://api-ce.kroger.com/v1/connect/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${credentials}`,
        },
        body: "grant_type=client_credentials&scope=product.compact",
      },
    );

    const tokenData = await tokenRes.json();

    const locRes = await fetch(
      `https://api-ce.kroger.com/v1/locations?filter.zipCode.near=${zip || "95814"}&filter.limit=5`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      },
    );

    const locData = await locRes.json();
    res.status(200).json(locData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
