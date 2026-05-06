import json

with open('data.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

js_content = 'window.RH_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';'

with open('data.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print('data.js written:', len(js_content), 'chars')
print('Records:', data['meta']['total_companies'])
print('Contacts:', data['meta']['total_contacts'])
