const BASE_URL = "http://127.0.0.1:5000/pets";

export async function fetchPets(filters = {}) {
  const params = new URLSearchParams(filters).toString();
  const res = await fetch(`${BASE_URL}?${params}`);
  if (!res.ok) throw new Error("Failed to fetch pets");
  return await res.json();
}

export async function addPet(petData) {
  const res = await fetch(`${BASE_URL}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(petData)
  });
  if (!res.ok) throw new Error("Failed to add pet");
  return await res.json();
}

export async function updatePet(petId, updateData) {
  const res = await fetch(`${BASE_URL}/update/${petId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData)
  });
  if (!res.ok) throw new Error("Failed to update pet");
  return await res.json();
}

export async function deletePet(petId) {
  const res = await fetch(`${BASE_URL}/delete/${petId}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Failed to delete pet");
  return await res.json();
}
