"""Remove useMemo/useCallback wrappers from TSX/TS files.
React Compiler (reactCompiler: true) handles memoization automatically.
"""
import re
from pathlib import Path


def find_call_end(text, open_pos):
    depth = 0
    i = open_pos
    in_str = False
    str_char = None
    while i < len(text):
        c = text[i]
        if in_str:
            if c == chr(92):  # backslash
                i += 2
                continue
            if c == str_char:
                in_str = False
        else:
            if c in ('"', "'"):
                in_str = True
                str_char = c
            elif c == '`':
                j = i + 1
                while j < len(text) and text[j] != '`':
                    if text[j] == chr(92):
                        j += 1
                    j += 1
                i = j
            elif c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def find_last_top_comma(s):
    depth_p = depth_b = depth_c = 0
    in_str = False
    str_char = None
    last = -1
    i = 0
    while i < len(s):
        c = s[i]
        if in_str:
            if c == chr(92):
                i += 2
                continue
            if c == str_char:
                in_str = False
        else:
            if c in ('"', "'"):
                in_str = True
                str_char = c
            elif c == '`':
                j = i + 1
                while j < len(s) and s[j] != '`':
                    if s[j] == chr(92):
                        j += 1
                    j += 1
                i = j
            elif c == '(':
                depth_p += 1
            elif c == ')':
                depth_p -= 1
            elif c == '[':
                depth_b += 1
            elif c == ']':
                depth_b -= 1
            elif c == '{':
                depth_c += 1
            elif c == '}':
                depth_c -= 1
            elif c == ',' and depth_p == 0 and depth_b == 0 and depth_c == 0:
                last = i
        i += 1
    return last


def remove_wrapper(text, keyword):
    result = []
    i = 0
    replaced = 0

    while i < len(text):
        idx = text.find(keyword + '(', i)
        if idx == -1:
            result.append(text[i:])
            break

        # Avoid matching inside identifiers like 'myUseMemo'
        if idx > 0 and (text[idx - 1].isalnum() or text[idx - 1] == '_'):
            result.append(text[i:idx + 1])
            i = idx + 1
            continue

        open_p = idx + len(keyword)
        close_p = find_call_end(text, open_p)

        if close_p == -1:
            result.append(text[i:idx + 1])
            i = idx + 1
            continue

        inner = text[open_p + 1:close_p]
        comma_pos = find_last_top_comma(inner)

        if comma_pos == -1:
            result.append(text[i:idx + 1])
            i = idx + 1
            continue

        after_comma = inner[comma_pos + 1:].strip()
        if not after_comma.startswith('['):
            result.append(text[i:idx + 1])
            i = idx + 1
            continue

        fn_part = inner[:comma_pos].strip()

        if keyword == 'useMemo':
            m = re.match(r'^\(\s*\)\s*=>\s*', fn_part)
            if m:
                body = fn_part[m.end():]
                result.append(text[i:idx])
                result.append(body)
                i = close_p + 1
                replaced += 1
                continue
        elif keyword == 'useCallback':
            result.append(text[i:idx])
            result.append(fn_part)
            i = close_p + 1
            replaced += 1
            continue

        result.append(text[i:idx + 1])
        i = idx + 1

    return ''.join(result), replaced


def process_file(path):
    text = path.read_text(encoding='utf-8')
    orig = text
    text, rm = remove_wrapper(text, 'useMemo')
    text, rc = remove_wrapper(text, 'useCallback')
    if text != orig:
        path.write_text(text, encoding='utf-8')
    return rm, rc


def main():
    src = Path(r'C:\Users\Vitos\SaaS\bookit\src')
    total_m = total_c = files = 0

    for ext in ('*.tsx', '*.ts'):
        for f in src.rglob(ext):
            try:
                rm, rc = process_file(f)
                if rm or rc:
                    files += 1
                    total_m += rm
                    total_c += rc
            except Exception as e:
                print(f'ERROR {f.name}: {e}')

    print(f'useMemo removed:    {total_m}')
    print(f'useCallback removed: {total_c}')
    print(f'Files changed:       {files}')


if __name__ == '__main__':
    main()
