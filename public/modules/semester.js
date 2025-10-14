// Funções para gerenciar semestres e pastas no frontend
export async function listSemesters(curso) {
  try {
    console.log('🔍 DEBUG - listSemesters chamado com curso:', curso);
    console.log('🔍 DEBUG - URL da requisição:', `/listar-semestres/${curso}`);
    
    // Adicionar timestamp para evitar cache
    const timestamp = Date.now();
    const url = `/listar-semestres/${curso}?t=${timestamp}`;
    console.log('🔍 DEBUG - URL com timestamp:', url);
    
    // Usar a nova rota que lista diretamente do diretório public
    const response = await fetch(url);
    console.log('🔍 DEBUG - Response status:', response.status);
    console.log('🔍 DEBUG - Response ok:', response.ok);
    
    const data = await response.json();
    console.log('🔍 DEBUG - Data retornada:', data);
    console.log('🔍 DEBUG - Semesters:', data.semesters);
    
    return data.semesters;
  } catch (error) {
    console.error("Erro ao listar semestres:", error);
    return [];
  }
}

export async function checkSemester(curso, semester) {
  try {
    const response = await fetch(
      `/api/semesters/check-semester/${curso}/${semester}`
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Erro ao verificar semestre:", error);
    return false;
  }
}

export async function createNextSemester(curso) {
  try {
    const response = await fetch(`/api/semesters/create-semester/${curso}`, {
      method: "POST",
    });
    const data = await response.json();
    return data.success ? data.semester : null;
  } catch (error) {
    console.error("Erro ao criar próximo semestre:", error);
    return null;
  }
}

export function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  // Se estamos após junho, é segundo semestre
  const semester = now.getMonth() >= 5 ? 2 : 1;
  return `${year}-${semester}`;
}

export function getNextSemester(currentSemester) {
  const [year, semester] = currentSemester.split("-").map(Number);
  if (semester === 1) {
    return `${year}-2`;
  } else {
    return `${year + 1}-1`;
  }
}

export function getSemesterFolderPath(basePath, semester) {
  return `${basePath}_${semester}`;
}

// Verifica se a pasta do semestre existe
export async function checkSemesterFolder(curso, semester) {
  try {
    const response = await fetch(
      `/check-folder?curso=${curso}&semester=${semester}`
    );
    const data = await response.json();
    return data.exists;
  } catch (error) {
    console.error("Erro ao verificar pasta:", error);
    return false;
  }
}

// Atualiza prints do semestre atual
export async function updateCurrentSemesterPrints(curso, semester) {
  try {
    const response = await fetch(
      `/update-prints?curso=${curso}&semester=${semester}`,
      {
        method: "POST",
      }
    );
    if (!response.ok) throw new Error("Erro ao atualizar prints");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar prints:", error);
    return false;
  }
}
