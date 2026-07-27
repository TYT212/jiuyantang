import os, base64, json, urllib.request, urllib.error

TOKEN = os.environ["GITHUB_TOKEN"]
REPO = "TYT212/jiuyantang"
API = "https://api.github.com"
ROOT = "/tmp/jyt_deploy"
EXCLUDE = {"./.git", "./poem.js", "./style.css"}

proxy = urllib.request.ProxyHandler({"https": "http://127.0.0.1:52008"})
opener = urllib.request.build_opener(proxy)

def api(method, path, data=None, _try=0):
    url = API + path
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", "token " + TOKEN)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("User-Agent", "jiuyantang-deploy")
    if body is not None:
        req.add_header("Content-Type", "application/json")
    try:
        with opener.open(req, timeout=60) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 409 and _try == 0 and method == "PUT" and "/contents/" in path:
            return e.code, {}
        body = e.read().decode()
        raise SystemExit(f"HTTP {e.code} on {method} {path}: {body[:500]}")

# 1) initialize empty repo with README (Contents API)
readme = "# 玖言堂\n\n父亲田渴新（笔名）的古体诗词集，由女儿田亦田整理。\n"
st, js = api("PUT", f"/repos/{REPO}/contents/README.md",
             {"message": "init", "content": base64.b64encode(readme.encode()).decode(), "branch": "main"})
if st == 201:
    parent = js["commit"]["sha"]
elif st == 409:
    # README already exists -> get current main sha
    st2, js2 = api("GET", f"/repos/{REPO}/git/refs/heads/main")
    parent = js2["object"]["sha"]
else:
    raise SystemExit(f"init failed {st}")
print("repo initialized, parent commit:", parent)

# 2) collect files (include README content too so it stays in tree)
files = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    if ".git" in dirnames:
        dirnames.remove(".git")
    for fn in filenames:
        full = os.path.join(dirpath, fn)
        rel = os.path.relpath(full, ROOT)
        relp = "./" + rel
        if relp in EXCLUDE:
            continue
        files.append((rel, full))
files.sort()
print("uploading", len(files), "files via Git Data API")

# 3) create blobs
tree = []
for rel, full in files:
    with open(full, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    st, js = api("POST", f"/repos/{REPO}/git/blobs", {"content": b64, "encoding": "base64"})
    if st != 201:
        raise SystemExit(f"blob failed {st}: {js}")
    tree.append({"path": rel, "mode": "100644", "type": "blob", "sha": js["sha"]})
    print("blob ok", rel)

# 4) create tree
st, js = api("POST", f"/repos/{REPO}/git/trees", {"tree": tree})
if st != 201:
    raise SystemExit(f"tree failed {st}: {js}")
tree_sha = js["sha"]
print("tree", tree_sha)

# 5) create commit (parent = init commit)
st, js = api("POST", f"/repos/{REPO}/git/commits",
             {"message": "玖言堂诗词网站初始发布", "tree": tree_sha, "parents": [parent]})
if st != 201:
    raise SystemExit(f"commit failed {st}: {js}")
commit_sha = js["sha"]
print("commit", commit_sha)

# 6) update ref main -> new commit (fast-forward)
st, js = api("PATCH", f"/repos/{REPO}/git/refs/heads/main", {"sha": commit_sha})
print("ref update status", st)
if st not in (200,):
    raise SystemExit(f"ref failed {st}: {js}")
print("DONE", commit_sha)
