/**
 * `worktree set` resolves two selectors, but the recovery named only `--worktree`. A folder
 * workspace passed as `--parent-worktree` therefore reported the healthy child worktree as
 * missing, which reads as broken local state rather than an unsupported parent kind.
 */
import { describe, expect, it } from 'vitest'
import { worktreeSelectorRecovery } from './worktree-selector-recovery'

const CHILD = 'identity:wt2:local:13ad6c60-90c7-4a44-a80e-b6f7b9f8ad47'
const FOLDER_PARENT = 'folder:0da37455-4268-4419-9528-faea5dd7ed7c'

describe('worktreeSelectorRecovery', () => {
  it('names both selectors and the folder-parent limit when a parent was resolved too', () => {
    const recovery = worktreeSelectorRecovery(CHILD, FOLDER_PARENT)

    expect(recovery.parentSelector).toBe(FOLDER_PARENT)
    expect(recovery.nextSteps[0]).toContain(CHILD)
    expect(recovery.nextSteps[0]).toContain(FOLDER_PARENT)
    expect(recovery.nextSteps[0]).not.toMatch(/^No Orca workspace matched the worktree selector/)
    expect(recovery.nextSteps.join('\n')).toContain('`worktree create`, not `worktree set`')
  })

  it('blames the single selector when the command resolved only --worktree', () => {
    const recovery = worktreeSelectorRecovery(CHILD)

    expect(recovery.parentSelector).toBeUndefined()
    expect(recovery.nextSteps[0]).toBe(
      `No Orca workspace matched the worktree selector "${CHILD}".`
    )
    expect(recovery.nextSteps.join('\n')).not.toContain('--parent-worktree')
  })
})
