"""Authoring only: uv run --no-project --python 3.12 --with kokoro==0.9.4 --with soundfile python scripts/build-natural-phrases.py
Produces static audio; model/runtime are never shipped to the browser.
Source model: https://huggingface.co/hexgrad/Kokoro-82M (Apache-2.0).
"""
import json
import subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline

root = Path(__file__).resolve().parents[1]
phrases = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', "import {ANIMAL_PHRASES} from './src/animalPhrases.js'; console.log(JSON.stringify(Object.values(ANIMAL_PHRASES).flat()));"], cwd=root))
output = root / 'output/speech/animal-phrases'
output.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(4)
pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M', device='cpu')
records = []
for phrase in phrases:
    chunks = [audio.numpy() for _, _, audio in pipeline(phrase['en'], voice='af_heart', speed=.92)]
    waveform = np.concatenate([np.zeros(2400), *chunks, np.zeros(4320)])
    wav = output / f"{phrase['id']}.wav"
    sf.write(wav, waveform, 24000)
    target = root / 'public/audio/phrases/natural' / f"{phrase['id']}.mp3"
    target.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-af', 'loudnorm=I=-18:TP=-2:LRA=7,afade=t=in:st=0:d=0.015', '-ar', '44100', '-b:a', '128k', str(target)], check=True)
    records.append({'id': phrase['id'], 'text': phrase['en'], 'duration': round(len(waveform)/24000, 3), 'voice': 'af_heart', 'speed': .92, 'audio': str(target.relative_to(root))})
    print(f"Generated {phrase['id']}: {len(waveform)/24000:.2f}s", flush=True)
(output/'generation.json').write_text(json.dumps(records, indent=2)+'\n')
