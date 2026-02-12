"""Add event/payload columns to logs.

Manual migration helper for SQLite.
"""
from __future__ import annotations

import sqlite3
from pathlib import Path


def migrate_logs_payload(db_path: str) -> None:
    path = Path(db_path)
    if not path.exists():
        return
    conn = sqlite3.connect(path)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(logentry)")
    columns = {row[1] for row in cursor.fetchall()}
    if "event" not in columns:
        cursor.execute("ALTER TABLE logentry ADD COLUMN event TEXT")
    if "payload" not in columns:
        cursor.execute("ALTER TABLE logentry ADD COLUMN payload TEXT")
    conn.commit()
    conn.close()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        migrate_logs_payload(sys.argv[1])
