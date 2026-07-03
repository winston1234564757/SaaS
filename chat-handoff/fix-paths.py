#!/usr/bin/env python3
"""
Rename hardcoded user path  Vitossik -> Vitos  across BookIT config & repo.

Запускати ОДИН раз на новому ноуті, ПІСЛЯ того як:
  1) git clone SaaS зроблено в  C:\\Users\\Vitos\\SaaS
  2) бандл розкладено по місцях (.claude, .claude.json, .mempalace)

Робить ДВІ речі:
  A) міняє текст  Vitossik -> Vitos  у конфігах/коді/хуках;
  B) перейменовує папки auto-memory  ~/.claude/projects/C--Users-Vitossik-*
     на  C--Users-Vitos-*  (інакше Claude Code не знайде пам'ять — імена папок
     це закодований старий шлях).

Безпечно щодо кодування:
  - читає файл байтами, декодує строго як UTF-8;
  - якщо файл НЕ чистий UTF-8 (cp1251 / mojibake) — ПРОПУСКАЄ і друкує попередження,
    ніколи не псує вміст;
  - пише назад UTF-8 БЕЗ BOM (щоб не ламати .py / .json);
  - ідемпотентний: повторний запуск нічого не знайде.

НЕ чіпає: node_modules, .git, DEPRECATED, plugins, skills, .mempalace (там шляхи
косметичні, а сервер знаходить дані через ~/.mempalace автоматично).
"""
import os

OLD = "Vitossik"
NEW = "Vitos"

HOME = os.path.expanduser("~")            # на новому ноуті = C:\Users\Vitos
ROOTS = [os.path.join(HOME, "SaaS"),
         os.path.join(HOME, ".claude")]
EXTRA_FILES = [os.path.join(HOME, ".claude.json")]

TEXT_EXT = {".py", ".json", ".jsonl", ".md", ".txt", ".ts", ".tsx",
            ".js", ".mjs", ".cjs", ".yaml", ".yml", ".toml", ".cfg", ".ini"}
SKIP_DIRS = {"node_modules", ".git", ".next", "DEPRECATED", "graphify-out",
             ".claude-flow", "plugins", "skills", "dist", "build", ".turbo",
             "coverage", "playwright-report", "test-results"}


def process(path):
    try:
        with open(path, "rb") as f:
            raw = f.read()
    except OSError:
        return 0
    if OLD.encode() not in raw:
        return 0
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        print(f"  SKIP (not utf-8, fix manually): {path}")
        return -1
    n = text.count(OLD)
    with open(path, "wb") as f:
        f.write(text.replace(OLD, NEW).encode("utf-8"))
    return n


def fix_contents():
    targets = []
    for root in ROOTS:
        if not os.path.isdir(root):
            print(f"  (root missing, skip): {root}")
            continue
        for dp, dn, fn in os.walk(root):
            dn[:] = [d for d in dn if d not in SKIP_DIRS]
            for name in fn:
                if os.path.splitext(name)[1].lower() in TEXT_EXT:
                    targets.append(os.path.join(dp, name))
    targets += [p for p in EXTRA_FILES if os.path.isfile(p)]

    total = files = skipped = 0
    for p in targets:
        r = process(p)
        if r > 0:
            total += r
            files += 1
            print(f"  fixed {r:>4}  {p}")
        elif r < 0:
            skipped += 1
    print(f"\n  ЗМІСТ: {total} замін у {files} файлах. "
          f"{skipped} пропущено (не-utf8 — глянь вручну).")


def rename_memory_dirs():
    """Перейменувати ~/.claude/projects/*Vitossik* -> *Vitos* (bottom-up)."""
    base = os.path.join(HOME, ".claude", "projects")
    if not os.path.isdir(base):
        print("  (немає ~/.claude/projects — пропуск)")
        return
    renamed = 0
    for dp, dn, fn in os.walk(base, topdown=False):
        for d in dn:
            if OLD in d:
                src = os.path.join(dp, d)
                dst = os.path.join(dp, d.replace(OLD, NEW))
                if os.path.exists(dst):
                    print(f"  вже існує, пропуск: {dst}")
                else:
                    os.rename(src, dst)
                    print(f"  папка: {d} -> {os.path.basename(dst)}")
                    renamed += 1
    print(f"  ПАПКИ: перейменовано {renamed}.")


if __name__ == "__main__":
    print(f"Rename '{OLD}' -> '{NEW}'  під  {ROOTS}  +  ~/.claude.json\n")
    print("[A] Заміна тексту у файлах:")
    fix_contents()
    print("\n[B] Перейменування папок пам'яті:")
    rename_memory_dirs()
    print("\nDONE. Запусти verify-migration.ps1 для перевірки.")
