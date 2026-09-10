import type { RuntimeWorktreeRecord } from '../../shared/runtime-types'
import type { WorkspaceLineage, WorktreeLineage } from '../../shared/worktree/lineage-types'
import { worktreeWorkspaceKey } from '../../shared/workspace-scope'
import type { CommandHandler } from '../dispatch'
import { printResult } from '../format'
import { getOptionalWorktreeSelector } from '../selectors'
import { getLineageSourceLabel } from './worktree-lineage-summary'

type WorktreeLineageList = {
  lineage: Record<string, WorktreeLineage>
  workspaceLineage: Record<string, WorkspaceLineage>
}

function formatLineageList(value: WorktreeLineageList): string {
  const rows = [
    ...Object.values(value.workspaceLineage).map(
      (record) =>
        `${record.childWorkspaceKey} -> ${record.parentWorkspaceKey} (${record.capture.confidence} from ${getLineageSourceLabel(record.capture.source)})`
    ),
    ...Object.values(value.lineage).map(
      (record) => `${record.worktreeId} -> ${record.parentWorktreeId} (git)`
    )
  ]
  return rows.length > 0 ? rows.join('\n') : 'no recorded lineage'
}

function pickKey<T>(map: Record<string, T>, key: string): Record<string, T> {
  const record = map[key]
  return record === undefined ? {} : { [key]: record }
}

export const WORKTREE_LINEAGE_HANDLERS: Record<string, CommandHandler> = {
  'worktree lineage': async ({ flags, client, cwd, json }) => {
    const selector = await getOptionalWorktreeSelector(flags, 'worktree', cwd, client)
    const response = await client.call<WorktreeLineageList>('worktree.lineageList')
    if (!selector) {
      printResult(response, json, formatLineageList)
      return
    }
    // Why: lineage is keyed by workspace key / worktree id, so a selector has to be
    // resolved to the concrete id before it can be looked up.
    const shown = await client.call<{ worktree: RuntimeWorktreeRecord }>('worktree.show', {
      worktree: selector
    })
    const { id } = shown.result.worktree
    printResult(
      {
        ...response,
        result: {
          lineage: pickKey(response.result.lineage, id),
          workspaceLineage: pickKey(response.result.workspaceLineage, worktreeWorkspaceKey(id))
        }
      },
      json,
      formatLineageList
    )
  }
}
