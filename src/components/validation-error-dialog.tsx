import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ValidationErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  error: string;
}

export function ValidationErrorDialog({ isOpen, onClose, error }: ValidationErrorDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-red-400">Configuration Validation Error</DialogTitle>
          <DialogDescription className="text-gray-400">
            The following error was found in your Lighttpd configuration:
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <pre className="bg-gray-900 p-4 rounded-lg overflow-auto max-h-[400px] text-sm whitespace-pre-wrap text-red-300">
            {error}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  )
}
