import soundfile as sf
import numpy as np
import subprocess
import hashlib
import json
from pathlib import Path
from kokoro import KPipeline

root = Path('.')
profile = json.loads((root/'scripts/voice-profile.json').read_text())
manifest_path = root/'docs/voice-manifest.json'
records = json.loads(manifest_path.read_text()) if manifest_path.exists() else []

END_ZH_ENTRIES = [
    {'id': 'thank-you', 'zh': '谢谢你，我的朋友！', 'en': 'Thank you, my friend!'},
    {'id': 'nice-day', 'zh': '祝你度过愉快的一天！', 'en': 'Have a nice day!'},
    {'id': 'see-you', 'zh': '下次再见！', 'en': 'See you again!'},
    {'id': 'goodbye', 'zh': '再见，我的朋友！', 'en': 'Goodbye, my friend!'},
    {'id': 'great-job', 'zh': '你太棒啦！', 'en': 'Great job!'},
    {'id': 'you-did-it', 'zh': '你做到啦！', 'en': 'You did it!'},
    {'id': 'so-much-fun', 'zh': '今天玩得真开心！', 'en': 'We had so much fun!'},
    {'id': 'see-you-tomorrow', 'zh': '明天见哦！', 'en': 'See you tomorrow!'},
]

p = KPipeline(lang_code='z', repo_id='hexgrad/Kokoro-82M')
rate = profile['model_sample_rate']
encode = ['-ar', str(profile['output_sample_rate']), '-b:a', profile['output_bitrate']]
master_filter = profile['master_filter']

output_dir = root/'output/speech/end-zh'
output_dir.mkdir(parents=True, exist_ok=True)

for entry in END_ZH_ENTRIES:
    text = entry['zh']
    chunks = [audio.numpy() for _, _, audio in p(text, voice='zf_xiaoxiao', speed=0.95)]
    waveform = np.concatenate([np.zeros(round(rate * profile['head_silence_seconds'])), *chunks, np.zeros(round(rate * profile['tail_silence_seconds']))])
    wav = output_dir/f"{entry['id']}-zh.wav"
    sf.write(wav, waveform, rate)
    
    mp3_natural = root/'public/audio/phrases/natural'/f"{entry['id']}-zh.mp3"
    mp3_flat = root/'public/audio/phrases'/f"{entry['id']}-zh.mp3"
    mp3_natural.parent.mkdir(parents=True, exist_ok=True)
    mp3_flat.parent.mkdir(parents=True, exist_ok=True)
    
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-af', master_filter, *encode, str(mp3_natural)], check=True)
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-af', master_filter, *encode, str(mp3_flat)], check=True)
    
    record = {
        'kind': 'end-zh-phrase',
        'id': f"{entry['id']}-zh",
        'text': text,
        'zh': text,
        'en': entry['en'],
        'profile': {'voice': 'zf_xiaoxiao', 'model': 'hexgrad/Kokoro-82M', 'lang': 'zh'},
        'assets': [
            {'path': str(mp3_natural.relative_to(root)), 'sha256': hashlib.sha256(mp3_natural.read_bytes()).hexdigest()},
            {'path': str(mp3_flat.relative_to(root)), 'sha256': hashlib.sha256(mp3_flat.read_bytes()).hexdigest()}
        ]
    }
    records = [item for item in records if not (item.get('kind') == 'end-zh-phrase' and item.get('id') == f"{entry['id']}-zh")] + [record]
    print(f"Generated {entry['id']}-zh: {text} -> {mp3_natural}", flush=True)

manifest_path.write_text(json.dumps(records, ensure_ascii=False, indent=2) + '\n')
print("All 8 Chinese farewell phrases synthesized successfully!")
