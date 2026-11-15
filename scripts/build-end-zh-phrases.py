"""Create the Chinese half of paired ending lines with the accepted Kokoro voice.

Run --dry-run first. Existing recordings are kept unless --only ID --force is explicit.
See docs/VOICE_STANDARD.md and scripts/voice-profile.json.
"""
import argparse
import hashlib
import json
import subprocess
import shutil
from pathlib import Path
from voice_audio_quality import check_phrase

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--only', nargs='+', help='Ending phrase IDs to generate')
parser.add_argument('--force', action='store_true', help='Rebuild selected existing recordings')
parser.add_argument('--dry-run', action='store_true', help='Show work without loading the model or changing files')
args = parser.parse_args()
if args.force and not args.only:
    parser.error('--force requires --only')
profile = json.loads((root/'scripts/voice-profile.json').read_text())
query = "import {ANIMAL_PHRASES} from './src/animalPhrases.js'; console.log(JSON.stringify(ANIMAL_PHRASES.end));"
entries = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', query], cwd=root))
if args.only:
    unknown = set(args.only) - {entry['id'] for entry in entries}
    if unknown:
        parser.error('Unknown ending phrase IDs: '+', '.join(sorted(unknown)))
    entries = [entry for entry in entries if entry['id'] in args.only]

def targets(entry):
    name = f"{entry['id']}-zh.mp3"
    return [root/'public/audio/phrases/natural'/name, root/'public/audio/phrases'/name]

work = [entry for entry in entries if args.force or not all(path.exists() for path in targets(entry))]
for entry in entries:
    print(('GENERATE' if entry in work else 'KEEP')+' '+entry['id']+': '+entry['zh'], flush=True)
if args.dry_run or not work:
    raise SystemExit(0)

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline
from huggingface_hub import hf_hub_download

weights = Path(hf_hub_download(profile['model'], 'kokoro-v1_0.pth'))
if hashlib.sha256(weights.read_bytes()).hexdigest() != profile['model_sha256']:
    raise RuntimeError('Kokoro model checksum changed; review before generating.')
torch.set_num_threads(4)
pipeline = KPipeline(lang_code=profile['end_chinese_language'], repo_id=profile['model'], device='cpu')
rate = profile['model_sample_rate']
output = root/'output/speech/end-zh'
output.mkdir(parents=True, exist_ok=True)
manifest_path = root/'docs/voice-manifest.json'
records = json.loads(manifest_path.read_text()) if manifest_path.exists() else []
trim = f"aformat=sample_rates={rate}:channel_layouts=mono,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,apad=pad_dur={profile['tail_silence_seconds']},asetpts=N/SR/TB"
encode = ['-ar', str(profile['output_sample_rate']), '-b:a', profile['output_bitrate']]
for entry in work:
    chunks = [audio.numpy() for _, _, audio in pipeline(entry['zh'], voice=profile['end_chinese_voice'], speed=profile['end_chinese_speed'])]
    waveform = np.concatenate(chunks)
    wav = output/f"{entry['id']}-zh.wav"
    sf.write(wav, waveform, rate)
    paths = targets(entry)
    for path in paths:
        path.parent.mkdir(parents=True, exist_ok=True)
    filters = f"{trim},{profile['master_filter']}"
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-af', filters, *encode, str(paths[0])], check=True)
    check_phrase(paths[0], wav, filters, profile)
    shutil.copyfile(paths[0], paths[1])
    record = {
        'kind': 'end-zh-phrase', 'id': f"{entry['id']}-zh", 'text': entry['zh'],
        'zh': entry['zh'], 'en': entry['en'],
        'profile': {'model': profile['model'], 'model_sha256': profile['model_sha256'],
                    'language': profile['end_chinese_language'], 'voice': profile['end_chinese_voice'],
                    'speed': profile['end_chinese_speed'], 'output_sample_rate': profile['output_sample_rate'],
                    'output_bitrate': profile['output_bitrate'], 'master_filter': profile['master_filter']},
        'assets': [{'path': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in paths]
    }
    records = [item for item in records if (item.get('kind'), item.get('id')) != ('end-zh-phrase', record['id'])] + [record]
    manifest_path.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
    print('Saved '+entry['id'], flush=True)
