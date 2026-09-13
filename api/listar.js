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
        resultado.push({
          ano: pastaAno.name,
          ficheiros: ficheiros.filter(f => f.type === 'file').map(f => ({
            nome: f.name,
            tamanho: f.size,
            url: f.html_url
          }))
        });
      }
    }

    return res.status(200).json({ estrutura: resultado });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
