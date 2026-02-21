# Git Troubleshooting Guide

This document explains the errors we encountered while trying to push the final code to GitHub and exactly what steps we took to fix them.

## 1. The Error
When we first ran `git push -u origin main`, GitHub rejected the push entirely. 

The rejection message highlighted two specific "Repository Rule Violations":
1. **GH001: Large Files Detected**
   - GitHub has a strict 50 MB limit for standard file sizes.
   - We inadvertently included `earth-frontend/awscliv2.zip`, a giant 63 MB file from when we installed the AWS CLI.
2. **GH013: Push Cannot Contain Secrets**
   - GitHub has an automated security scanner that blocks pushes if it detects passwords, API keys, or tokens in the code.
   - It detected a hardcoded **GitHub Personal Access Token** living inside an old file named `script.py`. 

---

## 2. Why We Fixed It This Way
To bypass these strict GitHub protections, we essentially had to "rewind time" using Git, violently erase the offending content from the git history, and then rewrite the commit.

Here is the breakdown of the exact sequence we used and why:

### Step A: Remove the Secret (`script.py`)
We went into `script.py` and deleted the line containing the GitHub token (`ghp_MvG...`). 

### Step B: Un-track the Large Files (`git rm --cached`)
Even though the `awscliv2.zip` file was inside your project folder, we didn't want Git to upload it to the internet.
```bash
git rm -r --cached earth-frontend/awscliv2.zip earth-frontend/aws/
```
- We used `--cached` instead of standard `rm`. This tells Git to stop tracking the file for versions/uploads, but leaves the actual physical file safely intact on your laptop's hard drive.

### Step C: Ignore Them Permanently
We added those offending files to our hidden `.gitignore` file.
This guarantees that if you ever type `git add .` again in the future, Git will blind itself to the `awscliv2.zip` and the `aws/` folder, preventing this error from ever happening again.

### Step D: Rewrite the Git History (`git commit --amend`)
```bash
git add script.py .gitignore
git commit --amend --no-edit
```
Normally, a commit locks a snapshot in time. We couldn't just make a *new* commit deleting the files, because Git would still try to upload the previous commit that *did* have the large files.
Instead, we used `--amend` to quietly re-open our *last* commit, swap the giant files for the clean ones, and bundle it back up without leaving a trace. 

### Step E: Force Push (`git push -f`)
Because we fundamentally altered the Git history of `main` by amending the commit, our local repository history no longer perfectly matched what GitHub remembered from any previous partial uploads. 
By adding the `-f` (force) flag, we definitively overwrite whatever GitHub had, forcing it to accept our brand-new, clean snapshot. 

---

## Learnings
1. Never put `.zip`, `.mp4`, or large database dumps into your Git repository.
2. Never hardcode passwords or tokens into scripts. Always use `.env` files and add `.env` to your `.gitignore`!
