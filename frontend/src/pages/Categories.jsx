import { useEffect, useState } from "react";
import API from "../api";
import { showError } from "../utils/toast";

function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await API.get("/categories"); 
        setCategories(res.data);
      } catch {
        showError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return <div className="text-sm">Loading categories...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Categories</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="rounded-2xl p-6 border"
            style={{
              background: "var(--card-bg)",
              borderColor: "var(--border)",
            }}
          >
            <h2 className="font-semibold mb-3">{cat.name}</h2>

            {cat.keywords && cat.keywords.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {cat.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-1 text-xs rounded-lg"
                    style={{
                      background: "var(--accent-light)",
                      color: "var(--accent)",
                    }}
                  >
                    {kw}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                No keywords assigned
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Categories;