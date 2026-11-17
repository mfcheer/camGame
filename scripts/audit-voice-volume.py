"""Audit every shipped MP3; --repair remasters only quiet clips, preserving voice/text.
Run without --repair first. Backups and reports stay under ignored output/audio-audit.
Uses the same decoded peak floor (8000/32768) as the standard voice generator.
"""
import argparse
import concurrent.futures
import hashlib
import json
import math
import shutil
import subprocess
from array import array
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def measure(path):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path),
                                   '-f', 's16le', '-ac', '1', '-ar', '44100', '-'])
    samples = array('h'); samples.frombytes(raw)
    peak = max(map(abs, samples), default=0)
    rms = math.sqrt(sum(v*v for v in samples)/len(samples)) if samples else 0
    return {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
            'duration': len(samples)/44100, 'peak': peak, 'rms_dbfs': 20*math.log10(rms/32768) if rms else None,
            'quiet': 0 < peak < 8000, 'invalid': not peak}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repair', action='store_true')
    args = parser.parse_args()
    profile = json.loads((ROOT/'scripts/voice-profile.json').read_text())
    paths = sorted((ROOT/'public/audio').rglob('*.mp3'))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        before = list(pool.map(measure, paths))
    output = ROOT/'output/audio-audit'; output.mkdir(parents=True, exist_ok=True)
    repairs = []
    for row in before:
        if not row['quiet']: continue
        print(('REPAIR ' if args.repair else 'WOULD REPAIR ')+row['path']+f" peak={row['peak']}", flush=True)
        if not args.repair: continue
        path = ROOT/row['path']
        backup = output/'originals'/path.relative_to(ROOT/'public/audio')
        backup.parent.mkdir(parents=True, exist_ok=True)
        if backup.exists():
            raise RuntimeError(f'Backup already exists: {backup}; review before repeating')
        shutil.copyfile(path, backup)
        temp = output/'remaster.mp3'
        gain = 16000/row['peak']
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(path), '-af', f'volume={gain:.9f}',
                        '-ar', str(profile['output_sample_rate']), '-b:a', profile['output_bitrate'], str(temp)], check=True)
        after = measure(temp)  # Do not replace anything until QC passes.
        if after['invalid'] or not 12000 <= after['peak'] <= 20000 or abs(after['duration']-row['duration']) > .05:
            raise RuntimeError(f'Remaster failed QC: {after}')
        temp.replace(path)
        repairs.append({'path': row['path'], 'original_sha256': row['sha256'], 'sha256': after['sha256'],
                        'gain_db': 20*math.log10(gain), 'before_peak': row['peak'], 'after_peak': after['peak']})
    if args.repair:
        manifest = ROOT/'docs/voice-manifest.json'
        records = json.loads(manifest.read_text())
        changed = {r['path']: r for r in repairs}
        for record in records:
            for asset in record.get('assets', []):
                if asset['path'] in changed:
                    asset['sha256'] = changed[asset['path']]['sha256']
                    asset['volume_remaster'] = changed[asset['path']]
        manifest.write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        after = list(pool.map(measure, paths)) if args.repair else before
    report = {'profile': profile, 'method': 'decoded peak floor 8000; quiet clips remastered to 16000 without trimming or resynthesis',
              'before': before, 'repairs': repairs, 'after': after}
    report_path = output/('repair.json' if args.repair else 'plan.json')
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
    print(f"Scanned {len(paths)}, quiet {sum(r['quiet'] for r in after)}, invalid {sum(r['invalid'] for r in after)}, repaired {len(repairs)}")
    if any(r['invalid'] for r in after): raise SystemExit(1)

if __name__ == '__main__': main()
