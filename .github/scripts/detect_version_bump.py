"""Detect whether the current commit bumps the version in app_version.yml.

Writes the following keys to $GITHUB_OUTPUT (consumed by GitHub Actions):
    is_release: "true" or "false"
    version:    "vX.Y.Z" or ""
    minor:      "vX.Y"   or ""
    major:      "vX"     or ""

Compares the `version` field between the current `app_version.yml` and the
same field at `HEAD^`. If they differ, the new version must match a strict
`X.Y.Z` (no pre-release suffixes); otherwise the script exits non-zero.
"""

import os
import re
import subprocess
import sys

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is required. Install it with: pip install pyyaml")


def read_version(text: str) -> str:
    """Return the `version` field from an app_version.yml document."""
    data = yaml.safe_load(text)
    return data["version"]


def main() -> None:
    """Detect a version bump and write GitHub Actions outputs."""
    with open("app_version.yml") as fh:
        new_version = read_version(fh.read())

    try:
        old_raw = subprocess.check_output(
            ["git", "show", "HEAD^:app_version.yml"],
            stderr=subprocess.DEVNULL,
        ).decode()
        old_version = read_version(old_raw)
    except (subprocess.CalledProcessError, KeyError):
        old_version = None

    is_release = old_version is not None and new_version != old_version

    outputs = {"is_release": "false", "version": "", "minor": "", "major": ""}

    if is_release:
        if not re.fullmatch(r"\d+\.\d+\.\d+", new_version):
            sys.exit(
                f"version '{new_version}' is not a strict X.Y.Z; "
                "pre-release suffixes are not allowed for releases."
            )
        major, minor, _ = new_version.split(".")
        outputs["is_release"] = "true"
        outputs["version"] = f"v{new_version}"
        outputs["minor"] = f"v{major}.{minor}"
        outputs["major"] = f"v{major}"
        print(f"Detected release: {old_version} -> {new_version}")
    else:
        print(f"No version bump (version={new_version}). Skipping release.")

    output_path = os.environ.get("GITHUB_OUTPUT")
    if output_path:
        with open(output_path, "a") as fh:
            fh.writelines(f"{key}={value}\n" for key, value in outputs.items())


if __name__ == "__main__":
    main()
