/* Photo uploader with drag-and-drop area and image previews. */
import { ImagePlus, UploadCloud, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "./UI.jsx";

export default function ImageUploader({ files, onFilesChange, existingImages = [], onRemoveExisting, maxFiles = 5, error = "" }) {
  const inputRef = useRef(null);
  const previews = [...(existingImages || []).map((item) => ({ id: item.publicId, url: item.url, isExisting: true })), ...files.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}`, url: URL.createObjectURL(file), isExisting: false }))];

  const handleSelection = (event) => {
    const nextFiles = Array.from(event.target.files || []);
    onFilesChange(nextFiles);
    event.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-dashed border-line bg-page p-4 text-center" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onFilesChange(Array.from(event.dataTransfer.files || [])); }}>
        <UploadCloud className="mx-auto mb-2 h-8 w-8 text-muted" />
        <p className="text-sm font-medium">Drag and drop photos here</p>
        <p className="mt-1 text-xs text-muted">PNG, JPG or JPEG. Max 5 photos and 5 MB each.</p>
        <Button className="mt-3" onClick={() => inputRef.current?.click()} type="button" variant="outline">Browse files</Button>
        <input accept="image/*" className="hidden" multiple onChange={handleSelection} ref={inputRef} type="file" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {previews.map((preview) => (
            <div className="relative overflow-hidden rounded-lg border border-line bg-white" key={preview.id}>
              <img alt="Room preview" className="h-24 w-full object-cover" src={preview.url} />
              <button aria-label="Remove photo" className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/65 text-white" onClick={() => { if (preview.isExisting) onRemoveExisting(preview.id); else onFilesChange(files.filter((file) => !(file.name === preview.id.split('-')[0] && file.size === preview.id.split('-')[1] && file.lastModified === Number(preview.id.split('-')[2] || 0)))); }} type="button"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-muted"><span>{previews.length} / {maxFiles} photos</span>{previews.length > 0 && <ImagePlus className="h-4 w-4" />}</div>
    </div>
  );
}
