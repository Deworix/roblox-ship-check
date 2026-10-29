import {open,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

export function validateReport(report) {
  const issues = [];
  const object = value => value && typeof value === 'object' && !Array.isArray(value);
  const text = value => typeof value === 'string' && value.trim().length > 0;
  const strings = value => Array.isArray(value) && value.every(text);
  if (!object(report)) return ['Report must be a JSON object.'];
  if (report.schemaVersion !== 1) issues.push('schemaVersion must be 1.');
  if (!['demo', 'owned-project'].includes(report.subject)) issues.push('subject must distinguish demo from owned-project.');
  if (!text(report.scope)) issues.push('scope must describe the tested behavior.');
  if (!['pass', 'fail', 'blocked', 'not-run'].includes(report.result)) issues.push('Unknown result.');
  if (!['studio', 'lune', 'none'].includes(report.runtime)) issues.push('Unknown runtime.');
  if (!object(report.test) || !strings(report.test.steps) || !report.test.steps.length || !text(report.test.expected)) {
    issues.push('One shared test needs non-empty steps and an expected assertion.');
  }
  for (const phase of ['before', 'after']) {
    const run = report[phase];
    if (!object(run)) { issues.push(`${phase} must be a run record.`); continue; }
    if (typeof run.executed !== 'boolean') issues.push(`${phase}.executed must be a boolean.`);
    if (!['pass', 'fail', 'not-run'].includes(run.outcome)) issues.push(`${phase}.outcome is invalid.`);
    if (!strings(run.evidence)) issues.push(`${phase}.evidence must contain only non-empty references.`);
    if (run.executed === false && run.outcome !== 'not-run') issues.push(`${phase}: unexecuted work cannot have a test outcome.`);
    if (run.executed === true) {
      if (report.runtime === 'none' || !['pass', 'fail'].includes(run.outcome)) issues.push(`${phase}: executed work needs a runtime and outcome.`);
      if (!text(run.revision) || !text(run.observed) || !strings(run.evidence) || !run.evidence.length) {
        issues.push(`${phase}: executed work needs revision, observation and evidence references.`);
      }
    }
  }
  if (report.result === 'pass' && !(report.before?.executed === true && report.before?.outcome === 'fail' && report.after?.executed === true && report.after?.outcome === 'pass')) {
    issues.push('PASS needs an executed failing baseline and an executed passing rerun of the shared test.');
  }
  if (report.result === 'fail' && !(report.after?.executed === true && report.after?.outcome === 'fail')) {
    issues.push('FAIL needs an executed failing rerun. Use blocked/not-run when it could not execute.');
  }
  if (!strings(report.remainingChecks)) issues.push('remainingChecks must be an array of non-empty strings.');
  if (report.result === 'blocked' && !report.remainingChecks?.length) issues.push('A blocked result must explain what remains blocked.');
  return issues;
}

async function main() {
  if (process.argv.length === 3 && ['--help', '-h'].includes(process.argv[2])) {
    console.log('Usage: node check-report.mjs <local-report.json>\nChecks report consistency only; it does not authenticate evidence. Reads at most 256 KiB. No network or writes.');
    return;
  }
  if (process.argv.length !== 3) throw new Error('Usage: node check-report.mjs <local-report.json>');
  const limit = 256 * 1024;
  const handle = await open(process.argv[2], 'r');
  let content;
  try {
    const buffer = Buffer.alloc(limit + 1);
    let total = 0;
    while (total < buffer.length) {
      const {bytesRead} = await handle.read(buffer, total, buffer.length - total, total);
      if (!bytesRead) break;
      total += bytesRead;
    }
    if (total > limit) throw new Error('Report exceeds 256 KiB.');
    content = buffer.subarray(0, total).toString('utf8').replace(/^\uFEFF/, '');
  } finally { await handle.close(); }
  const report = JSON.parse(content);
  const issues = validateReport(report);
  console.log(JSON.stringify({valid:issues.length === 0, result:report.result, issues, evidenceAuthenticity:'not independently verified'}, null, 2));
  if (issues.length) process.exitCode = 1;
}

const invokedFile = process.argv[1] ? await realpath(process.argv[1]).catch(()=>null) : null;
if (invokedFile && invokedFile === await realpath(fileURLToPath(import.meta.url))) {
  main().catch(error => { console.error(JSON.stringify({valid:false,error:error.message})); process.exitCode = 1; });
}
