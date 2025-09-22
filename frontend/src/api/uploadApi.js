
import axios from "axios";

export async function uploadImage(file, { folder = "eventhive" } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder); // optional: your backend can read this

  const res = await axios.post("/api/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    withCredentials: true,
  });
  return res.data; // { url, public_id }
}
