import React from "react";

const filters = [
  { name: "None", value: "none" },
  { name: "Grayscale", value: "grayscale(100%)" },
  { name: "Sepia", value: "sepia(100%)" },
  { name: "Invert", value: "invert(100%)" },
  { name: "Blur", value: "blur(5px)" }
];

const FilterSelector = ({ setFilter, currentFilter }) => (
  <div>
    <h4>Filters</h4>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {filters.map((f, i) => (
        <button
          key={i}
          onClick={() => setFilter(f.value)}
          style={{
            padding: "8px",
            borderRadius: 8,
            border: currentFilter === f.value ? "2px solid #007bff" : "1px solid #ccc",
            backgroundColor: currentFilter === f.value ? "#e0f0ff" : "#f9f9f9",
            cursor: "pointer",
            fontWeight: currentFilter === f.value ? "bold" : "normal",
            transition: "all 0.2s"
          }}
        >
          {f.name}
        </button>
      ))}
    </div>
  </div>
);

export default FilterSelector;

