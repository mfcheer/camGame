"""Project-standard offline voice authoring. See docs/VOICE_STANDARD.md.
Use --dry-run before generating; existing audio is preserved unless --force is explicit.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--kind', choices=['phrases', 'words', 'zh-words'], default='phrases')
parser.add_argument('--only', nargs='+', help='Canonical ids; omit to inspect/build the complete selected bank')
parser.add_argument('--force', action='store_true', help='Regenerate the explicitly selected existing audio')
parser.add_argument('--dry-run', action='store_true', help='Print the plan without downloading models or writing files')
args = parser.parse_args()
if args.force and not args.only:
    parser.error('--force requires --only, to avoid replacing the complete accepted voice library')
profile = json.loads((root/'scripts/voice-profile.json').read_text())
query = "import {ANIMAL_PHRASES} from './src/animalPhrases.js'; console.log(JSON.stringify(Object.values(ANIMAL_PHRASES).flat()));" if args.kind == 'phrases' else "import {WORDS_LIST} from './src/wordsConfig.js'; console.log(JSON.stringify(WORDS_LIST));"
entries = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', query], cwd=root))
if args.only:
    unknown = set(args.only) - {entry['id'] for entry in entries}
    if unknown:
        parser.error('Unknown canonical ids: '+', '.join(sorted(unknown)))
    entries = [entry for entry in entries if entry['id'] in args.only]

def targets(entry):
    if args.kind == 'phrases':
        return [root/'public'/entry['audio'].lstrip('/')]
    if args.kind == 'zh-words':
        return [root/'public/audio/words/zh'/f"{entry['id']}.mp3"]
    return [root/'public'/entry['audio'].lstrip('/'), root/'public/audio/words/review'/f"{entry['id']}.mp3"]

work = [entry for entry in entries if args.force or not all(path.exists() for path in targets(entry))]
for entry in entries:
    print(('GENERATE' if entry in work else 'KEEP')+' '+entry['id']+': '+', '.join(str(path.relative_to(root)) for path in targets(entry)), flush=True)
if args.dry_run or not work:
    raise SystemExit(0)

# Heavy dependencies/model loading are intentionally after planning and validation.
# zh-words uses only macOS `say` (Tingting) + ffmpeg, following voice-profile.json.
if args.kind == 'zh-words':
    rate = profile['output_sample_rate']
    manifest_path = root/'docs/voice-manifest.json'
    records = json.loads(manifest_path.read_text()) if manifest_path.exists() else []
    output = root/'output/speech'/'zh-words'
    output.mkdir(parents=True, exist_ok=True)
    trim = f"aformat=sample_rates={rate}:channel_layouts=mono,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,apad=pad_dur={profile['tail_silence_seconds']},asetpts=N/SR/TB"
    encode = ['-ar', str(rate), '-b:a', profile['output_bitrate']]
    for entry in work:
        cn = output/f"{entry['id']}-zh.aiff"
        subprocess.run(['/usr/bin/say', '-v', profile['chinese_voice'], '-r', str(profile['chinese_rate']), '-o', str(cn), entry['zh']], check=True)
        path = targets(entry)[0]
        path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(cn), '-af', f"{trim},{profile['master_filter']}", *encode, str(path)], check=True)
        record = {'kind': args.kind, 'id': entry['id'], 'text': entry['zh'], 'zh': entry['zh'], 'profile': profile,
                  'assets': [{'path': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()}]}
        records = [item for item in records if (item['kind'], item['id']) != (args.kind, entry['id'])] + [record]
        manifest_path.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
        print('Saved '+entry['id'], flush=True)
    raise SystemExit(0)

import numpy as np
import soundfile as sf
import torch
from kokoro import KPipeline
from huggingface_hub import hf_hub_download

weights = Path(hf_hub_download(profile['model'], 'kokoro-v1_0.pth'))
if hashlib.sha256(weights.read_bytes()).hexdigest() != profile['model_sha256']:
    raise RuntimeError('Kokoro model checksum changed; keep the accepted model and review the download before generating.')
output = root/'output/speech'/('animal-phrases' if args.kind == 'phrases' else 'natural-words')
output.mkdir(parents=True, exist_ok=True)
torch.set_num_threads(4)
pipeline = KPipeline(lang_code=profile['language'], repo_id=profile['model'], device='cpu')
manifest_path = root/'docs/voice-manifest.json'
records = json.loads(manifest_path.read_text()) if manifest_path.exists() else []

for entry in work:
    text = entry['en'] if args.kind == 'phrases' else entry['word']
    chunks = [audio.numpy() for _, _, audio in pipeline(text, voice=profile['voice'], speed=profile['speed'])]
    rate = profile['model_sample_rate']
    waveform = np.concatenate([np.zeros(round(rate*profile['head_silence_seconds'])), *chunks, np.zeros(round(rate*profile['tail_silence_seconds']))])
    wav = output/f"{entry['id']}.wav"
    sf.write(wav, waveform, rate)
    paths = targets(entry)
    for target in paths:
        target.parent.mkdir(parents=True, exist_ok=True)
    encode = ['-ar', str(profile['output_sample_rate']), '-b:a', profile['output_bitrate']]
    if args.kind == 'phrases':
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-af', profile['master_filter'], *encode, str(paths[0])], check=True)
    else:
        # Keep the accepted zh/en/zh/en teaching sequence. Chinese uses the established system voice.
        cn = output/f"{entry['id']}-zh.aiff"
        subprocess.run(['/usr/bin/say', '-v', profile['chinese_voice'], '-r', str(profile['chinese_rate']), '-o', str(cn), entry['zh']], check=True)
        trim = f"aformat=sample_rates={rate}:channel_layouts=mono,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_duration=0.01:start_threshold=-45dB,areverse,apad=pad_dur=0.18,asetpts=N/SR/TB"
        if args.force or not paths[0].exists():
            chain = f"[0:a]{trim},asplit=2[c1][c2];[1:a]aformat=sample_rates={rate}:channel_layouts=mono,asplit=2[e1][e2];[c1][e1][c2][e2]concat=n=4:v=0:a=1,{profile['master_filter']}[out]"
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(cn), '-i', str(wav), '-filter_complex', chain, '-map', '[out]', *encode, str(paths[0])], check=True)
        if args.force or not paths[1].exists():
            subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-af', profile['master_filter'], *encode, str(paths[1])], check=True)
    record = {'kind': args.kind, 'id': entry['id'], 'text': text, 'zh': entry.get('zh'), 'profile': profile,
              'assets': [{'path': str(path.relative_to(root)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest()} for path in paths]}
    records = [item for item in records if (item['kind'], item['id']) != (args.kind, entry['id'])] + [record]
    manifest_path.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
    print('Saved '+entry['id'], flush=True)
