from __future__ import annotations
import argparse
import shutil
from datetime import datetime
from pathlib import Path
import fnmatch
import sys


def find_candidates(data_dir: Path) -> list[Path]:
    # Whitelist: keep canonical and temp files
    whitelist_patterns = [
        "health-guidelines.json",
        "guidelines_*.json",
        "temp_*",
        "*.md",
        ".trash",
        "*.yaml",
        "*.yml",
    ]

    candidates: list[Path] = []
    for p in sorted(data_dir.iterdir()):
        if not p.is_file():
            # skip dirs (except .trash handled above)
            continue
        name = p.name
        keep = False
        for pat in whitelist_patterns:
            if fnmatch.fnmatch(name, pat):
                keep = True
                break
        if not keep:
            candidates.append(p)
    return candidates


def ensure_trash(trash_root: Path) -> Path:
    trash_root.mkdir(parents=True, exist_ok=True)
    sub = trash_root / datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    sub.mkdir(parents=True, exist_ok=True)
    return sub


def move_to_trash(files: list[Path], trash_dir: Path) -> None:
    for f in files:
        dest = trash_dir / f.name
        print(f"Moving {f} -> {dest}")
        shutil.move(str(f), str(dest))


def main(argv: list[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]
    parser = argparse.ArgumentParser(
        description="Find non-temp intermediate files in data/ and move them to data/.trash/"
    )
    parser.add_argument("--data-dir", default="data", help="Path to the data directory")
    parser.add_argument("--dry-run", action="store_true", help="Only list candidates, do not move")
    parser.add_argument("--delete", action="store_true", help="Actually move the files to trash")
    parser.add_argument("--yes", action="store_true", help="Skip confirmation prompt when --delete is used")

    args = parser.parse_args(argv)

    data_dir = Path(args.data_dir)
    if not data_dir.exists() or not data_dir.is_dir():
        print(f"Error: data dir '{data_dir}' not found.")
        return 2

    candidates = find_candidates(data_dir)

    if not candidates:
        print("No non-temp intermediate files found in", data_dir)
        return 0

    print("Found the following candidate files to remove/move:")
    for p in candidates:
        print(" -", p.name)

    if args.dry_run:
        print("\nDry-run: no files were moved. To apply, run with --delete.")
        return 0

    if not args.delete:
        print("No action requested. Use --dry-run or --delete.")
        return 0

    if not args.yes:
        resp = input("Proceed to move these files to data/.trash/? [y/N]: ")
        if resp.strip().lower() not in ("y", "yes"):
            print("Aborted by user.")
            return 1

    trash_root = data_dir / ".trash"
    trash_sub = ensure_trash(trash_root)
    move_to_trash(candidates, trash_sub)
    print(f"Moved {len(candidates)} files to {trash_sub}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
