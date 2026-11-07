import { useCallback } from "react";
import { observarChaves } from "@/data/colecoes";
import type { ChaveDeGrupo } from "@/domain/tipos";
import { useAssinatura, type EstadoAssinatura } from "./useAssinatura";

export function useChaves(modalidadeId: string): EstadoAssinatura<ChaveDeGrupo[]> {
  const assinar = useCallback(
    (aoMudar: (dados: ChaveDeGrupo[]) => void, aoFalhar: (erro: Error) => void) =>
      observarChaves(modalidadeId, aoMudar, aoFalhar),
    [modalidadeId],
  );
  return useAssinatura(assinar, modalidadeId);
}
