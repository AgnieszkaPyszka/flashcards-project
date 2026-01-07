import { useEffect, useState } from "react";
import type { FlashcardDto } from "@/types";
import { SavedFlashcardListItem } from "./SavedFlashcardListItem";
import { EditFlashcardModal } from "./EditFlashcardModal";
import { ErrorNotification } from "./ErrorNotification";

export function FlashcardsList() {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [editingFlashcard, setEditingFlashcard] = useState<FlashcardDto | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="space-y-4">
      {errorMessage && <ErrorNotification message={errorMessage} onClose={() => setErrorMessage("")} />}

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
            <SavedFlashcardListItem key={flashcard.id} flashcard={flashcard} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {editingFlashcard && (
        <EditFlashcardModal flashcard={editingFlashcard} onClose={handleModalClose} onSave={handleSave} />
      )}
    </div>
  );
}
