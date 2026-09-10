import type { CommandSpec } from '../args'
import { GLOBAL_FLAGS } from '../args'

export const WORKTREE_LINEAGE_COMMAND_SPECS: CommandSpec[] = [
  {
    path: ['worktree', 'lineage'],
    summary: 'Show recorded worktree and folder-workspace lineage',
    usage: 'orca worktree lineage [--worktree <selector>] [--json]',
    allowedFlags: [...GLOBAL_FLAGS, 'worktree'],
    notes: [
      'Folder membership lives in workspaceLineage; parentWorktreeId on `worktree show` is git lineage and stays null when the parent is a folder workspace.'
    ],
    examples: ['orca worktree lineage --json', 'orca worktree lineage --worktree active --json']
  }
]
