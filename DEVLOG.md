## Deployment Issue — May 19, 2026

**Problem:** Vercel serving root index.html instead of React app
**Root cause:** Monorepo structure with static site at root and React in /frontend
**Solution:** Moved vercel.json into frontend/ directory per Vercel's requirement
**Lesson:** In monorepos, vercel.json must live in the root directory Vercel is configured to use
