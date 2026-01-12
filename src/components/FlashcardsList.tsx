import { useEffect, useState } from "react";
import type { FlashcardDto } from "@/types";
import { SavedFlashcardListItem } from "./SavedFlashcardListItem";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { CreateFlashcardModal } from "./CreateFlashcardModal";
import { ErrorNotification } from "./ErrorNotification";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function FlashcardsList() {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDto | null>(null);
  const [deletingFlashcard, setDeletingFlashcard] = useState<FlashcardDto | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/flashcards?page=1&limit=100");

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `Błąd pobierania fiszek (${response.status})`);
        }

        const data = await response.json();
        setFlashcards(data.data || []);
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage("Wystąpił błąd podczas pobierania danych.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleEdit = (flashcard: FlashcardDto) => {
    setEditingFlashcard(flashcard);
  };

  const handleModalClose = () => {
    setEditingFlashcard(null);
  };

  const handleSave = async (updatedData: { front: string; back: string }) => {
    if (!editingFlashcard) return;

    try {
      const response = await fetch(`/api/flashcards/${editingFlashcard.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.message || "Nie udało się zaktualizować fiszki.");
      }

      const updatedFlashcard = await response.json();

      setFlashcards((prev) => prev.map((fc) => (fc.id === editingFlashcard.id ? updatedFlashcard : fc)));

      setEditingFlashcard(null);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Wystąpił błąd podczas aktualizacji.");
      }
      throw error;
    }
  };

  const handleDelete = (flashcard: FlashcardDto) => {
    setDeletingFlashcard(flashcard);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingFlashcard) return;

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/flashcards/${deletingFlashcard.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || "Nie udało się usunąć fiszki.");
      }

      // Remove flashcard from the list
      setFlashcards((prev) => prev.filter((fc) => fc.id !== deletingFlashcard.id));

      // Show success notification
      toast.success("Fiszka została usunięta pomyślnie");

      setDeletingFlashcard(null);
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
        toast.error(error.message);
      } else {
        const message = "Wystąpił błąd podczas usuwania fiszki.";
        setErrorMessage(message);
        toast.error(message);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingFlashcard(null);
  };

  const handleCreateSuccess = (newFlashcard: FlashcardDto) => {
    // Add new flashcard to the beginning of the list
    setFlashcards((prev) => [newFlashcard, ...prev]);

    // Show success notification
    toast.success("Fiszka została utworzona pomyślnie");

    // Close modal
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {errorMessage && <ErrorNotification message={errorMessage} onClose={() => setErrorMessage("")} />}

      {/* Add new flashcard button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2"
          aria-label="Otwórz formularz tworzenia nowej fiszki"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Dodaj nową fiszkę
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-muted-foreground">Ładowanie...</span>
        </div>
      ) : flashcards.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">Brak zapisanych fiszek.</div>
      ) : (
        <div className="space-y-3">
          {flashcards.map((flashcard) => (
            <SavedFlashcardListItem
              key={flashcard.id}
              flashcard={flashcard}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {editingFlashcard && (
        <EditFlashcardModal flashcard={editingFlashcard} onClose={handleModalClose} onSave={handleSave} />
      )}

      <DeleteConfirmationModal
        isOpen={!!deletingFlashcard}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isDeleting={isDeleting}
      />

      <CreateFlashcardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
