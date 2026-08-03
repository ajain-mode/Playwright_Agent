from pathlib import Path
t = Path("src/agent/.cache/mono-temp/btms/php/src/admintools.php").read_text(encoding="utf-8", errors="ignore")
i = t.find("OR parse a new one")
print(t[i:i+2500])
