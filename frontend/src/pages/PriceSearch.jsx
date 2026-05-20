import { useState } from "react";
import { supabase } from "../lib/supabase";

const SACRAMENTO_LOCATION = "70400355";

function PriceSearch({ user }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [addedItems, setAddedItems] = useState({});

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch(
        `/api/kroger-search?query=${encodeURIComponent(query)}&locationId=${SACRAMENTO_LOCATION}`,
      );
      const data = await res.json();

      if (data.error) throw new Error(JSON.stringify(data.error));

      // Filter to only products that have a price
      const withPrices = (data.data || []).filter(
        (p) => p.items?.[0]?.price?.regular,
      );
      setResults(withPrices);
    } catch (err) {
      setError("Search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function addToList(product) {
    if (!user) {
      setError("Please log in to save items to your list");
      return;
    }

    const item = product.items[0];
    const price = item.price.regular;
    const name = product.description.replace(/®|™/g, "").trim();
    const productId = product.productId;

    try {
      // Upsert item into items table
      const { data: itemData, error: itemError } = await supabase
        .from("items")
        .upsert(
          {
            name,
            category: product.categories?.[0] || "General",
            unit: item.size || "each",
          },
          { onConflict: "name", ignoreDuplicates: false },
        )
        .select()
        .single();

      if (itemError) throw itemError;

      // Get or create user's default list
      let { data: lists } = await supabase
        .from("grocery_lists")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      let listId;
      if (!lists || lists.length === 0) {
        const { data: newList, error: listError } = await supabase
          .from("grocery_lists")
          .insert({ user_id: user.id, name: "My List" })
          .select()
          .single();
        if (listError) throw listError;
        listId = newList.id;
      } else {
        listId = lists[0].id;
      }

      // Add to list
      const { error: listItemError } = await supabase
        .from("list_items")
        .insert({ list_id: listId, item_id: itemData.id, quantity: 1 });

      if (listItemError) throw listItemError;

      setAddedItems((prev) => ({ ...prev, [productId]: true }));
    } catch (err) {
      setError("Could not add item: " + err.message);
    }
  }

  function getFeaturedImage(product) {
    const images = product.images || [];
    const front = images.find((i) => i.perspective === "front");
    const img = front || images[0];
    return img?.sizes?.find((s) => s.size === "medium")?.url || null;
  }

  return (
    <div className="price-search">
      <div className="search-header">
        <h1>🔍 Find Grocery Prices</h1>
        <p>Search real-time prices from Foods Co Sacramento</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search for milk, eggs, bread..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="auth-error">{error}</div>}

      {!loading && results.length === 0 && query && (
        <p className="no-results">
          No products with prices found. Try a different search.
        </p>
      )}

      <div className="results-grid">
        {results.map((product) => {
          const item = product.items[0];
          const price = item.price.regular;
          const salePrice = item.price.promo;
          const image = getFeaturedImage(product);
          const added = addedItems[product.productId];

          return (
            <div key={product.productId} className="product-card">
              {image && (
                <img
                  src={image}
                  alt={product.description}
                  className="product-image"
                />
              )}
              <div className="product-info">
                <span className="product-brand">{product.brand}</span>
                <h3 className="product-name">{product.description}</h3>
                <span className="product-size">{item.size}</span>
                <div className="product-price">
                  {salePrice ? (
                    <>
                      <span className="price-sale">
                        ${salePrice.toFixed(2)}
                      </span>
                      <span className="price-regular-strike">
                        ${price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span className="price-regular">${price.toFixed(2)}</span>
                  )}
                </div>
                <div className="product-badges">
                  {item.fulfillment?.inStore && (
                    <span className="badge">In Store</span>
                  )}
                  {item.fulfillment?.delivery && (
                    <span className="badge">Delivery</span>
                  )}
                  {item.fulfillment?.curbside && (
                    <span className="badge">Curbside</span>
                  )}
                </div>
                <button
                  onClick={() => addToList(product)}
                  className={`btn-add ${added ? "btn-added" : ""}`}
                  disabled={added}
                >
                  {added ? "✓ Added to List" : "+ Add to List"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PriceSearch;
