#!/usr/bin/env python3
"""Idempotently add GA4 loader and minimal CSP allowances. No body/UI edits."""
from pathlib import Path
import re, html
ROOT = Path(__file__).resolve().parents[1]
ALLOW = {
 'script-src': ['https://www.googletagmanager.com'],
 'script-src-elem': ['https://www.googletagmanager.com'],
 'img-src': ['https://www.googletagmanager.com','https://*.google-analytics.com'],
 'connect-src': ['https://www.googletagmanager.com','https://*.google-analytics.com','https://*.google.com']
}
count = 0
for path in sorted(ROOT.rglob('*.html')):
 if '.git' in path.parts: continue
 old = path.read_text()
 value = old
 def policy(match):
  raw = html.unescape(match.group(2))
  directives = [part.strip().split() for part in raw.split(';') if part.strip()]
  table = {part[0]: part for part in directives}
  for key, hosts in ALLOW.items():
   if key == 'script-src-elem' and key not in table: continue
   if key not in table:
    fallback = table.get('default-src', ['default-src', "'self'"])[1:]
    table[key] = [key] + list(fallback)
    directives.append(table[key])
   for host in hosts:
    if host not in table[key]: table[key].append(host)
  result = '; '.join(' '.join(part) for part in directives)
  return match.group(1) + html.escape(result, quote=True) + match.group(3)
 def meta(match):
  tag = match.group(0)
  if not re.search(r'http-equiv=[\"\']Content-Security-Policy[\"\']', tag, re.I): return tag
  return re.sub(r'(content=[\"])([^\"]*)([\"])', policy, tag, count=1, flags=re.I)
 value = re.sub(r'<meta\b[^>]*>', meta, value, flags=re.I)
 prefix = '../' * len(path.relative_to(ROOT).parts[:-1])
 tags = ''.join('<script defer src="'+prefix+'js/'+file+'"></script>' for file in ['analytics.js'])
 if 'js/analytics.js' not in value:
  value = re.sub(r'</head\s*>', tags + '</head>', value, count=1, flags=re.I)
 if value != old:
  path.write_text(value)
  count += 1
print('Analytics loader/policy updated on', count, 'HTML files. Body/UI unchanged.')

# Approved text-only privacy correction.
p = ROOT / "privacy.html"
p.write_text(p.read_text().replace('لا نبيع بياناتك ولا نشاركها مع أي جهة إلا عند وجود التزام قانوني.','لا نبيع بياناتك. جهزنا Google Analytics لإحصائيات الزيارات وتحسين تجربة الموقع، والقياس غير مفعّل حاليا لحين إضافة معرّف القياس. عند تفعيله قد تستقبل Google بيانات الاستخدام والتفاعل وتستخدم ملفات ارتباط للتحليل؛ لا نرسل نصوص التلخيص أو الملفات أو رسائل واتساب عبر أداة القياس. يلزم ضبط متطلبات الموافقة المناسبة للزوار قبل التفعيل.'))
