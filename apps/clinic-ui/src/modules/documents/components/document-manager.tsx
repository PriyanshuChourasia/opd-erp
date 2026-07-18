import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDocumentsByEntity, uploadDocument, deleteDocument, type DocumentRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Camera, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";

interface DocumentManagerProps {
  documentableType: string;
  documentableId: string;
  documentType: string;
  label?: string;
}

export function DocumentManager({ documentableType, documentableId, documentType, label = "Photo" }: DocumentManagerProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const { data: documents = [] } = useQuery({
    queryKey: ["documents", documentableType, documentableId],
    queryFn: () => fetchDocumentsByEntity(documentableType, documentableId),
    enabled: !!documentableId,
  });

  const profilePhoto = documents.find(
    (d) => d.documentType === documentType && d.isActive,
  );

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(file, documentType, documentableType, documentableId, { isPrimary: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", documentableType, documentableId] });
      setPreview(null);
      toast.success(`${label} uploaded successfully`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", documentableType, documentableId] });
      toast.success(`${label} removed`);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    uploadMutation.mutate(file);
    e.target.value = "";
  }

  const imageUrl = preview || (profilePhoto ? `/uploads/documents/${profilePhoto.fileName}` : null);

  return (
    <div className="flex items-center gap-4">
      <div className="relative group">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 bg-muted/50 transition-colors hover:border-primary/50 hover:bg-muted"
        >
          {imageUrl ? (
            <img src={imageUrl} alt={label} className="size-full object-cover" />
          ) : (
            <Camera className="size-6 text-muted-foreground/50" />
          )}
        </button>
        {profilePhoto && !preview && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate(profilePhoto.id)}
            className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        )}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {uploadMutation.isPending
            ? "Uploading..."
            : profilePhoto
              ? `${(profilePhoto.fileSize / 1024).toFixed(0)} KB`
              : "Click to upload"}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
