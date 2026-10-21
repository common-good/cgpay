// Checks the layout rules for steps.ts: all the GWhen steps, a blank line, then all the Then steps; one step per line,
// no blank lines inside a section, and each section in alphabetical order by step text without its arguments.

/** The sort key of a step: its text without {arguments} and punctuation, lowercase ("see {string}" is "see"). */
export function stepKey(pattern: string): string {
  return pattern.replace(/\{[^}]*\}/g, ' ').replace(/[:()]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase()
}

/** The problems found in the source of steps.ts (an empty list means it follows the rules). */
export function stepOrderProblems(source: string): string[] {
  const problems: string[] = []
  const lines = source.split(/\r?\n/)
  const steps = lines
    .map((line, i) => ({ i, m: line.match(/^(GWhen|Then)\(\s*(['"])((?:(?!\2)[^\\]|\\.)*)\2/) }))
    .flatMap(({ i, m }) => m ? [{ i, kind: m[1], key: stepKey(m[3]), text: m[3] }] : [])

  for (let n = 1; n < steps.length; n++) {
    const [a, b] = [steps[n - 1], steps[n]]
    if (a.kind === 'Then' && b.kind === 'GWhen') problems.push(`"${b.text}" is a GWhen step after the Then steps.`)
    else if (a.kind === b.kind) {
      if (b.i - a.i !== 1) problems.push(`"${b.text}" should follow "${a.text}" on the next line.`)
      if (b.key < a.key) problems.push(`"${b.text}" should come before "${a.text}".`)
    } else if (b.i - a.i !== 2 || lines[a.i + 1].trim() !== '') problems.push('There should be exactly one blank line between the GWhen and Then steps.')
  }
  return problems
}
