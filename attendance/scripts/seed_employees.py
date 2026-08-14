"""CSV 로 직원 일괄 등록.

    python -m scripts.seed_employees employees.csv

CSV 헤더: name,phone[,code][,memo]
이미 있는 번호는 이름/사번/비고만 갱신한다(중복 생성 안 함).
"""

from __future__ import annotations

import csv
import sys
from pathlib import Path

from app.db import init_db, session_scope
from app.models import Employee
from app.services.ingest import find_employee, normalize_phone


def seed(csv_path: Path) -> tuple[int, int]:
    created = updated = 0
    with session_scope() as session, csv_path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            name = (row.get("name") or "").strip()
            phone = normalize_phone(row.get("phone"))
            if not name or not phone:
                print(f"건너뜀(이름/번호 누락): {row}", file=sys.stderr)
                continue

            employee = find_employee(session, phone)
            if employee is None:
                employee = Employee(name=name, phone=phone)
                session.add(employee)
                created += 1
            else:
                updated += 1
            employee.name = name
            employee.code = (row.get("code") or "").strip() or None
            employee.memo = (row.get("memo") or "").strip() or None
            employee.active = True
    return created, updated


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 1
    path = Path(sys.argv[1])
    if not path.exists():
        print(f"파일이 없습니다: {path}", file=sys.stderr)
        return 1

    init_db()
    created, updated = seed(path)
    print(f"신규 {created}명, 갱신 {updated}명")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
