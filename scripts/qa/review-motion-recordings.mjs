// Extract reviewable video frames from the named motion capture matrix.
// Video timestamps and navigation performance timestamps have different origins;
// use the phase log to understand the sequence, not to claim frame alignment.
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const directory = process.argv[2];
if (!directory) throw new Error('Supply the motion evidence directory');
const report = JSON.parse(await readFile(path.join(directory, 'metrics.json'), 'utf8'));
const output = path.join(directory, 'frames');
await mkdir(output, { recursive: true });
const cache = process.env.PLAYWRIGHT_BROWSERS_PATH || path.join(process.env.LOCALAPPDATA || '', 'ms-playwright');
const ffmpegDirectory = (await readdir(cache)).filter(name => name.startsWith('ffmpeg-')).sort().at(-1);
const ffmpeg = process.argv[3] || path.join(cache, ffmpegDirectory || '', process.platform === 'win32' ? 'ffmpeg-win64.exe' : 'ffmpeg-linux');
const results = [];
for (const row of report.results.filter(row => row.sceneEvidence?.kind === 'recorded-motion')) {
    const video = path.join(directory, 'video', row.name.replace('.png', '.webm'));
    const probe = spawnSync(ffmpeg, ['-i', video], { encoding: 'utf8', windowsHide: true });
    const time = probe.stderr?.match(/Duration: (\d+):(\d+):([\d.]+)/);
    if (!time) throw new Error(`FFmpeg cannot read ${video}: ${probe.error || probe.stderr}`);
    const duration = Number(time[1]) * 3600 + Number(time[2]) * 60 + Number(time[3]);
    const evidence = row.sceneEvidence;
    const action = evidence.actions[0].at / 1000;
    const moments = [...new Set([.35, 1, action - .12, action + .2, action + .65, ...evidence.phases.filter(phase => phase.phase === 'welcome').map(phase => phase.at / 1000 + .25), duration - .2])].filter(time => time > 0 && time < duration).sort((a, b) => a - b);
    const frames = [];
    for (const [index, time] of moments.entries()) {
      const name = `${row.name.replace('.png', '')}-${String(index).padStart(2, '0')}-${time.toFixed(2)}s.png`;
      const extracted = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-ss', String(time), '-i', video, '-frames:v', '1', '-update', '1', path.join(output, name)], { encoding: 'utf8', windowsHide: true });
      if (extracted.status !== 0) throw new Error(`FFmpeg extraction failed: ${extracted.error || extracted.stderr}`);
      frames.push({ time, file: name });
    }
    results.push({ name: row.name, durationSeconds: duration, frames });
    console.log(row.name, `${duration.toFixed(2)}s`, `${frames.length}frames`);
}
await writeFile(path.join(output, 'index.json'), JSON.stringify({ note: 'Extracted frames for manual visual inspection; not a physical-device or compositor performance certificate.', results }, null, 2));
