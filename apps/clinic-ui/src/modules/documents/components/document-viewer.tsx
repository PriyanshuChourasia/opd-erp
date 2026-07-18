import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDocumentsByEntity, deleteDocument, downloadDocument, setPrimaryDocument, type DocumentRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { FileText, Trash2, Star, Download, X, Image as ImageIcon, File } from "lucide-react";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";

function handleDownload(doc: DocumentRecord) {
  downloadDocument(doc.id, doc.originalName).catch(() => toast.error("Failed to download document"));
}

interface DocumentGalleryProps {
  documentableType: string;
  documentableId: string;
}

/** Inline gallery: shows all documents as clickable thumbnails/grid. Opens a full-screen lightbox on click. */
export function DocumentGallery({ documentableType, documentableId }: DocumentGalleryProps) {
  const [viewingDoc, setViewingDoc] = useState<DocumentRecord | null>(null);
  const queryClient = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["documents", documentableType, documentableId],
    queryFn: () => fetchDocumentsByEntity(documentableType, documentableId),
    enabled: !!documentableId,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents", documentableType, documentableId] }); toast.success("Document removed"); },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const primaryMutation = useMutation({
    mutationFn: setPrimaryDocument,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["documents", documentableType, documentableId] }); toast.success("Primary updated"); },
    onError: (err) => toast.error(extractApiError(err)),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground py-2">Loading documents...</p>;

  const activeDocs = docs.filter((d) => d.isActive);
  if (activeDocs.length === 0) return null;

  const photo = activeDocs.find((d) => d.documentType === "PROFILE_PHOTO");
  const others = activeDocs.filter((d) => d.documentType !== "PROFILE_PHOTO");

  function getFileIcon(mimeType: string) {
    if (mimeType.startsWith("image/")) return <ImageIcon className="size-5 text-blue-500" />;
    if (mimeType === "application/pdf") return <FileText className="size-5 text-red-500" />;
    return <File className="size-5 text-muted-foreground" />;
  }

  return (
    <>
      {/* Photo thumbnail */}
      {photo && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Profile Photo</p>
          <div className="relative group overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary/50 transition-all">
            <button type="button" onClick={() => setViewingDoc(photo)} className="block w-full">
              <img src={`/uploads/documents/${photo.fileName}`} alt={photo.originalName} className="w-full h-36 object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-end">
                <div className="w-full p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white font-medium">{photo.originalName}</p>
                  <p className="text-[10px] text-white/70">{(photo.fileSize / 1024).toFixed(0)} KB</p>
                </div>
              </div>
            </button>
            <Button
              variant="ghost" size="icon" className="absolute top-1 right-1 size-6 bg-background/80 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100"
              title="Download"
              onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}
            >
              <Download className="size-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Other documents grid */}
      {others.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Documents ({others.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {others.map((doc) => (
              <div
                key={doc.id}
                className="relative group overflow-hidden rounded-lg border hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer"
                onClick={() => setViewingDoc(doc)}
              >
                {doc.mimeType.startsWith("image/") ? (
                  <img src={`/uploads/documents/${doc.fileName}`} alt={doc.originalName} className="w-full h-24 object-cover" />
                ) : (
                  <div className="flex h-24 items-center justify-center bg-muted">
                    {getFileIcon(doc.mimeType)}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-xs font-medium truncate">{doc.originalName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {doc.caption || doc.documentType.replace(/_/g, " ")} · {(doc.fileSize / 1024).toFixed(0)} KB
                  </p>
                </div>
                {/* Hover actions */}
                <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost" size="icon" className="size-6 bg-background/80 backdrop-blur"
                    title="Download"
                    onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                  >
                    <Download className="size-3" />
                  </Button>
                  {!doc.isPrimary && (
                    <Button
                      variant="ghost" size="icon" className="size-6 bg-background/80 backdrop-blur"
                      title="Set as primary"
                      onClick={(e) => { e.stopPropagation(); primaryMutation.mutate(doc.id); }}
                    >
                      <Star className="size-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost" size="icon" className="size-6 bg-background/80 backdrop-blur text-destructive"
                    title="Delete"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(doc.id); }}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full-size lightbox */}
      {viewingDoc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          onClick={() => setViewingDoc(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -top-10 right-0 flex items-center gap-2">
              <button
                onClick={() => handleDownload(viewingDoc)}
                title="Download"
                className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <Download className="size-4" />
              </button>
              <button
                onClick={() => setViewingDoc(null)}
                title="Close"
                className="flex size-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {viewingDoc.mimeType.startsWith("image/") ? (
              <img
                src={`/uploads/documents/${viewingDoc.fileName}`}
                alt={viewingDoc.originalName}
                className="max-h-[80vh] max-w-[85vw] rounded-lg object-contain shadow-2xl"
              />
            ) : viewingDoc.mimeType === "application/pdf" ? (
              <iframe
                src={`/uploads/documents/${viewingDoc.fileName}`}
                className="h-[80vh] w-[85vw] rounded-lg bg-white"
                title={viewingDoc.originalName}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 rounded-lg bg-white p-8">
                {getFileIcon(viewingDoc.mimeType)}
                <p className="text-sm font-medium">{viewingDoc.originalName}</p>
                <p className="text-xs text-muted-foreground">{(viewingDoc.fileSize / 1024).toFixed(0)} KB · {viewingDoc.mimeType}</p>
                <button
                  onClick={() => handleDownload(viewingDoc)}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="size-4" /> Download
                </button>
              </div>
            )}

            <div className="mt-3 text-center">
              <p className="text-sm text-white font-medium">{viewingDoc.originalName}</p>
              <p className="text-xs text-white/60">
                {viewingDoc.caption || viewingDoc.documentType.replace(/_/g, " ")} · {(viewingDoc.fileSize / 1024).toFixed(0)} KB
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
