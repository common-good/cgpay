#!/usr/bin/env python3
# PostToolUse hook for Edit/Write: complain when the text just written has non-ASCII characters (Guide rule).
import json, re, sys
d = json.load(sys.stdin)
i = d.get('tool_input', {})
t = i.get('new_string') or i.get('content') or ''
bad = sorted(set(re.findall(r'[^\x00-\x7f]', t)))
if bad:
  print('Non-ASCII in %s: %s. Use plain ASCII (-, ", \', ->, ...).' % (i.get('file_path'), ' '.join('U+%04X' % ord(c) for c in bad)), file=sys.stderr)
  sys.exit(2)
