# Narração AGEXA — guião para gravação humana

**Não foi produzida uma narração.** Os filmes usam música original, efeitos e textos no ecrã. Não foi identificada uma voz sintética adequada ao português natural de Moçambique.

`voiceover-cues.json` e os ficheiros `recording-guide.srt` são guias de gravação por cena, não legendas por palavra medidas de uma voz existente. Grave uma voz humana moçambicana com os tempos do guião, como WAV estéreo ou mono, 48 kHz. Não ler o contacto completo em voz alta: o telefone e o website permanecem no ecrã.

Para misturar uma gravação aprovada sem alterar o tom nem o tempo:

```bash
python3 scripts/agexa-audio.py --narration /caminho/narracao-40s.wav --short-narration /caminho/narracao-15s.wav
```

A mistura usa redução automática da música a partir do sinal real da voz. O operador mantém os direitos e a autorização da pessoa gravada. Áudios mais longos do que a duração do filme são rejeitados; o programa não os acelera nem corta a frase final.
