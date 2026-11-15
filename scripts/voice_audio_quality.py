"""Small recording checks for newly authored phrase MP3s (no runtime dependency)."""
import array
import math
import subprocess
from pathlib import Path


def inspect(path: Path, rate: int = 44100):
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(path), '-f', 's16le', '-ac', '1', '-ar', str(rate), 'pipe:1'])
    samples = array.array('h')
    samples.frombytes(raw)
    if not samples:
        raise RuntimeError(f'Empty voice recording: {path}')
    peak = max(abs(v) for v in samples) / 32768
    rms = math.sqrt(sum(v * v for v in samples) / len(samples)) / 32768
    active = [n for n, v in enumerate(samples) if abs(v) > 500]
    active_seconds = (active[-1] - active[0]) / rate if active else 0
    return {'duration': len(samples) / rate, 'peak': peak, 'rms': rms, 'active_seconds': active_seconds}


def check_phrase(path: Path, wav: Path, filters: str, profile: dict):
    """Raise on silence; correct unexpectedly quiet one-pass loudnorm clips."""
    m = inspect(path)
    if m['active_seconds'] < .42 or m['peak'] < .025:
        raise RuntimeError(f'Voice recording has too little audible speech: {path}: {m}')
    if m['rms'] < .06:
        gain = min(.83 / m['peak'], .095 / m['rms'])
        if gain <= 1:
            raise RuntimeError(f'Voice recording is unexpectedly quiet: {path}: {m}')
        tmp = path.with_name(path.stem + '.levelled.mp3')
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav),
                        '-af', f'{filters},volume={gain:.4f},alimiter=limit=0.95',
                        '-ar', str(profile['output_sample_rate']), '-b:a', profile['output_bitrate'], str(tmp)], check=True)
        tmp.replace(path)
        m = inspect(path)
    if m['rms'] < .055 or m['peak'] > .96 or m['active_seconds'] < .42:
        raise RuntimeError(f'Voice recording failed quality gate: {path}: {m}')
    print(f"QC {path.name}: {m['duration']:.2f}s, audible {m['active_seconds']:.2f}s, RMS {m['rms']:.3f}, peak {m['peak']:.3f}", flush=True)
