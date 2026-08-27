import json, os, re, urllib.request

SHORTLIST = {
 1104692136:"snake-io",
 1440185894:"snake-rivals",
 6449243946:"snake-clash",
 1441412472:"little-big-snake",
 438052745:"snake-97",
 1233739175:"snake-vs-block",
 1387180314:"snaggle",
 1595070036:"sssnaker",
 1357967682:"worms-zone",
 1658495567:"snake-run-race",
 1665914232:"tangled-snakes",
 6753841130:"snake-escape-tap-away",
 6751537447:"snake-puzzle-slither",
 1451598523:"boas-io",
 1551589858:"snake-master-3d",
 6462355709:"snake-io-netflix",
 1177433971:"insatiable-io",
 1441086260:"snakerio-voodoo",
}
d=json.load(open('raw-snake-us.json'))
by={r['trackId']:r for r in d['results']}
meta={}
for tid,slug in SHORTLIST.items():
    r=by.get(tid)
    if not r:
        print("MISSING",slug); continue
    os.makedirs(f"screenshots/{slug}",exist_ok=True)
    urls=(r.get('screenshotUrls') or [])[:6]
    for i,u in enumerate(urls):
        out=f"screenshots/{slug}/{i:02d}.jpg"
        if os.path.exists(out): continue
        try: urllib.request.urlretrieve(u,out)
        except Exception as e: print("ERR",slug,i,e)
    meta[slug]={k:r.get(k) for k in ('trackName','sellerName','averageUserRating','userRatingCount','description','releaseDate','currentVersionReleaseDate','genres','price','formattedPrice','trackViewUrl','advisories','contentAdvisoryRating')}
    print(slug, len(urls))
json.dump(meta,open('shortlist-meta.json','w'),indent=1)
