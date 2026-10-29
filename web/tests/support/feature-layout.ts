// Layout rule for .feature files: in a scenario, a Given or When that comes after a Then starts a new part of the story,
// so put a blank line before it (And/But steps after it belong to its group and need none).

/** The problems found in the source of a feature file (an empty list means it follows the rule). */
export function featureLayoutProblems(source: string): string[] {
  const problems: string[] = []
  const lines = source.split(/\r?\n/)
  let checking = false // the steps so far in this group are Then steps (And and But continue the group)

  lines.forEach((line, i) => {
    const t = line.trim()
    if (/^(Feature|Rule|Background|Scenario|Scenario Outline|Scenario Template|Example|Examples|Setup|Variants)\b/.test(t)) { checking = false; return }
    const keyword = t.match(/^(Given|When|Then|And|But)\s/)?.[1]
    if (!keyword) return
    if ((keyword === 'Given' || keyword === 'When') && checking && lines[i - 1]?.trim() !== '') {
      problems.push(`line ${i + 1}: "${t}" comes after a Then, so put a blank line before it.`)
    }
    if (keyword === 'Then') checking = true
    else if (keyword === 'Given' || keyword === 'When') checking = false
  })
  return problems
}
