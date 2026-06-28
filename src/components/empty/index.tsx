import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "./EmptyState";

interface Props {
  className?: string;
}

export const EmptyLibraryState = memo(function EmptyLibraryState({ className }: Props) {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="music"
      title="Библиотека пуста"
      message="Создайте свой первый трек с помощью AI-генератора"
      primaryAction={{ label: "Создать трек", onClick: () => navigate("/?generate=open") }}
      className={className}
    />
  );
});

export const EmptySearchResults = memo(function EmptySearchResults({ className }: Props) {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="search"
      title="Ничего не найдено"
      message="Попробуйте изменить поисковый запрос"
      primaryAction={{ label: "Очистить поиск", onClick: () => navigate(-1) }}
      className={className}
    />
  );
});

export const EmptyPlaylistState = memo(function EmptyPlaylistState({ className }: Props) {
  return (
    <EmptyState
      icon="playlist"
      title="Плейлист пуст"
      message="Добавьте треки из библиотеки"
      primaryAction={{ label: "В библиотеку", onClick: () => window.history.back() }}
      className={className}
    />
  );
});
