# Football Shorts Studio

Produção de Shorts de futebol com **React, TypeScript, Remotion e FFmpeg**: vídeo vertical de **1080 × 1920, 30 FPS, 30 a 40 segundos**, narração portuguesa, fotografias/ilustrações com movimento, legendas por palavra, música com redução automática durante a voz, efeitos sonoros e exportação MP4.

O primeiro projeto é um duelo **Raphinha × Mbappé** a partir do roteiro fornecido. As estatísticas «15 golos em 10 jogos» e a liderança da Chuteira de Ouro não têm temporada, data e fonte confirmadas. O projeto mantém um aviso editorial e os metadados assinalam a revisão necessária. O vídeo demonstrativo não deve ser publicado como notícia confirmada antes dessa revisão. As imagens geradas são ilustrações, não fotografias documentais de acontecimentos reais.

## Short demonstrativo pronto

[Descarregar/ver o MP4 Raphinha × Mbappé](exports/raphinha-vs-mbappe.mp4) — 34 segundos, 1080 × 1920, 30 FPS, H.264/AAC. No GitHub, abra o ficheiro e use **Download raw file**.

A pasta [`exports/`](exports/) inclui o vídeo realmente renderizado, os [metadados de publicação](exports/raphinha-vs-mbappe.metadata.txt), os créditos, o relatório de validação e o SHA-256. As estatísticas continuam **por validar**. O código e os recursos permitem gerar novos Shorts pelo workflow GitHub Actions.

## No Codex pelo navegador e no GitHub

Os ficheiros deste repositório são o projeto completo. O navegador não codifica o vídeo: Node.js e Chromium renderizam os fotogramas no ambiente de execução, e FFmpeg codifica e verifica o resultado. Não é necessário Docker para trabalhar no ambiente Codex que já contém estas ferramentas.

```bash
npm ci
npm run doctor
npm run studio
```

Abra a porta **3000** no painel de portas/preview do ambiente. No GitHub Codespaces, a configuração `.devcontainer/` instala Node.js, Chromium e FFmpeg e encaminha essa porta. Em ambientes com controlo de rede, a instalação de dependências e modelos exige acesso aos respetivos servidores; uma falha de rede não é uma exportação bem-sucedida.

O diagnóstico verifica as versões, os codificadores FFmpeg e o lançamento real do navegador. Se Chromium estiver noutra localização, defina a variável no processo:

```bash
BROWSER_EXECUTABLE=/usr/bin/chromium npm run doctor
```

O ficheiro `.env.example` documenta as variáveis; copiá-lo para `.env` não as carrega automaticamente.

## Renderizar e descarregar

```bash
npm run typecheck
npm test
npm run render -- --project content/demo.json
```

A exportação só termina com sucesso depois de criar e verificar o ficheiro. A pasta `out/` recebe o MP4, título/descrição/hashtags num ficheiro separado, créditos e relatório técnico. Abra o ficheiro MP4 pelo explorador do Codex e use a opção de descarregar do ambiente. Os nomes concretos derivam do `id` definido no projeto.

No GitHub, execute **Actions → Render Football Short → Run workflow**. Depois de uma execução bem-sucedida, descarregue o artefacto `football-short-…`. O workflow usa os recursos de áudio e imagem guardados no repositório. Não envia vídeos para o YouTube e não exige credenciais de publicação.

## Criar outro Short sem alterar a composição

1. Duplique `content/demo.json`, dê-lhe um `id` único e ajuste o tema, texto e metadados.
2. Organize as cenas por `start` e `duration`, mantendo a duração total entre 30 e 40 segundos. Os tempos são em segundos.
3. Coloque imagens e áudio dentro de `public/` e use caminhos relativos a essa pasta, como `demo/images/raphinha.png`.
4. Gere ou importe a narração e os tempos de cada palavra. As legendas usam o formato JSON `Caption` de `@remotion/captions`: `text`, `startMs`, `endMs`, `timestampMs` e `confidence`. Os tempos são em milissegundos na mesma linha temporal da voz.
5. Atualize os créditos e confirme fontes, licenças e os dados editoriais. Depois renderize com `--project content/o-meu-short.json`.

O modelo de cenas é intencionalmente controlado pelos dados do projeto. Não é preciso reescrever o componente React para trocar assunto, imagens, narração e texto. O esquema TypeScript em `src/` e o exemplo JSON definem os campos aceites.

**Áudio importado:** use tempos por palavra medidos ou alinhados ao áudio real. Dividir a duração por número de palavras não produz sincronização fiável. Ao deslocar uma narração, desloque também as legendas. Ao substituir a voz, volte a gerar ou alinhar as legendas antes de exportar.

## Som e sincronização

A música e os efeitos do demonstrativo são criados para o projeto. A mistura FFmpeg reduz a música a partir do sinal efetivo da narração e exporta o áudio misturado para a mesma linha temporal do vídeo. A composição usa animações baseadas em fotogramas; não depende de animações CSS em tempo real.

O campo `audio.musicMode` controla as fontes: `"generated"` cria a música e os efeitos originais nos caminhos configurados; `"import"` preserva os ficheiros de música, impacto e transição que fornecer. Sem esse campo, o comportamento é importar. A mistura tem um ficheiro de saída distinto (`audio.mix`) e não substitui a narração. Música importada curta é repetida até cobrir a duração do Short.

Na voz demonstrativa, os tempos das palavras provêm das durações dos fonemas do motor neural Piper, com o mesmo fator de reamostragem aplicado ao áudio e às legendas. `speech-manifest.json` guarda os hashes SHA-256 e as contagens de amostras. A validação deteta alterações de voz/legendas, divergências dessas durações e cenas deslocadas mais de um fotograma em relação à voz. A voz incluída é português do Brasil; o texto e as chamadas seguem o roteiro português fornecido.

Os testes e a validação verificam a estrutura temporal, ficheiros de recursos, formato dos fluxos, resolução, FPS, duração e limites das legendas. O relatório técnico complementa a revisão audiovisual: confirme também a pronúncia dos nomes, a legibilidade no telemóvel, a correspondência das palavras destacadas e a factualidade do roteiro antes de publicar.

## Direitos e créditos

Guarde, para cada recurso, autor, origem, licença/termos e atribuição necessária. O demonstrativo inclui manifestos de proveniência das imagens em `public/demo/images/credits.json`; as imagens são sintéticas e não recebem uma licença Creative Commons inventada. A voz e os restantes recursos têm os seus próprios termos, que devem acompanhar a entrega. Confirme também os direitos dos recursos que adicionar, incluindo fotografias de jogadores, música, logótipos e vídeos de transmissões.

Remotion tem [condições próprias de licenciamento](https://www.remotion.dev/license); confirme a elegibilidade do seu uso profissional. A presença de código aberto neste repositório não atribui automaticamente direitos sobre todos os modelos, imagens e áudios.

## Estrutura

```text
content/                 Projetos, roteiro, cenas e metadados
src/                     Composição React e animações Remotion
public/demo/             Imagens, áudio, legendas e proveniência
scripts/                 Diagnóstico, som, renderização e validação
tests/                   Casos de validação e sincronização
out/                     Exportações e relatórios reais
.github/workflows/       Renderização no GitHub Actions
.devcontainer/           Ambiente GitHub Codespaces
```

## Gerar narração local, sem chave de API

O demonstrativo inclui voz neural **pt-BR** já gerada e legendas reais. Para outro roteiro, edite `scenes[].narration` no JSON e execute:

```bash
npm run speech:setup
npm run speech -- --project content/demo.json
npm run render -- --project content/demo.json
```

A instalação descarrega o modelo Faber/Piper e as dependências para `/tmp/`, fora do Git. `FOOTBALL_SPEECH_VENV` e `FOOTBALL_MODEL_DIR` permitem outras localizações. Se mudar a pasta do modelo, passe também `--model /caminho/pt_BR-faber-medium.onnx` à geração. Este passo precisa de acesso ao PyPI e aos releases do GitHub. No Codex, as ferramentas que abrem portas ou acedem à rede precisam das permissões de rede do ambiente; o projeto não contorna o proxy.

O gerador sintetiza frases completas e expõe a saída de durações nativas do modelo VITS. Os limites de palavras vêm dos fonemas, com a mesma transformação temporal aplicada ao áudio e às legendas. A duração segue `durationSeconds` (30–40 s); o campo opcional `speech.lengthScale` controla o ritmo inicial (padrão 1.4). As cenas acompanham os intervalos medidos e os hashes detetam alterações posteriores. A adaptação uniforme da duração também altera ligeiramente o tom; para entregas que exijam uma voz específica, importe uma narração aprovada e o seu alinhamento real.

O roteiro original está em `content/roteiro-original.txt`; a versão de produção foi condensada para 34 segundos. Não se reutilizam os tempos da voz anterior ao trocar o roteiro. O modelo é específico de português brasileiro; outra variante pode ser importada sem alterar a composição.
