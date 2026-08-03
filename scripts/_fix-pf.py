from pathlib import Path
import re

p = Path(r"d:\ali-sajjad\ns-perfume\src\components\admin\product-form.tsx")
t = p.read_text(encoding="utf-8")

t = re.sub(r"Sillage \(1.*?5\)", "Sillage (1-5)", t)

if 'from "@/components/ui/button"' not in t:
    t = t.replace(
        'import { Select } from "@/components/ui/select";',
        'import { Select } from "@/components/ui/select";\nimport { Button } from "@/components/ui/button";',
    )

start = t.find('      <div className="flex flex-wrap gap-3">')
end = t.find("    </form>", start)
if start != -1 and end != -1:
    new = """      <div className=\"flex flex-wrap gap-3\">
        <Button type=\"submit\" disabled={saving}>
          {saving ? \"Saving...\" : \"Save product\"}
        </Button>
        {!isNew ? (
          <Button type=\"button\" variant=\"danger\" onClick={remove}>
            Delete
          </Button>
        ) : null}
      </div>
"""
    t = t[:start] + new + t[end:]

# Prefer proper ellipsis
t = t.replace("Saving...", "Saving\u2026")

p.write_text(t, encoding="utf-8", newline="\n")
print("ok")
