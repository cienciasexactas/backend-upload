export default async function handler(req, res) {
    // Permite que o site cienciasexactas.github.io faça requisições para cá (CORS)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { nomeArquivo, conteudoBase64, curso } = req.body;

        // Pega as configurações do seu repositório
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = "cienciasexactas"; // Seu usuário do GitHub
        const REPO_NAME = "cienciasexactas.github.io"; // Nome exato do seu repositório
        
        // Caminho da pasta que será criada no GitHub
        const caminhoArquivo = `uploads/${curso}/${nomeArquivo}`;

        const response = await fetch(
            `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${caminhoArquivo}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'Vercel-Uploader'
                },
                body: JSON.stringify({
                    message: `Upload de ficheiro para ${curso}: ${nomeArquivo}`,
                    content: conteudoBase64
                })
            }
        );

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json({ 
                success: true, 
                url: data.content.html_url 
            });
        } else {
            return res.status(400).json({ error: data.message });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Erro interno no servidor' });
    }
}