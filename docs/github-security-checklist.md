# PARVAAH GitHub Security & Secret Protection Checklist

Use this security audit checklist before executing any `git push` to public or shared GitHub repositories.

---

## Pre-Publish Verification Checklist

- [ ] **No Real API Keys**: Confirm no production IMD, Mapbox, Bhuvan, Twilio, or Google Gemini keys exist in tracked code.
- [ ] **No MongoDB Connection Strings**: Confirm `MONGODB_URI` containing real Atlas cluster credentials or passwords is not present in tracked files.
- [ ] **No Cloud Storage Credentials**: Confirm AWS S3 access/secret keys or Cloudinary secrets are removed.
- [ ] **No Unrestricted Citizen Data**: Ensure user phone numbers, full addresses, or private citizen PII are scrubbed.
- [ ] **No Photo/Video Binaries**: Confirm `uploads/`, `media/`, `storage/`, and `public/uploads/` are excluded by `.gitignore`.
- [ ] **No Private ML Artifacts or Datasets**: Confirm `.pkl`, `.joblib`, `.json` models, raw training CSVs, and internal reports are ignored.
- [ ] **No Log Files or Local Database Dumps**: Confirm `*.log`, `logs/`, `dump/`, `backups/`, `*.db`, and `*.sqlite` are ignored.
- [ ] **`.env.local` Excluded**: Confirm `.env` and `.env.local` are untracked by `git status`.
- [ ] **Sanitized `.env.example`**: Confirm `.env.example` contains variable names only with zero actual secret values.

---

## Verification Commands

Execute the following commands before staging or pushing:

```bash
# 1. Check tracked files status
git status

# 2. Inspect staged files before committing
git diff --staged

# 3. Audit repository for potential secret strings (API keys, URIs)
git grep -i "mongodb+srv://"
git grep -i "AKIA"
git grep -i "secret"
```

---

## Safe Secret Remediation Guidance

> [!WARNING]
> If a secret or private key was accidentally committed to Git history in a prior commit:
> 1. **Do not run automated destructive history rewrites (`git filter-branch` / `BFG`) without user confirmation.**
> 2. Immediately **rotate/revoke** the leaked secret in the provider console (e.g. MongoDB Atlas, AWS IAM, IMD Portal).
> 3. Remove the secret from current HEAD using a standard commit and update `.gitignore`.
> 4. If history cleansing is required, request explicit user authorization before rewriting remote branch refs.
