import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface RepoConfig {
  repoUrl: string;
  branch: string;
  name: string;
  subPath: string;
  fileTypes: string[];
  app: string;
}

interface CloneMetadataEntry {
  repoUrl: string;
  branch: string;
  lastPull: string;
  commitHash: string;
}

type CloneMetadata = Record<string, CloneMetadataEntry>;

const METADATA_FILENAME = 'clone-metadata.json';

const GIT_VERSION_TIMEOUT_MS = 5_000;
const GIT_CLONE_TIMEOUT_MS = 120_000;
const GIT_PULL_TIMEOUT_MS = 30_000;
const GIT_REV_PARSE_TIMEOUT_MS = 5_000;

function quoteCmdArg(arg: string): string {
  return `"${arg.replace(/"/g, '\\"')}"`;
}

function metadataPath(cacheDir: string): string {
  return path.join(cacheDir, METADATA_FILENAME);
}

function readMetadata(cacheDir: string): CloneMetadata {
  const p = metadataPath(cacheDir);
  if (!fs.existsSync(p)) {
    return {};
  }
  try {
    const raw = fs.readFileSync(p, 'utf8');
    const parsed = JSON.parse(raw) as CloneMetadata;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMetadata(cacheDir: string, data: CloneMetadata): void {
  try {
    fs.mkdirSync(cacheDir, { recursive: true });
    fs.writeFileSync(metadataPath(cacheDir), JSON.stringify(data, null, 2), 'utf8');
  } catch {
    /* empty */
  }
}

function isGitOnPath(): boolean {
  try {
    execSync('git --version', { encoding: 'utf8', timeout: GIT_VERSION_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}

function tryGetHead(repoPath: string): string | null {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: repoPath,
      encoding: 'utf8',
      timeout: GIT_REV_PARSE_TIMEOUT_MS,
    })
      .trim();
  } catch {
    return null;
  }
}

function tryRemoteUrl(repoPath: string): string | null {
  try {
    return execSync('git config --get remote.origin.url', {
      cwd: repoPath,
      encoding: 'utf8',
      timeout: GIT_REV_PARSE_TIMEOUT_MS,
    })
      .trim();
  } catch {
    return null;
  }
}

function tryCurrentBranch(repoPath: string): string | null {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      encoding: 'utf8',
      timeout: GIT_REV_PARSE_TIMEOUT_MS,
    })
      .trim();
  } catch {
    return null;
  }
}

function formatPulledAgo(lastPullIso: string): string {
  const t = new Date(lastPullIso).getTime();
  if (Number.isNaN(t)) {
    return 'unknown time ago';
  }
  const ms = Date.now() - t;
  if (ms < 60_000) {
    return 'less than 1 minute ago';
  }
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function errMessage(e: unknown): string {
  if (e instanceof Error) {
    return e.message;
  }
  return String(e);
}

function dirExists(full: string): boolean {
  try {
    return fs.existsSync(full) && fs.statSync(full).isDirectory();
  } catch {
    return false;
  }
}

export class RepoCloneManager {
  constructor(
    private cacheDir: string,
    private maxAgeMs: number = 24 * 60 * 60 * 1000
  ) {}

  async ensureRepos(repos: RepoConfig[]): Promise<{ sourceDirs: Map<string, string>; anyUpdated: boolean }> {
    const sourceDirs = new Map<string, string>();
    let anyUpdated = false;
    if (!isGitOnPath()) {
      console.warn('⚠️ Git is not available on PATH; skipping repository clone/update.');
      return { sourceDirs, anyUpdated };
    }
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    } catch (e) {
      console.warn(`⚠️ Could not create cache directory: ${errMessage(e)}`);
      return { sourceDirs, anyUpdated };
    }

    for (const repo of repos) {
      try {
        const entry = this.ensureOneRepo(repo);
        if (entry) {
          sourceDirs.set(repo.name, entry.path);
          if (entry.wasUpdated) {
            anyUpdated = true;
          }
        }
      } catch (e) {
        console.warn(`⚠️ Could not clone/pull ${repo.name}: ${errMessage(e)}`);
      }
    }
    return { sourceDirs, anyUpdated };
  }

  private ensureOneRepo(repo: RepoConfig): { path: string; wasUpdated: boolean } | null {
    const repoPath = path.join(this.cacheDir, repo.name);
    const subFullPath = path.resolve(path.join(repoPath, repo.subPath));
    const metaAll = readMetadata(this.cacheDir);
    const meta = metaAll[repo.name];

    if (fs.existsSync(repoPath) && meta && (meta.repoUrl !== repo.repoUrl || meta.branch !== repo.branch)) {
      try {
        fs.rmSync(repoPath, { recursive: true, force: true });
      } catch (e) {
        console.warn(`⚠️ Could not clone/pull ${repo.name}: ${errMessage(e)}`);
        return null;
      }
      return this.ensureOneRepo(repo);
    }

    if (!fs.existsSync(repoPath)) {
      try {
        console.log(`📦 Cloning ${repo.name} from ${repo.repoUrl}...`);
        const cloneCmd = [
          'git',
          'clone',
          '--depth',
          '1',
          '--branch',
          quoteCmdArg(repo.branch),
          quoteCmdArg(repo.repoUrl),
          quoteCmdArg(repoPath),
        ].join(' ');
        execSync(cloneCmd, {
          encoding: 'utf8',
          timeout: GIT_CLONE_TIMEOUT_MS,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (e) {
        console.warn(`⚠️ Could not clone/pull ${repo.name}: ${errMessage(e)}`);
        return null;
      }
      if (!dirExists(subFullPath)) {
        console.warn(`⚠️ Subpath missing in ${repo.name} clone: ${repo.subPath}`);
        return null;
      }
      const hash = tryGetHead(repoPath);
      if (!hash) {
        console.warn(`⚠️ Could not clone/pull ${repo.name}: failed to read commit after clone`);
        return null;
      }
      metaAll[repo.name] = {
        repoUrl: repo.repoUrl,
        branch: repo.branch,
        lastPull: new Date().toISOString(),
        commitHash: hash,
      };
      writeMetadata(this.cacheDir, metaAll);
      return { path: subFullPath, wasUpdated: true };
    }

    const prev = meta;
    const lastPullIso = prev?.lastPull ?? '';
    const lastPullMs =
      lastPullIso && !Number.isNaN(Date.parse(lastPullIso))
        ? new Date(lastPullIso).getTime()
        : 0;
    const ageOk =
      prev &&
      prev.repoUrl === repo.repoUrl &&
      prev.branch === repo.branch &&
      lastPullMs > 0 &&
      Date.now() - lastPullMs < this.maxAgeMs;

    if (ageOk && dirExists(subFullPath)) {
      console.log(`✅ Using cached ${repo.name} (pulled ${formatPulledAgo(prev.lastPull)})`);
      return { path: subFullPath, wasUpdated: false };
    }

    if (ageOk && !dirExists(subFullPath)) {
      console.warn(`⚠️ Subpath missing in ${repo.name} clone: ${repo.subPath}`);
      return null;
    }

    const prevHash = prev?.commitHash ?? '';

    try {
      console.log(`🔄 Updating ${repo.name} (cache stale)...`);
      execSync('git pull', {
        cwd: repoPath,
        encoding: 'utf8',
        timeout: GIT_PULL_TIMEOUT_MS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      console.warn(
        `⚠️ Could not clone/pull ${repo.name}: ${errMessage(e)} — trying stale cache if available.`
      );
      if (dirExists(subFullPath)) {
        return { path: subFullPath, wasUpdated: false };
      }
      return null;
    }

    if (!dirExists(subFullPath)) {
      console.warn(`⚠️ Subpath missing in ${repo.name} clone: ${repo.subPath}`);
      return null;
    }

    const hash = tryGetHead(repoPath);
    if (!hash) {
      console.warn(`⚠️ Could not clone/pull ${repo.name}: failed to read commit after pull`);
      if (dirExists(subFullPath)) {
        return { path: subFullPath, wasUpdated: false };
      }
      return null;
    }

    const wasUpdated = hash !== prevHash;
    metaAll[repo.name] = {
      repoUrl: repo.repoUrl,
      branch: repo.branch,
      lastPull: new Date().toISOString(),
      commitHash: hash,
    };
    writeMetadata(this.cacheDir, metaAll);
    return { path: subFullPath, wasUpdated };
  }

  async forceRefresh(repoName: string): Promise<void> {
    if (!isGitOnPath()) {
      console.warn('⚠️ Git is not available on PATH; cannot refresh repository cache.');
      return;
    }
    const repoPath = path.join(this.cacheDir, repoName);
    if (!fs.existsSync(repoPath)) {
      console.warn(`⚠️ No cached repository folder for "${repoName}".`);
      return;
    }
    try {
      execSync('git pull', {
        cwd: repoPath,
        encoding: 'utf8',
        timeout: GIT_PULL_TIMEOUT_MS,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      const hash = tryGetHead(repoPath);
      if (!hash) {
        console.warn(`⚠️ Could not clone/pull ${repoName}: failed to read commit after pull`);
        return;
      }
      const metaAll = readMetadata(this.cacheDir);
      const remote = tryRemoteUrl(repoPath) ?? metaAll[repoName]?.repoUrl ?? '';
      const branch = tryCurrentBranch(repoPath) ?? metaAll[repoName]?.branch ?? '';
      metaAll[repoName] = {
        repoUrl: remote,
        branch,
        lastPull: new Date().toISOString(),
        commitHash: hash,
      };
      writeMetadata(this.cacheDir, metaAll);
    } catch (e) {
      console.warn(`⚠️ Could not clone/pull ${repoName}: ${errMessage(e)}`);
    }
  }
}
