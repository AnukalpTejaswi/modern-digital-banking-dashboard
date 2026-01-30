import { useState } from "react";
import { createCategory } from "../api";

export default function AddCategoryModal({ onAdded }) {
  const [name, setName] = useState("");

  const submit = async () => {
    await createCategory(name);
    onAdded();
    setName("");
  };

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={submit}>Add Category</button>
    </div>
  );
}
