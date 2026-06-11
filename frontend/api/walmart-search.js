// api/walmart-search.js
// Walmart Affiliate API product search
// Mirrors the pattern of kroger-search.js — proxies credentials server-side
//
// SETUP:
//   1. Sign up at walmart.io and get your Consumer ID and Private Key
//   2. Add to Vercel environment variables:
//        WALMART_CONSUMER_ID   → your Consumer ID from walmart.io
//        WALMART_PRIVATE_KEY   → your Private Key (base64-encoded RSA key)
//   3. Deploy — this function stays server-side, keys never reach the browser

import crypto from "crypto";

export default async function handler(req, res) {
  // CORS — allow your main site and local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  const { query, limit = 10 } = req.query;
  if (!query)
    return res.status(400).json({ error: "query parameter is required" });

  const consumerId = process.env.WALMART_CONSUMER_ID;
  const privateKey = process.env.WALMART_PRIVATE_KEY;

  if (!consumerId || !privateKey) {
    return res
      .status(500)
      .json({ error: "Walmart credentials not configured" });
  }

  try {
    // Build Walmart auth headers (WM_SEC.AUTH_SIGNATURE pattern)
    const timestamp = Date.now().toString();
    const correlationId = crypto.randomUUID();

    // String to sign: consumerId + \n + timestamp + \n
    const stringToSign = `${consumerId}\n${timestamp}\n`;

    // Sign with RSA-SHA256 using the private key
    const privateKeyBuffer = Buffer.from(privateKey, "base64");
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(stringToSign);
    const signature = sign.sign(privateKeyBuffer, "base64");

    const searchUrl = new URL(
      "https://developer.api.walmart.com/api-proxy/service/affil/product/v2/search",
    );
    searchUrl.searchParams.set("query", query);
    searchUrl.searchParams.set(
      "numItems",
      Math.min(parseInt(limit), 25).toString(),
    );
    searchUrl.searchParams.set("responseGroup", "full");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        "WM_SEC.KEY_VERSION": "1",
        "WM_CONSUMER.ID": consumerId,
        "WM_CONSUMER.INTIMESTAMP": timestamp,
        "WM_SEC.AUTH_SIGNATURE": signature,
        "WM_SVC.NAME": "Walmart Affiliate APIs",
        WM_CORRELATION_ID: correlationId,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Walmart API error:", response.status, errorText);
      return res.status(response.status).json({
        error: "Walmart API request failed",
        status: response.status,
      });
    }

    const data = await response.json();

    // Normalize to the same shape as kroger-search results
    // so your frontend can render both stores identically
    const items = (data.items || []).map((item) => ({
      source: "walmart",
      itemId: String(item.itemId),
      name: item.name,
      brand: item.brandName || "",
      price: item.salePrice ?? item.msrp ?? null,
      regularPrice: item.msrp ?? null,
      onSale:
        item.salePrice != null && item.salePrice < (item.msrp ?? Infinity),
      upc: item.upc || "",
      imageUrl:
        item.largeImage || item.mediumImage || item.thumbnailImage || "",
      productUrl:
        item.productUrl || `https://www.walmart.com/ip/${item.itemId}`,
      size: item.size || "",
      category: item.categoryPath || "",
      inStock: item.availableOnline !== false,
      affiliateUrl: item.affiliateAddToCartUrl || item.productUrl || "",
    }));

    return res.status(200).json({
      source: "walmart",
      query,
      total: data.totalResults || items.length,
      items,
    });
  } catch (err) {
    console.error("walmart-search error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error", message: err.message });
  }
}
