from pathlib import Path
from bs4 import BeautifulSoup
import json
R=Path(__file__).resolve().parents[1]
updates={
'mutanabbi-barquqi':('https://downloads.hindawi.org/books/82959503.pdf','تحميل PDF مجانا ↓','نسخة رسمية مجانية من مؤسسة هنداوي. يرسل المصدر الملف للتنزيل؛ يظل الحفظ خاضعا لإعدادات المتصفح.'),
 'tahafut-falasifa':('http://mc.dlib.nyu.edu/files/books/auc_aco000043/auc_aco000043_lo.pdf','فتح PDF وحفظه ↗','ملف المكتبة الجامعية مباشرة، نحو ٢٩ ميجابايت. قد يفتح في قارئ PDF؛ استخدم أمر التنزيل أو الحفظ فيه. لا نضمن الحفظ التلقائي.'),
'disease-cure':('https://d1.islamhouse.com/data/ar/ih_books/single4/ar-aldaa-waldawa.pdf','فتح PDF وحفظه ↗','نسخة تتيحها مكتبة إسلام هاوس، بتحقيق محمد أجمل الإصلاحي، دار عطاءات العلم، ٧٥١ صفحة في ملف PDF. قد يفتح الملف في القارئ، والحفظ من قائمته. هذه طبعة الملف المرتبط، لا وصف لكل طبعات الكتاب.')}
B=[{'slug': 'dost-idiot', 'free': False}, {'slug': 'dost-poor-folk', 'free': False}, {'slug': 'dost-humiliated', 'free': False}, {'slug': 'dost-house-dead', 'free': False}, {'slug': 'dost-karamazov', 'free': False}, {'slug': 'dost-ridiculous-dream', 'free': False}, {'slug': 'dost-underground', 'free': False}, {'slug': 'dost-gambler', 'free': False}, {'slug': 'dost-letters', 'free': False}, {'slug': 'dost-adolescent', 'free': False}, {'slug': 'dost-demons', 'free': False}, {'slug': 'dost-netochka', 'free': False}, {'slug': 'dost-eternal-husband', 'free': False}, {'slug': 'dost-stepanchikovo', 'free': False}, {'slug': 'dost-uncle-dream', 'free': False}, {'slug': 'dost-double', 'free': False}, {'slug': 'dost-landlady', 'free': False}, {'slug': 'noah-sitt-hassan', 'free': False}, {'slug': 'mitchell-ai-guide', 'free': False}, {'slug': 'paranormal-02', 'free': False}, {'slug': 'paranormal-03', 'free': False}, {'slug': 'ababil-sijjil', 'free': False}, {'slug': 'ababil-zamharir', 'free': False}, {'slug': 'project-hail-mary', 'free': False}, {'slug': 'sallabi-43', 'free': True, 'pdfs': ['https://www.alsalabi.com/media/uploads/bookspdf/2022/12/08/a19a.pdf']}, {'slug': 'sallabi-62', 'free': True, 'pdfs': ['https://www.alsalabi.com/media/uploads/bookspdf/2024/08/20/a38.pdf']}, {'slug': 'sallabi-66', 'free': True, 'pdfs': ['https://www.alsalabi.com/media/uploads/bookspdf/2024/08/20/a42.pdf']}, {'slug': 'sallabi-41', 'free': True, 'pdfs': ['https://www.alsalabi.com/media/uploads/bookspdf/2024/08/20/a16.pdf']}, {'slug': 'sallabi-56', 'free': True, 'pdfs': ['https://www.alsalabi.com/media/uploads/bookspdf/2024/08/20/a32.pdf']}, {'slug': 'sallabi-35', 'free': True, 'pdfs': ['https://www.alsalabi.com/media/uploads/bookspdf/2024/08/28/alsanoseya.pdf']}]
for b in B:
 if b['free']:updates[b['slug']]=(b['pdfs'][0],'فتح PDF وحفظه ↗',('ملف الكتاب، ٥٨٤ صفحة، وليس مقتطف المقدمة. 'if b['slug']=='sallabi-43'else'ملف الكتاب من موقع المؤلف، لا نبذة الصفحة. ')+'المصدر يفتحه للقراءة؛ للحفظ استخدم التنزيل داخل قارئ PDF. هذا الزر لا يضمن الحفظ التلقائي.')
for slug in ['learn-programming-hsoub','python-hsoub']:
 p=R/'summaries'/f'{slug}.html';s=BeautifulSoup(p.read_text(),'html.parser');url=s.select_one('.book-landing-route a')['href'];updates[slug]=(url,'تنزيل عبر موقع الناشر ↗','يبدأ مسار التنزيل في أكاديمية حسوب، وقد يحتاج جلسة المتصفح أو خطوة داخل موقع الناشر. لم نثبت حفظ الملف تلقائيا في الفحص الحالي؛ رابط صفحة الناشر وفصول القراءة متاح أدناه.')
repl={};reg=json.load(open(R/'data/seo-books.json'))
for slug,(url,label,note)in updates.items():
 p=R/'summaries'/f'{slug}.html';s=BeautifulSoup(p.read_text(),'html.parser')
 for sec in s.select('.book-landing-route,.book-source'):
  a=sec.select_one('a');old=a['href'];repl[old]=(url,label,note);a['href']=url;a.string=label
  para=sec.select_one('p')
  if para:para.string=note
  else:
   para=s.new_tag('p',attrs={'class':'meta'});para.string=note;sec.append(para)
 p.write_text(str(s));item=next((x for x in reg if x['url']=='summaries/'+slug+'.html'),None)
 if item is None:
  item=dict(url='summaries/'+slug+'.html',title=s.h1.get_text(),free=True);reg.append(item)
 item['source_links']=list(dict.fromkeys([url]+item.get('source_links',[])))
for p in list((R/'js').glob('*free*.js'))+[R/'free-books.html']:
 t=p.read_text()
 for old,(url,label,note)in repl.items():
  t=t.replace(old,url)
  # Update only anchors for these exact destinations, including JSON-escaped quotes.
  import re
  for q in ['"','\\"']:
   pat='(<a\\b[^>]*href='+re.escape(q+url+q)+'[^>]*>)(.*?)(</a>)'
   t=re.sub(pat,lambda m:m[1]+label+m[3],t,flags=re.S)
 p.write_text(t)
(R/'data/seo-books.json').write_text(json.dumps(reg,ensure_ascii=False,indent=2)+'\n')
# Clarify only official Hindawi file actions, retaining source links in citations.
import re
for p in (R/'summaries').glob('*.html'):
 s=BeautifulSoup(p.read_text(),'html.parser');top=s.select_one('.book-landing-route');a=top.select_one('a')if top else None
 if a and a.get('href','').startswith('https://downloads.hindawi.org/books/')and a['href'].endswith('.pdf'):
  a.string='تحميل PDF مجانا ↓';note=top.select_one('p')
  if note:note.string='ملف PDF الرسمي مباشرة من مؤسسة هنداوي. يرسل المصدر الملف للتنزيل؛ قد يطلب متصفحك تأكيد الحفظ. نبذة هذه الصفحة ليست نص الكتاب.'
  p.write_text(str(s))
for p in list((R/'js').glob('*free*.js'))+[R/'free-books.html']:
 t=p.read_text()
 for phrase in ['اقرأ مجانا لدى المصدر','اقرأ مجانًا لدى المصدر']:
  # Remaining occurrences are official Hindawi links; viewer-only exceptions were relabeled above.
  t=t.replace(phrase,'تحميل PDF مجانا')
 p.write_text(t)
