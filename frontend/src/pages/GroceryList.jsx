import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function GroceryList({ user }) {
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(null);
  const [listItems, setListItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchLists();
  }, [user]);

  async function fetchLists() {
    setLoading(true);
    const { data, error } = await supabase
      .from("grocery_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setLists(data || []);
      if (data?.length > 0) {
        setActiveList(data[0]);
        fetchListItems(data[0].id);
      }
    }
    setLoading(false);
  }

  async function fetchListItems(listId) {
    const { data, error } = await supabase
      .from("list_items")
      .select(
        `
        *,
        items (
          id,
          name,
          category,
          unit
        )
      `,
      )
      .eq("list_id", listId)
      .order("created_at", { ascending: true });

    if (!error) setListItems(data || []);
  }

  async function createList() {
    if (!newListName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("grocery_lists")
      .insert({ user_id: user.id, name: newListName.trim() })
      .select()
      .single();

    if (!error) {
      setLists((prev) => [data, ...prev]);
      setActiveList(data);
      setListItems([]);
      setNewListName("");
    }
    setCreating(false);
  }

  async function toggleChecked(listItem) {
    const { error } = await supabase
      .from("list_items")
      .update({ checked: !listItem.checked })
      .eq("id", listItem.id);

    if (!error) {
      setListItems((prev) =>
        prev.map((i) =>
          i.id === listItem.id ? { ...i, checked: !i.checked } : i,
        ),
      );
    }
  }

  async function removeItem(listItemId) {
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", listItemId);

    if (!error) {
      setListItems((prev) => prev.filter((i) => i.id !== listItemId));
    }
  }

  async function deleteList(listId) {
    const { error } = await supabase
      .from("grocery_lists")
      .delete()
      .eq("id", listId);

    if (!error) {
      const remaining = lists.filter((l) => l.id !== listId);
      setLists(remaining);
      if (remaining.length > 0) {
        setActiveList(remaining[0]);
        fetchListItems(remaining[0].id);
      } else {
        setActiveList(null);
        setListItems([]);
      }
    }
  }

  const checkedCount = listItems.filter((i) => i.checked).length;
  const totalCount = listItems.length;

  if (loading) return <div className="status">Loading your lists...</div>;

  return (
    <div className="grocery-list-page">
      <div className="list-sidebar">
        <h2>My Lists</h2>

        <div className="new-list-form">
          <input
            type="text"
            placeholder="New list name..."
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && createList()}
            className="search-input"
          />
          <button
            onClick={createList}
            disabled={creating || !newListName.trim()}
            className="btn-primary"
          >
            {creating ? "..." : "+"}
          </button>
        </div>

        <ul className="lists-nav">
          {lists.length === 0 && (
            <p className="empty-hint">No lists yet. Create one above!</p>
          )}
          {lists.map((list) => (
            <li
              key={list.id}
              className={`list-nav-item ${activeList?.id === list.id ? "active" : ""}`}
              onClick={() => {
                setActiveList(list);
                fetchListItems(list.id);
              }}
            >
              <span className="list-nav-name">{list.name}</span>
              <button
                className="btn-delete-list"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteList(list.id);
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="list-main">
        {!activeList ? (
          <div className="empty-state">
            <p>👈 Create or select a list to get started</p>
            <a
              href="/search"
              className="btn-primary"
              style={{
                display: "inline-block",
                marginTop: "1rem",
                textDecoration: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
              }}
            >
              Search for Items
            </a>
          </div>
        ) : (
          <>
            <div className="list-main-header">
              <div>
                <h1>{activeList.name}</h1>
                <p className="list-progress">
                  {checkedCount} of {totalCount} items checked off
                </p>
              </div>
              <a href="/search" className="btn-search-more">
                + Add Items
              </a>
            </div>

            {totalCount > 0 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${totalCount ? (checkedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            )}

            {listItems.length === 0 ? (
              <div className="empty-state">
                <p>This list is empty.</p>
                <p>
                  Go to <a href="/search">Price Search</a> to find items and add
                  them here.
                </p>
              </div>
            ) : (
              <ul className="list-items">
                {listItems.map((listItem) => (
                  <li
                    key={listItem.id}
                    className={`list-item ${listItem.checked ? "checked" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={listItem.checked}
                      onChange={() => toggleChecked(listItem)}
                      className="item-checkbox"
                    />
                    <div className="item-details">
                      <span className="item-name">{listItem.items?.name}</span>
                      <span className="item-meta">
                        {listItem.items?.category} · {listItem.items?.unit} ·
                        qty: {listItem.quantity}
                      </span>
                    </div>
                    <button
                      onClick={() => removeItem(listItem.id)}
                      className="btn-remove-item"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GroceryList;
