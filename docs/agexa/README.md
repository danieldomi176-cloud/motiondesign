# AGEXA — Cinematic Motion Design Campaign

Campanha editável para uma plataforma moçambicana de serviços e marcações. O filme principal dura **40 segundos**; o corte social dura **15 segundos**. O contacto do briefing é **+258 84 671 1987** e o website é **agexa-flix.base44.app**. Não foi assumida a existência de teste grátis.

## Entregas e estado

- `out/agexa/AGEXA_Official_Motion_Design.mp4`: master 1080 × 1920, 30 FPS, H.264/AAC.
- `out/agexa/AGEXA_TikTok_15s.mp4`: corte de 15 s, no mesmo formato.
- `out/agexa/AGEXA_Preview_540p.mp4`: pré-visualização 540 × 960, 15 FPS.
- Relatórios `.report.json`, fotogramas de revisão e projeto-fonte editável.
- `public/agexa/audio/`: música, efeitos, assinatura sonora e misturas separadas, reais.
- `voiceover-cues.json` e guias `.srt`: texto e tempos para gravação humana pt-MZ. **São guias de gravação, não uma narração já produzida nem legendas alinhadas a uma voz inexistente.**

O filme funciona sem voz através da tipografia e do som. A indicação de “Official” no nome solicitado não significa aprovação comercial da marca: `commercialMasterApproved` permanece falso enquanto os materiais oficiais não forem aprovados.

## Limitações factuais e de materiais

O website foi bloqueado pela política do proxy (HTTP 403). O utilizador confirmou não dispor de links alternativos. Não foi possível capturar a interface verdadeira nem obter o ficheiro master original do logótipo. Por isso:

1. As telas do smartphone são abstrações gráficas e os cartões são uma visualização conceptual, identificada na imagem. Não são capturas oficiais do produto.
2. O recurso da marca foi preparado a partir da referência inline fornecida, com assistência de IA. É um **derivado visual sujeito a aprovação**, não um vetor original.
3. Não foi usada a voz brasileira do projeto anterior como voz moçambicana. O guião fica preparado para gravação humana.
4. As funcionalidades descritas vêm do briefing; não foram verificadas independentemente. Não se inventaram métricas, clientes, faturação, avaliações, urgência ou período experimental.

Estas adaptações permitem entregar uma peça audiovisual real e reproduzível. As cenas de produto não cumprem integralmente a exigência de mostrar as telas oficiais; a aprovação comercial fica pendente dessa substituição e da aprovação da marca.

## Ambiente real e renderização

Node.js, Chromium, FFmpeg e Blender existem no ambiente auditado. A produção 3D utiliza **geometria real Three.js**, através de React Three Fiber e `ThreeCanvas` do Remotion. Blender não foi necessário nem foi apresentado como ferramenta executada para criar os objetos.

O ambiente tem quota de dois processadores e 8 GiB de memória. O backend `angle` não criou contexto WebGL; `swangle` (SwiftShader sobre ANGLE) funcionou e produziu fotogramas reais. Não há dependência de uma GPU física.

```bash
npm ci
npm run typecheck
npm run studio
npm run agexa:stills
npm run agexa:preview
npm run agexa:render
```

O Studio fica na porta 3000, com a pasta `AGEXA`. As seis cenas também têm composições próprias para revisão. `REMOTION_BROWSER_EXECUTABLE` ou `BROWSER_EXECUTABLE` permitem selecionar Chromium/Chrome.

O perfil final mantém tipografia e composição em 1080 × 1920; o raster interno dos objetos 3D usa DPR 0.75 para a renderização por software. A prévia usa DPR 0.45. Para um master com raster 3D integral, num ambiente mais rápido:

```bash
npm run agexa:render -- --full-3d
```

Todas as animações dependem dos frames, incluindo posições, luzes e ponteiros. Não se usam animações CSS temporizadas nem `useFrame()` do Three Fiber.

## Alterar textos, telas e contactos

Edite `content/agexa/campaign.json`. O slogan, website, WhatsApp, títulos, frases e caminhos dos recursos ficam separados dos componentes principais. Coloque recursos em `public/agexa/` e use caminhos relativos a `public/`.

- `logoFile`: PNG original aprovado (de preferência transparente). Defina `logoIsOriginal` apenas quando verdadeiro.
- `clientScreens`: capturas reais do fluxo de serviço, horário e confirmação, na ordem pretendida.
- `businessScreens`: painel empresarial e capturas adicionais, quando autorizadas.
- `assetsVerified`: só marque como verdadeiro após verificar os recursos e a respetiva proveniência. Esta opção remove o aviso de visualização conceptual.
- `cta`, `website`, `whatsapp`: mensagens e contactos de conversão.

As imagens de tela preservam a proporção, com recorte superior; confirme a legibilidade ao trocar capturas. Não se renderiza uma confirmação de marcação como ação realmente executada.

## Narração humana e mistura

O roteiro pt-MZ está em `voiceover-cues.json` e `voiceover-README.md`. Grave a voz com os tempos indicados e respeite a margem final de leitura do CTA. A música e o som podem ser reconstruídos:

```bash
python3 scripts/agexa-audio.py
python3 scripts/agexa-audio.py --narration /caminho/voz-aprovada.wav
```

O modo com voz usa FFmpeg para reduzir a música a partir do sinal da própria voz, preservando duração e tom. A geração de som exige o `numpy` já disponível no ambiente ou instalado a partir de `scripts/agexa/requirements-audio.txt`. Não edite nem substitua o áudio depois de sincronizar sem voltar a rever o vídeo.

## Testes e revisão

O render verifica a existência do MP4, resolução, FPS, codecs, duração, fluxo de áudio, silêncio e imagem preta prolongados. Os relatórios registam SHA-256, parâmetros do ambiente e limitações editoriais. A revisão visual passa pelos seis momentos-chave e pelos contactos no CTA. A aprovação de pronúncia pt-MZ depende da gravação humana, que não existe nesta versão.

O workflow `Render AGEXA Campaign` pode ser executado manualmente no GitHub Actions e disponibiliza os MP4 como artefactos. O workflow de futebol anterior é independente.

## Estrutura

```text
content/agexa/           Configuração e textos
src/agexa/scenes/        Seis cenas reutilizáveis
src/agexa/three/         Geometria, materiais, iluminação e câmara
public/agexa/assets/     Marca e proveniência
public/agexa/audio/      Faixas reais e créditos
scripts/agexa/           Renderização e verificação
scripts/agexa-audio.py   Composição original e mistura
out/agexa/               MP4 e relatórios reais
```

## Licenças e créditos

A música e os efeitos são síntese original do projeto, sem samples de música comercial. O manifesto `public/agexa/audio/credits.json` guarda ficheiros e hashes. O derivado de marca tem proveniência em `public/agexa/assets/credits.json`. As fontes locais DM Sans e Barlow usam SIL OFL, com licenças em `public/fonts/`; a campanha utiliza DM Sans.

Three.js, React Three Fiber e `@remotion/three` declaram MIT nas versões instaladas, listadas em `dependencies.json`. A licença Three.js foi preservada em `licenses/`. Remotion tem condições comerciais próprias em https://www.remotion.dev/license, que devem ser verificadas para o uso profissional da organização.
