"use client";

import { useState, type FormEvent } from "react";

interface Post {
  id: string;
  content: string | null;
  authorId: string;
  eventId: string | null;
  score: number;
  commentCount: number;
  flagCount: number;
  createdAt: Date;
}

interface SearchResponse {
  results: Post[];
}

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch(`/api/search/${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search posts..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "16px",
            border: "2px solid #ddd",
            borderRadius: "4px",
          }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isLoading ? "#ccc" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "15px", backgroundColor: "#fee", border: "1px solid #fcc", borderRadius: "4px", marginBottom: "20px", color: "#c00" }}>
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "15px" }}>
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          {results.map((post) => (
            <div key={post.id} style={{ padding: "15px", border: "1px solid #ddd", borderRadius: "4px", marginBottom: "10px", backgroundColor: "#f9f9f9" }}>
              <p style={{ margin: "0 0 10px 0" }}>{post.content}</p>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Score: {post.score} | Comments: {post.commentCount}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && results.length === 0 && query && !error && (
        <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
          No results found for "{query}"
        </div>
      )}
    </div>
  );
}
