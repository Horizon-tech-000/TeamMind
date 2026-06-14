import { useEffect, useState } from "react";
import { Folder, Loader2, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getUserIntegration } from "@/lib/integrations";

type DriveFolder = { id: string; name: string };

const MOCK_FOLDERS: DriveFolder[] = [
  { id: "1", name: "Platform Migration" },
  { id: "2", name: "Engineering Docs" },
  { id: "3", name: "Q4 Planning" },
  { id: "4", name: "Design Reviews" },
  { id: "5", name: "Customer Research" },
  { id: "6", name: "API Specs" },
  { id: "7", name: "Onboarding" },
  { id: "8", name: "Meeting Notes" },
];

async function fetchDriveFolders(accessToken: string): Promise<DriveFolder[]> {
  try {
    const res = await fetch(
      "https://www.googleapis.com/drive/v3/files?" +
        new URLSearchParams({
          q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
          fields: "files(id,name)",
          orderBy: "name",
          pageSize: "50",
        }).toString(),
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!res.ok) {
      console.warn("Drive API error:", res.status, await res.text());
      return [];
    }

    const data = (await res.json()) as { files: DriveFolder[] };
    return data.files ?? [];
  } catch (err) {
    console.warn("Failed to fetch Drive folders:", err);
    return [];
  }
}

export function GoogleDriveFolderPickerModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (folderName: string) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setSelectedId(null);
    setFolders([]);
    setUsingMock(false);

    // Try to use real Google Drive API first
    (async () => {
      try {
        const integration = await getUserIntegration("google_drive");
        if (integration?.access_token) {
          const realFolders = await fetchDriveFolders(integration.access_token);
          if (realFolders.length > 0) {
            setFolders(realFolders);
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fall through to mock
      }

      // Fall back to mock data if Drive API isn't available
      setUsingMock(true);
      setFolders(MOCK_FOLDERS);
      setLoading(false);
    })();
  }, [open]);

  if (!open) return null;

  const selected = folders.find((f) => f.id === selectedId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-primary/60 backdrop-blur-sm">
      <div
        className="bg-card rounded-2xl w-full max-w-md flex flex-col overflow-hidden"
        style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}
      >
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold">Select a Google Drive folder</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Only this folder will be indexed.</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        {usingMock && (
          <div className="px-6 pt-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Showing sample folders. Connect Google Drive in{" "}
              <a href="/settings" className="text-accent underline">Settings</a>{" "}
              to see your real folders.
            </p>
          </div>
        )}

        <div className="px-3 py-3 max-h-[420px] min-h-[280px] overflow-y-auto">
          {loading ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="mt-3 text-sm">Loading your folders…</p>
            </div>
          ) : folders.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground">
              <Folder className="h-8 w-8 mb-3" />
              <p className="text-sm">No folders found in your Google Drive.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {folders.map((f) => {
                const isSelected = f.id === selectedId;
                return (
                  <li key={f.id}>
                    <button
                      onClick={() => setSelectedId(f.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        isSelected
                          ? "bg-accent/15 ring-1 ring-accent"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Folder
                        className={`h-5 w-5 shrink-0 ${isSelected ? "text-accent" : "text-muted-foreground"}`}
                        fill={isSelected ? "currentColor" : "none"}
                      />
                      <span className={`text-sm flex-1 ${isSelected ? "font-medium text-foreground" : "text-foreground"}`}>
                        {f.name}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-accent" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-background">
          <button onClick={onClose} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <Button
            className="bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-5"
            disabled={!selected}
            onClick={() => selected && onConfirm(selected.name)}
          >
            Connect this folder
          </Button>
        </div>
      </div>
    </div>
  );
}
