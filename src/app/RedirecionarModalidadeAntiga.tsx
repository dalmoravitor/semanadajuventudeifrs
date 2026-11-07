import { Navigate, useParams } from "react-router";

/** Endereços do site de 2025 (/modalidade/:id) continuam funcionando. */
export function RedirecionarModalidadeAntiga() {
  const { id = "" } = useParams();
  return <Navigate to={`/modalidades/${id}`} replace />;
}
