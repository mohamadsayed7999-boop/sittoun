#!/usr/bin/env python3
"""Build paid metadata and source wiring without changing free books or visible UI.
Edit data/books.json for canonical destinations. Run this file from repository root.
No fake affiliate links/codes, prices, availability, or global analytics are generated.
"""
import json,re,hashlib,base64
from pathlib import Path
from urllib.parse import urlparse,quote
from html import escape
import xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
BASE='https://mohamadsayed7999-boop.github.io/sittoun/'
REL='nofollow sponsored noopener noreferrer'
def safe(value):
 u=urlparse(value)
 return u.scheme in ('http','https') and bool(u.hostname) and not(u.username or u.password) and not any(c in value for c in '\r\n\t')
def attr(tag,name,value):
 pattern=r'\s'+re.escape(name)+r'\s*=\s*([\"\']).*?\1'
 if re.search(pattern,tag,re.S):return re.sub(pattern,' '+name+'="'+escape(value,quote=True)+'"',tag,count=1,flags=re.S)
 return tag[:-1]+' '+name+'="'+escape(value,quote=True)+'">'
def main():
 data=json.loads((ROOT/'data/books.json').read_text());books=data['books'];books+=sum([json.loads((ROOT/'data'/n).read_text())['books']for n in data.get('additional_files',[])],[]);ids=set();paths=set()
 assert data['scope']=='paid_books_only'
 for b in books:
  for k in ['id','title','author','category','description','cover_image','monetization_type','source_name','destination_url','page_path']:assert b.get(k),(b['id'],k)
  assert re.fullmatch('[a-z0-9-]+',b['id']) and b['id']not in ids
  assert b['page_path'].startswith('summaries/')and'..'not in b['page_path'] and b['page_path']not in paths
  ids.add(b['id']);paths.add(b['page_path']);assert safe(b['destination_url'])
  assert b['monetization_type']in ['direct_store','direct_publisher','affiliate_store']
  if b['monetization_type']=='affiliate_store':assert b.get('affiliate_confirmed')is True
  for a in b.get('alternative_routes',[]):assert safe(a['destination_url'])
  p=ROOT/b['page_path'];s=p.read_text()
  # Remove previous generated block only. Article and source panels remain in place.
  s=re.sub(r'\n?<!-- paid-generated:start -->.*?<!-- paid-generated:end -->\n?','',s,flags=re.S)
  desc=b['description'];s=re.sub(r'<meta\b(?=[^>]*\bname=[\"\']description[\"\'])[^>]*>',lambda m:'<meta name="description" content="'+escape(desc,quote=True)+'">',s,flags=re.I)
  # Existing title is truthful and intentionally retained, including its depth label.
  canon=BASE+b['page_path'];schema={'@context':'https://schema.org','@type':'Book','name':b['title'],'author':{'@type':'Person','name':b['author']},'description':desc,'inLanguage':'ar','url':canon}
  image=b['cover_image']
  if image.startswith('https://'):schema['image']=image
  elif image.startswith('assets/'):schema['image']=BASE+image
  js=json.dumps(schema,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
  sha=base64.b64encode(hashlib.sha256(js.encode()).digest()).decode()
  # CSP permits this exact inert structured-data block, without allowing inline executable JS.
  def csp(m):
   tag=m.group(0)
   tag=re.sub(r"script-src 'self'(?: 'sha256-[^']+')?",lambda _:"script-src 'self' 'sha256-"+sha+"'",tag)
   if 'connect-src'not in tag:tag=tag.replace("default-src 'self';","default-src 'self'; connect-src 'self';")
   return tag
  s=re.sub(r'<meta\b(?=[^>]*Content-Security-Policy)[^>]*>',csp,s,flags=re.I)
  s=re.sub(r'<link\b(?=[^>]*\brel=[\"\']canonical[\"\'])[^>]*>','',s,flags=re.I)
  block='\n<!-- paid-generated:start -->\n<link rel="canonical" href="'+canon+'">\n<script type="application/ld+json">'+js+'</script>\n<!-- paid-generated:end -->\n'
  s=s.replace('</head>',block+'</head>')
  s=re.sub(r'<body\b[^>]*>',lambda m:attr(m.group(0),'data-paid-book-id',b['id']),s,count=1)
  if b['routing_status']=='active':
   targets={b['destination_url']:'0',**{a['destination_url']:a['route_id']for a in b.get('alternative_routes',[])}}
   def link(m):
    tag=m.group(0);hm=re.search(r'\bhref\s*=\s*([\"\'])(.*?)\1',tag,re.S)
    if not hm:return tag
    from html import unescape
    url=unescape(hm.group(2));existing=re.search(r'data-destination="([^"]+)"',tag)
    if existing:url=unescape(existing.group(1))
    if url not in targets:return tag
    for k,v in [('href','../go.html?id='+quote(b['id'])+'&route='+targets[url]),('data-destination',url),('target','_blank'),('rel',REL)]:tag=attr(tag,k,v)
    return tag
   s=re.sub(r'<a\b[^>]*>',link,s)
  s=s.replace('../js/app.js','../js/app-paid.js')
  if '../js/book-links.js'not in s:s=s.replace('</body>','<script defer src="../js/book-links.js"></script>\n</body>')
  # Only visual addition approved: unobtrusive same-style copyright footer link.
  if '../copyright.html'not in s:s=re.sub(r'(<footer\b.*?<p>.*?</p>.*?)(</p>)',r'\1 · <a href="../copyright.html">حقوق النشر</a>\2',s,count=1,flags=re.S)
  p.write_text(s)
 # Preserve all existing sitemap entries, add only actual paid and utility/legal pages.
 sp=ROOT/'sitemap.xml';tree=ET.parse(sp);root=tree.getroot();ns='{http://www.sitemaps.org/schemas/sitemap/0.9}';ET.register_namespace('',ns[1:-1]);seen={e.text for e in root.iter(ns+'loc')}
 for path in sorted(paths|{'copyright.html'}):
  url=BASE+path
  if url not in seen:node=ET.SubElement(root,ns+'url');ET.SubElement(node,ns+'loc').text=url;seen.add(url)
 tree.write(sp,encoding='utf-8',xml_declaration=True)
 print('Validated and built',len(books),'paid works;',sum(b['routing_status']=='active'for b in books),'active routes')
if __name__=='__main__':main()
