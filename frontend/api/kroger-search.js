export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const { query, locationId } = req.query;

  if (!query) {
    return res.status(400).json({ error: "query parameter is required" });
  }

  try {
    // First get a token
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

    if (!tokenRes.ok) {
      return res.status(tokenRes.status).json({ error: tokenData });
    }

    // Then search for products
    const params = new URLSearchParams({
      "filter.term": query,
      "filter.limit": "10",
    });

    if (locationId) {
      params.append("filter.locationId", locationId);
    }

    const searchRes = await fetch(
      `https://api-ce.kroger.com/v1/products?${params}`,
      {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
        },
      },
    );

    const searchData = await searchRes.json();

    if (!searchRes.ok) {
      return res.status(searchRes.status).json({ error: searchData });
    }

    res.status(200).json(searchData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
