export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { curso } = req.query;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = "cienciasexactas";
  const REPO_NAME = "cienciasexactas.github.io";

  if (!curso) {
    return res.status(400).json({ error: 'Parâmetro curso é obrigatório.' });
  }

  try {
    const resAnos = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/uploads/${curso}`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Vercel-Lister'
        }
      }
    );

    if (!resAnos.ok) {
      return res.status(200).json({ estrutura: [] });
    }

    const anosPastas = await resAnos.json();
    const resultado = [];

    for (const pastaAno of anosPastas) {
      if (pastaAno.type !== 'dir') continue;

      const resFicheiros = await fetch(pastaAno.url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'Vercel-Lister'
        }
      });

      if (resFicheiros.ok) {
        const ficheiros = await resFicheiros.json();
        const listaFicheiros = [];

        for (const f of ficheiros.filter(item => item.type === 'file')) {
          // Busca a data do último commit do ficheiro
          let dataEnvio = null;
          try {
            const resCommit = await fetch(
              `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${f.path}&page=1&per_page=1`,
              {
                headers: {
                  'Authorization': `Bearer ${GITHUB_TOKEN}`,
                  'User-Agent': 'Vercel-Lister'
                }
              }
            );
            if (resCommit.ok) {
              const commitData = await resCommit.json();
              if (commitData.length > 0) {
                dataEnvio = commitData[0].commit.committer.date;
              }
            }
          } catch (e) {
            console.error("Erro ao buscar data:", e);
          }

          listaFicheiros.push({
            nome: f.name,
            tamanho: f.size,
            url: `https://cienciasexactas.github.io/uploads/${curso}/${pastaAno.name}/${encodeURIComponent(f.name)}`,
            data: dataEnvio
          });
        }

        resultado.push({
          ano: pastaAno.name,
          ficheiros: listaFicheiros
        });
      }
    }

    return res.status(200).json({ estrutura: resultado });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
