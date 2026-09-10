// Why: the runtime answers an unresolvable `--worktree` with a bare
// `selector_not_found` — no offending value and no grammar — so a caller who passed
// a repo id where a worktree id belongs cannot tell what was wrong (#16904). The CLI
// is the only layer that still knows what the caller typed, so it shapes the recovery
// here, in the same validFlags/suggestions/nextSteps shape as an unknown-flag error.

export const WORKTREE_SELECTOR_FORMS = [
  'id:<repo-id>::<absolute-path>',
  'path:<absolute-path>',
  'name:<display-name>',
  'branch:<branch>',
  'identity:<identity-key>',
  'issue:<number>',
  'current',
  'active'
] as const

export type WorktreeSelectorRecovery = {
  selector: string
  parentSelector?: string
  validSelectorForms: readonly string[]
  suggestions: readonly string[]
  nextSteps: readonly string[]
}

const PREFIXES = ['id:', 'path:', 'name:', 'branch:', 'identity:', 'issue:']

function suggestForms(selector: string): string[] {
  if (selector.startsWith('id:')) {
    // A worktree id is `<repo-id>::<path>`; the repo id alone names no checkout.
    return selector.includes('::')
      ? []
      : [`id:${selector.slice(3)}::<absolute-path>`, 'path:<absolute-path>']
  }
  if (PREFIXES.some((prefix) => selector.startsWith(prefix))) {
    return []
  }
  return selector.startsWith('/') || /^[A-Za-z]:[\\/]/.test(selector)
    ? [`path:${selector}`]
    : [`id:${selector}::<absolute-path>`, `name:${selector}`, `branch:${selector}`]
}

export function worktreeSelectorRecovery(
  selector: string,
  parentSelector?: string
): WorktreeSelectorRecovery {
  const suggestions = suggestForms(selector)
  // Why: a command can resolve two selectors (`worktree set` takes --worktree AND
  // --parent-worktree). Naming only --worktree reported a healthy worktree as missing
  // when the parent was the unresolvable one, so say both were tried instead.
  const blamed = parentSelector
    ? `No Orca workspace matched a worktree selector for this command. Tried --worktree "${selector}" and --parent-worktree "${parentSelector}".`
    : `No Orca workspace matched the worktree selector "${selector}".`
  return {
    selector,
    ...(parentSelector ? { parentSelector } : {}),
    validSelectorForms: WORKTREE_SELECTOR_FORMS,
    suggestions,
    nextSteps: [
      blamed,
      ...(suggestions.length > 0 ? [`Did you mean: ${suggestions.join(', ')}`] : []),
      `Valid selector forms: ${WORKTREE_SELECTOR_FORMS.join(', ')}.`,
      ...(parentSelector
        ? [
            '--parent-worktree accepts only worktree selectors; folder:<id> is accepted by `worktree create`, not `worktree set`.'
          ]
        : []),
      'List the exact values with `orca worktree list --json`; a bare repository id is not a worktree id.'
    ]
  }
}
