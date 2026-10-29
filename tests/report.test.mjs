import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,writeFile,unlink,rmdir,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {validateReport} from '../skills/roblox-ship-check/scripts/check-report.mjs';

const template = JSON.parse(await readFile(new URL('../skills/roblox-ship-check/assets/report.template.json',import.meta.url),'utf8'));
const pass = () => ({...structuredClone(template),subject:'demo',scope:'one in-memory purchase replay',result:'pass',runtime:'lune',
  test:{steps:['Call the same purchase request twice'],expected:'One debit and one grant'},
  before:{revision:'fixture-before',executed:true,outcome:'fail',observed:'20 coins, two grants',evidence:['local:before-output']},
  after:{revision:'fixture-after',executed:true,outcome:'pass',observed:'60 coins, one grant',evidence:['local:after-output']}});

test('unexecuted template is a valid not-run record, never a PASS',()=>assert.deepEqual(validateReport(template),[]));
test('executed scoped regression proof can pass',()=>assert.deepEqual(validateReport(pass()),[]));
test('unavailable Studio is a valid blocked result',()=>{const r=structuredClone(template);r.result='blocked';assert.deepEqual(validateReport(r),[]);});
test('reported PASS cannot be a plan without execution',()=>{const r=structuredClone(template);r.result='pass';assert.ok(validateReport(r).length);});
test('passing rerun without a failing baseline is not a regression proof',()=>{const r=pass();r.before.outcome='pass';assert.ok(validateReport(r).length);});
test('missing after evidence is rejected',()=>{const r=pass();r.after.evidence=[];assert.ok(validateReport(r).length);});
test('missing revision is rejected',()=>{const r=pass();r.before.revision='';assert.ok(validateReport(r).length);});
test('none runtime cannot describe an executed test',()=>{const r=pass();r.runtime='none';assert.ok(validateReport(r).length);});
test('failed rerun stays FAIL',()=>{const r=pass();r.result='fail';r.after.outcome='fail';r.after.observed='Still charged twice';assert.deepEqual(validateReport(r),[]);});
test('unexecuted failure cannot be reported as FAIL',()=>{const r=structuredClone(template);r.result='fail';assert.ok(validateReport(r).length);});
test('blocked result needs an actionable remaining check',()=>{const r=structuredClone(template);r.result='blocked';r.remainingChecks=[];assert.ok(validateReport(r).length);});
test('fixture cannot lose its demo versus owned-project scope',()=>{const r=pass();r.subject='everything';assert.ok(validateReport(r).length);});
test('malformed inputs return issues without crashing',()=>{for(const v of [null,[],1,'pass',{}, {schemaVersion:1,after:null}])assert.ok(validateReport(v).length);});

const checker = fileURLToPath(new URL('../skills/roblox-ship-check/scripts/check-report.mjs',import.meta.url));
async function cleanSingleTestFile(folder, path) {
  await unlink(path).catch(error=>{if(error.code!=='ENOENT')throw error;});
  await rmdir(folder); // Fails rather than recursively removing unexpected contents.
}
test('CLI help succeeds without reading a report',()=>{const r=spawnSync(process.execPath,[checker,'--help'],{encoding:'utf8'});assert.equal(r.status,0);assert.match(r.stdout,/Usage:/);});
test('CLI executes when the skill directory is installed through a link',async t=>{const folder=await mkdtemp(join(tmpdir(),'ship-check-link-'));const link=join(folder,'linked scripts');await symlink(dirname(checker),link,process.platform==='win32'?'junction':'dir');t.after(async()=>{if(process.platform==='win32')await rmdir(link);else await unlink(link);await rmdir(folder);});const input=fileURLToPath(new URL('../skills/roblox-ship-check/assets/report.template.json',import.meta.url));const r=spawnSync(process.execPath,[join(link,'check-report.mjs'),input],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).valid,true);});
test('CLI reads a Unicode path and UTF-8 BOM',async t=>{const folder=await mkdtemp(join(tmpdir(),'ship-check-'));const path=join(folder,'wynik próby.json');t.after(()=>cleanSingleTestFile(folder,path));await writeFile(path,'\uFEFF'+JSON.stringify(template));const r=spawnSync(process.execPath,[checker,path],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).valid,true);});
test('CLI rejects malformed JSON',async t=>{const folder=await mkdtemp(join(tmpdir(),'ship-check-'));const path=join(folder,'invalid.json');t.after(()=>cleanSingleTestFile(folder,path));await writeFile(path,'{not a report');const r=spawnSync(process.execPath,[checker,path],{encoding:'utf8'});assert.equal(r.status,1);assert.equal(JSON.parse(r.stderr).valid,false);});
test('CLI bounds the chosen input file',async t=>{const folder=await mkdtemp(join(tmpdir(),'ship-check-'));const path=join(folder,'large.json');t.after(()=>cleanSingleTestFile(folder,path));await writeFile(path,' '.repeat(256*1024+1));const r=spawnSync(process.execPath,[checker,path],{encoding:'utf8'});assert.equal(r.status,1);assert.match(JSON.parse(r.stderr).error,/256 KiB/);});
