import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import { 
  listMyFiles, 
  renameUserFile, 
  deleteUserFile, 
  uploadCustomFile,
  FileRecord 
} from "@/lib/api";
import { 
  FileText, 
  Download, 
  Trash2, 
  Edit3, 
  Plus, 
  Loader2, 
  Search, 
  Folder 
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/file-manager")({
  head: () => ({
    meta: [{ title: "File Workspace Manager — CareerSuccess" }],
  }),
  component: () => <FileManager />,
});

function FileManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("resume");
  const [renameId, setRenameId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

  const filesQuery = useQuery({
    queryKey: ["files-list"],
    queryFn: listMyFiles
  });

  const uploadMutation = useMutation({
    mutationFn: ({ category, file }: { category: string; file: File }) => uploadCustomFile(category, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files-list"] });
      toast.success("Document uploaded successfully.");
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err}`);
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) => renameUserFile(fileId, newName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files-list"] });
      toast.success("File renamed successfully.");
      setRenameId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deleteUserFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files-list"] });
      toast.success("File deleted permanently.");
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate({ category, file });
    }
  };

  const handleRenameSubmit = (fileId: string) => {
    if (!newName.trim()) return;
    renameMutation.mutate({ fileId, newName });
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const files = filesQuery.data || [];
  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell
      title="File Workspace"
      subtitle="Manage uploaded resumes, cover letters, certificates, and exported PDF reports."
    >
      <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-soft mb-8">
        
        {/* Search & Actions Panel */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted/20 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-card border border-border/50 rounded-xl px-3 py-2.5 text-sm focus:outline-none text-foreground w-full sm:w-36"
            >
              <option value="resume">Resume PDF</option>
              <option value="cover_letter">Cover Letter</option>
              <option value="certificate">Certificate</option>
              <option value="report">AI Report</option>
            </select>
            
            <label className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-bold px-4 py-2.5 rounded-xl cursor-pointer shadow-soft transition-colors w-full sm:w-auto justify-center text-sm shrink-0">
              <Plus className="h-4 w-4" />
              Upload Document
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileUpload} 
                accept=".pdf,.doc,.docx,.txt,.png,.jpg"
              />
            </label>
          </div>
        </div>

        {/* Files Table */}
        {filesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/50 rounded-2xl bg-muted/5">
            <Folder className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
            <p className="text-sm font-bold text-muted-foreground">No files in directory.</p>
            <p className="text-xs text-muted-foreground mt-1">Upload a document to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-sm text-foreground/80">
                {filteredFiles.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-4 px-4 font-bold flex items-center gap-3">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      {renameId === f.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-muted/30 border border-border/50 rounded px-2 py-1 text-xs text-foreground focus:outline-none"
                          />
                          <Button size="xs" onClick={() => handleRenameSubmit(f.id)}>Save</Button>
                          <Button size="xs" variant="outline" onClick={() => setRenameId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <span>{f.filename}</span>
                      )}
                    </td>
                    <td className="py-4 px-4 uppercase text-xs font-semibold tracking-wider text-muted-foreground">{f.category}</td>
                    <td className="py-4 px-4 text-xs font-semibold">{formatBytes(f.file_size)}</td>
                    <td className="py-4 px-4 text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-right flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setRenameId(f.id);
                          setNewName(f.filename);
                        }}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          // Simple dummy download trigger
                          toast.success("Download started...");
                        }}
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Permanently delete this file?")) {
                            deleteMutation.mutate(f.id);
                          }
                        }}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AppShell>
  );
}
