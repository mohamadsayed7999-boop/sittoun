#!/usr/bin/env python3
"""Static book landing metadata and crawlable links. No redirects or new download URLs."""
from pathlib import Path
from html import escape,unescape
import re,json,xml.etree.ElementTree as ET
from urllib.parse import urlparse
R=Path(__file__).resolve().parents[1]
BASE='https://mohamadsayed7999-boop.github.io/sittoun/'
def plain(s):return ' '.join(unescape(re.sub('<[^>]+>',' ',s)).split())
def block(s,name,content):
 s=re.sub(r'\s*<!-- '+name+r' -->.*?<!-- /'+name+r' -->','',s,flags=re.S)
 return s, '<!-- '+name+' -->'+content+'<!-- /'+name+' -->'
def meta(s,url,title=None,desc=None):
 s=re.sub(r'<link\b(?=[^>]*\brel=[\"\x27]canonical[\"\x27])[^>]*>','',s,flags=re.I)
 s=re.sub(r'<meta\b(?=[^>]*\bproperty=[\"\x27]og:url[\"\x27])[^>]*>','',s,flags=re.I)
 if title:s=re.sub(r'<title>.*?</title>','<title>'+escape(title)+'</title>',s,count=1,flags=re.S)
 if desc:
  s=re.sub(r'<meta\b(?=[^>]*\bname=[\"\x27]description[\"\x27])[^>]*>','<meta name="description" content="'+escape(desc,quote=True)+'">',s,count=1,flags=re.I)
 tags='<link rel="canonical" href="'+url+'"><meta property="og:url" content="'+url+'">'
 return s.replace('</head>',tags+'</head>',1)
def run():
 registry={b['url']:b for b in json.loads((R/'data/seo-books.json').read_text())}
 books=[]
 for p in sorted((R/'summaries').glob('*.html')):
  s=p.read_text();rel=p.relative_to(R).as_posix()
  s=re.sub(r'\s*<!-- book-landing-route -->.*?<!-- /book-landing-route -->','',s,flags=re.S)
  if not re.search('<article\\b',s):continue
  assert 'http-equiv="refresh"'not in s.lower(),rel
  h=re.search(r'<h1\b[^>]*>(.*?)</h1>',s,re.S);assert h,rel
  title=registry.get(rel,{}).get('title')or plain(h[1]).removeprefix('خلاصة «').removesuffix('»')
  m=re.search(r'<p\b[^>]*class=[\"\x27]meta[\"\x27][^>]*>(.*?)</p>',s,re.S)
  author=registry.get(rel,{}).get('author') or (plain(m[1]).split('·')[0].removeprefix('تأليف ').strip()if m else '')
  # Registry is the current rendered catalog, not scraped search results.
  links=registry.get(rel,{}).get('source_links',[])
  source=re.search(r'<section\b[^>]*class=[\"\x27]book-source[\"\x27][^>]*>(.*?)</section>',s,re.S)
  assert source,rel
  actions=re.findall(r'<a\b([^>]*)>(.*?)</a>',source[1],re.S)
  chosen=None
  for attrs,body in actions:
   u=re.search(r'href=[\"\x27]([^\"\x27]+)',attrs)
   if u and (urlparse(unescape(u[1])).scheme in ['https','http'] or unescape(u[1]).startswith('../go.html?id=')):
    chosen=(unescape(u[1]),plain(body));break
  assert chosen,rel
  href,label=chosen
  if links:assert href in links,rel
  # The same already-present official route is surfaced, never redirected or replaced.
  # Preserve all route attributes, including the paid route's destination and disclosure.
  route=re.search(r'<a\b[^>]*href=[\"\x27]'+re.escape(escape(href,quote=True))+r'[\"\x27][^>]*>.*?</a>',source[1],re.S)
  assert route,rel
  route_html=route[0]
  route_note=' '.join(plain(source[1]).split())[:350]
  if '../go.html?id=' in href:
   route_html=re.sub(r'(?<=>)[^<>]*(?=</a>)','مرجع الطبعة الرسمية المدفوعة ↗',route_html)
   route_note+=' هذه ليست نسخة مجانية. تحقق من نوع الطبعة وإمكان الشراء في بلدك لدى المصدر؛ الرابط ليس تأكيدا للتوفر.'
  s,top=block(s,'book-landing-route','<section class="callout book-landing-route" aria-label="الوصول إلى النسخة الرسمية">'+route_html+'<p class="meta">'+escape(route_note)+'</p></section>')
  # Place after the book identity, before the cover/editorial. No floating controls.
  m=re.search(r'<article\b[^>]*>.*?<p\b[^>]*class=[\"\x27]meta[\"\x27][^>]*>.*?</p>',s,re.S);assert m,rel
  s=s[:m.end()]+top+s[m.end():]
  url=BASE+rel
  desc=title+'، '+author+'. '+(' '.join(plain(source[1]).split())[:180])
  s=meta(s,url,title+' | '+author+' | ستّون',desc)
  p.write_text(s);books.append((title,author,rel))
 assert len(books)>=880
 # Paged, ordinary static anchors work with JavaScript off and do not duplicate visual cards.
 chunks=[books[i:i+100]for i in range(0,len(books),100)]
 nav=' '.join('<a href="books-'+str(i+1)+'.html">'+str(i+1)+'</a>'for i in range(len(chunks)))
 for i,chunk in enumerate(chunks):
  name='books-'+str(i+1)+'.html';title='فهرس الكتب '+str(i+1)+' | ستّون'
  s='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><meta name="description" content="فهرس بروابط مباشرة إلى صفحات الكتب والنسخ الرسمية في ستّون"><link rel="stylesheet" href="css/style.css?v=17"><script defer src="js/analytics.js"></script></head><body><header class="site-header"><nav><a class="brand" href="index.html">ستّون</a><a href="library.html">المكتبة</a><a href="free-books.html">الكتب المجانية</a></nav></header><main class="prose"><h1>فهرس الكتب: '+str(i+1)+'</h1><p>افتح اسم الكتاب للوصول إلى صفحته والنسخة الرسمية مباشرة. بعض الطبعات مجانية وبعضها تجاري؛ الصفحة تميز بينهما.</p><nav aria-label="صفحات الفهرس">'+nav+'</nav><ul>'
  s+=''.join('<li><a href="'+rel+'">'+escape(t)+'</a> <span class="meta">'+escape(a)+'</span></li>'for t,a,rel in chunk)
  s+='</ul><nav aria-label="صفحات الفهرس">'+nav+'</nav></main></body></html>'
  (R/name).write_text(meta(s,BASE+name))
 p=R/'index.html';s=p.read_text();s=meta(s,BASE,'ستّون | مكتبة الكتب والقراءات العربية','ستّون: مكتبة قراءات عربية وروابط النسخ الرسمية للكتب، المجانية والتجارية. ابحث باسم الكتاب لفتح صفحته مباشرة.')
 s,link=block(s,'static-book-directory','<p class="callout"><a href="books-1.html">فهرس الكتب: روابط مباشرة لكل كتاب ←</a></p>')
 s=s.replace('</main>',link+'</main>',1);p.write_text(s)
 p=R/'library.html';s=p.read_text();s,link=block(s,'static-book-directory','<p class="callout"><a href="books-1.html">فهرس الكتب بروابط مباشرة ←</a></p>');s=s.replace('</main>',link+'</main>',1);p.write_text(s)
 p=R/'sitemap.xml';root=ET.fromstring(p.read_text());ns={'s':'http://www.sitemaps.org/schemas/sitemap/0.9'};existing={x.text for x in root.findall('s:url/s:loc',ns)}
 ET.register_namespace('',ns['s'])
 for i in range(len(chunks)):
  u=BASE+'books-'+str(i+1)+'.html'
  if u not in existing:ET.SubElement(ET.SubElement(root,'{'+ns['s']+'}url'),'{'+ns['s']+'}loc').text=u
 p.write_text('<?xml version="1.0" encoding="utf-8"?>\n'+ET.tostring(root,encoding='unicode'))
 print('Book landing pages:',len(books),'static directory pages:',len(chunks))
if __name__=='__main__':run()
