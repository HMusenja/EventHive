import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadImage } from "@/api/uploadApi";
import { Image as ImageIcon, Upload, X } from "lucide-react";

/**
 * Reusable Cloudinary image uploader
 *
 * Props:
 * - label?: string
 * - value?: string                           // current image URL
 * - onChange?: (payload) => void             // { url, public_id }
 * - onUploadStart?: () => void
 * - onUploadEnd?: (payload|undefined) => void
 * - folder?: string                          // cloudinary folder hint
 * - accept?: string                          // e.g. "image/*"
 * - disabled?: boolean
 * - helpText?: string
 * - name?: string
 * - id?: string
 * - allowClear?: boolean (default true)
 * - className?: string
 */
export default function ImageUploader({
  label = "Image",
  value,
  onChange,
  onUploadStart,
  onUploadEnd,
  folder = "eventhive",
  accept = "image/*",
  disabled = false,
  helpText,
  name,
  id,
  allowClear = true,
  className = "",
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(value || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // keep preview in sync if parent changes value
  if (value !== undefined && value !== preview) {
    // avoid setState during render if not necessary
    queueMicrotask(() => setPreview(value || ""));
  }

  const handleFiles = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file) return;

      setError("");
      setBusy(true);
      onUploadStart?.();

      try {
        const res = await uploadImage(file, { folder });
        setPreview(res.url);
        onChange?.(res); // { url, public_id }
        onUploadEnd?.(res);
      } catch (e) {
        setError(e?.response?.data?.message || e?.message || "Upload failed");
        onUploadEnd?.(undefined);
      } finally {
        setBusy(false);
      }
    },
    [folder, onChange, onUploadEnd, onUploadStart]
  );

  const onInputChange = (e) => handleFiles(e.target.files);

  const onDrop = (e) => {
    e.preventDefault();
    if (disabled || busy) return;
    handleFiles(e.dataTransfer.files);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const clearImage = () => {
    setPreview("");
    onChange?.({ url: "", public_id: undefined });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={className}>
      {label && <Label htmlFor={id || name}>{label}</Label>}

      {/* Dropzone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        role="button"
        tabIndex={0}
        aria-label="Upload image"
        className="mt-2"
      >
        {!preview ? (
          <div className="border border-dashed p-4">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Drag & drop, or choose a file</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Input
                ref={inputRef}
                id={id || name}
                name={name}
                type="file"
                accept={accept}
                disabled={disabled || busy}
                onChange={onInputChange}
              />
              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || busy}
              >
                Browse…
              </Button>
            </div>
          </div>
        ) : (
          <div className="border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span>Current image</span>
              </div>
              {allowClear && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearImage}
                  disabled={disabled || busy}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="mt-3">
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={preview} alt="Image preview" />
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Input
                ref={inputRef}
                id={id || name}
                name={name}
                type="file"
                accept={accept}
                disabled={disabled || busy}
                onChange={onInputChange}
              />
              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || busy}
              >
                Replace…
              </Button>
            </div>
          </div>
        )}
      </div>

      {busy && <p className="mt-2 text-sm">Uploading…</p>}
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      {helpText && <p className="mt-2 text-sm text-muted-foreground">{helpText}</p>}
    </div>
  );
}
