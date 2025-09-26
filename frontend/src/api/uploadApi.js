import axios from "@/services/axiosConfig";

/**
 * Upload an image to the server (e.g. Cloudinary or local storage).
 * 
 * @param {File} file - The image file to upload
 * @param {Object} options - Optional config
 * @param {string} options.folder - Target folder for uploaded file (default: "eventhive")
 * @returns {Promise<Object>} Response data { url, public_id }
 */
export async function uploadImage(file, { folder = "eventhive" } = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const { data } = await axios.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return data;
}
