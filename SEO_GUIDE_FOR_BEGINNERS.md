
Submit to Google Search Console (15 minutes)

**What is Google Search Console?**
It's a FREE tool from Google that lets you:
- See if Google found your website
- See which pages are in Google search
- See what people search for to find you
- Get notified if there are problems

**How to do it:**

#### 2.1 Create a Google Account (if you don't have one)
- Go to https://accounts.google.com
- Sign up with your email

#### 2.2 Go to Google Search Console
- Visit: https://search.google.com/search-console
- Click "Start Now"
- Sign in with your Google account

#### 2.3 Add Your Website
1. Click "Add Property" (top left)
2. Choose "URL prefix" (not "Domain")
3. Enter your website URL: `https://ferros.menu` (or your actual domain)
4. Click "Continue"

#### 2.4 Verify Ownership
Google needs to prove you own the website. Choose the easiest method:

**Option A: HTML Tag (Easiest)**
1. Google will give you a code like: `<meta name="google-site-verification" content="abc123..." />`
2. Copy that code
3. Add it to `frontend/index.html` in the `<head>` section (after line 38)
4. Save the file
5. Deploy your website (if not already live)
6. Click "Verify" in Google Search Console

**Option B: HTML File Upload**
1. Google will give you a file to download
2. Upload it to your website's root folder (`frontend/public/`)
3. Click "Verify"

#### 2.5 Submit Your Sitemap
1. In Google Search Console, click "Sitemaps" in the left menu
2. In the "Add a new sitemap" box, type: `sitemap.xml`
3. Click "Submit"
4. Wait a few minutes, then refresh - you should see "Success"

**What this does:**
- Tells Google where to find all your pages
- Google will crawl them and add them to search results

---

### Step 3: Verify Sitemap Works (2 minutes)

**What to do:**
1. Open your web browser
2. Go to: `https://ferros.menu/sitemap.xml` (or your domain)
3. You should see an XML file with a list of URLs

**What you should see:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset>
  <url>
    <loc>https://ferros.menu/</loc>
    ...
  </url>
  <url>
    <loc>https://ferros.menu/pizza-place</loc>
    ...
  </url>
  ...
</urlset>
```

**If you see this:** ✅ It's working!
**If you see an error:** The sitemap might not be deployed yet, or there's a configuration issue.

---


### Step 5: Get Backlinks (Ongoing)

**What are backlinks?**
When other websites link to your website, it's called a "backlink". Google sees this as a vote of confidence - if other sites link to you, you must be good!

**How to get backlinks:**

#### 5.1 Share on Social Media
- Post about your service on Facebook, Instagram, LinkedIn
- Share restaurant menu pages
- When you share, include the link to your website

**Example posts:**
- "Check out our new QR menu system! https://ferros.menu"
- "Pizza Place just joined Ferros! See their menu: https://ferros.menu/pizza-place"

#### 5.2 List on Restaurant Directories
- Find local restaurant directories online
- Submit your service (and your restaurant clients) to these directories
- Examples:
  - TripAdvisor (for restaurants)
  - Yelp (for restaurants)
  - Local business directories
  - Restaurant technology directories

#### 5.3 Partner with Local Businesses
- Reach out to local business associations
- Partner with tourism boards
- Get featured in local business blogs or news sites

**Don't worry if you don't have many backlinks yet** - this takes time and happens naturally as you grow.

---

### Step 6: Monitor Performance (Weekly Check)

**What to do:**
1. Go to Google Search Console (you set this up in Step 2)
2. Check it once a week

**What to look for:**

#### 6.1 Coverage Report
- Click "Coverage" in the left menu
- See which pages Google has indexed
- Green = Good, Yellow = Warning, Red = Error
- Fix any errors you see

#### 6.2 Performance Report
- Click "Performance" in the left menu
- See:
  - How many people found you on Google
  - What they searched for
  - Which pages they clicked on
  - Your average position in search results

**What good looks like:**
- After 1-2 months: You should see some clicks
- After 3-6 months: You should see steady growth
- Position 1-10 = Great! Position 11-20 = Good. Position 20+ = Needs work

#### 6.3 Search Queries
- In Performance, scroll down to "Queries"
- See what people search for to find you
- Use this to improve your content

**Example:**
- If people search "QR menu Croatia" but you don't rank well, add more content about "QR menu Croatia"

