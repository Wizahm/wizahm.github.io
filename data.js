/*
  ALL SITE CONTENT LIVES HERE.
  - To add a project / role: copy an item block inside the right category and change the text.
  - `theme` picks the colour mood when that node is opened (see THEMES in app.js).
  - `links` creates the faint dashed threads between related nodes (use node ids).
  - Keep company figures, client names and teammate names OUT of this file.
*/

window.SITE = {
  person: {
    name: "Wisam Abu Al Neel",
    initials: "WA",
    tagline: "Recent graduate, MSc Entrepreneurship & Innovation, Trinity College Dublin",
    intro:
      "Sales, business development and consulting. I've worked and studied in Jordan, Germany and Ireland, and I speak Arabic, English and German.",
    location: "Dublin · Available immediately · Stamp 1G",
    // Landing intro shown before the web fades in
    splash: {
      hello: "Hi, I'm Wisam.",
      lead: "Recent Trinity College Dublin graduate · MSc Entrepreneurship & Innovation (2,1)",
      lines: [
        "I open conversations, understand what people need and turn it into a clear, practical plan.",
        "In outbound sales in Amman, I averaged 400 outbound calls a day with a 28% conversion rate on cold outreach.",
        "In Jordan, I assessed whether five companies' products were ready for export and designed the scoring framework my firm adopted. In Dublin, I built a funding strategy for a family resource centre and designed ventures for international students and energy-poor households."
      ]
    },
    // Contact details are assembled in app.js so simple scrapers can't harvest them.
    contact: {
      linkedin: "https://www.linkedin.com/in/wisam-abu-al-neel",
      emailUser: "wisamabualneel",
      emailDomain: "gmail.com",
      phoneParts: ["+353", "83", "027", "6669"]
    }
  },

  categories: [
    /* ───────────────────────── ABOUT ───────────────────────── */
    {
      id: "about",
      label: "About me",
      theme: "gold",
      shape: "hexagon",
      summary:
        "A recent Trinity graduate with an international background, a business-family upbringing and a habit of taking ownership early.",
      items: [
        {
          id: "story",
          label: "Background",
          theme: "gold",
          title: "Roots across borders",
          meta: "Amman → Magdeburg → Berlin → Dublin",
          body: [
            "I grew up in Amman, Jordan, in a family of Palestinian heritage. My family name, Abu Al Neel, means \"Father of the Nile\".",
            "My family runs a consulting firm, Medal Consulting, where I later worked. Seeing how deals are negotiated and client relationships are built gave me an early, practical feel for business. I was used to taking initiative and owning work end to end long before my first formal role.",
            "My degree in German and English for Business took me to Germany for an exchange semester and two internships. I then came to Dublin for my Master's at Trinity College. Working and studying in three countries taught me to adapt quickly and to communicate across cultures."
          ],
          tags: ["Jordan", "Germany", "Ireland", "Arabic · English · German"],
          links: ["gju", "magdeburg", "s-lang"]
        },
        {
          id: "drive",
          label: "How I work",
          theme: "gold",
          title: "Structured, curious, people-first",
          meta: "Strengths",
          body: [
            "I start from what people actually need, then use structured frameworks to turn it into a clear plan. That works whether the client is an exporter in Amman or a family resource centre in Dublin."
          ],
          bullets: [
            "Creativity and initiative: I look for solutions where others haven't seen a problem.",
            "Persistence: I follow through, especially when resources are limited.",
            "Empathy: interviews and stakeholder conversations are where my best insights come from.",
            "Sustainable performance: I plan my energy as well as my time, so I stay effective under pressure."
          ],
          tags: ["Creativity", "Initiative", "Persistence", "Empathy"],
          links: ["s-strategy", "s-research"]
        },
        {
          id: "next",
          label: "What I'm looking for",
          theme: "gold",
          title: "Ready to start",
          meta: "Dublin · Available immediately · Stamp 1G",
          body: [
            "I'm a recent graduate of Trinity College Dublin's MSc in Entrepreneurship & Innovation. I'm looking for roles in sales and business development (SDR, BDR or account roles), strategy and consulting, or in Ireland's startup and innovation ecosystem.",
            "Longer term, I want to build a venture around an idea that improves how people live and gives back to the community."
          ],
          tags: ["Sales", "Business development", "Consulting", "Strategy", "Innovation"],
          links: ["tcd"]
        }
        ,{
          id: "interests",
          label: "Beyond work",
          theme: "gold",
          title: "Beyond work",
          meta: "Interests",
          bullets: [
            "Team sports: volleyball and football.",
            "Archery: a sport that rewards focus, patience and consistency.",
            "Building with AI: I create small apps and websites with AI coding tools, including this one."
          ],
          tags: ["Volleyball", "Football", "Archery", "AI tools"],
          links: ["s-tools"]
        }
      ]
    },

    /* ───────────────────────── EDUCATION ───────────────────────── */
    {
      id: "education",
      label: "Education",
      theme: "emerald",
      shape: "diamond",
      summary: "Three countries, three languages, one thread: business across cultures.",
      items: [
        {
          id: "tcd",
          label: "Trinity College Dublin",
          theme: "emerald",
          title: "MSc Entrepreneurship & Innovation",
          meta: "Trinity College Dublin · Sep 2025 – Jun 2026 · Recent graduate",
          bullets: [
            "Awarded Second Class Honours, Grade 1 (2,1).",
            "Capstone consulting project with a real client, graded 75%.",
            "Modules: Business Model Innovation, Design Thinking & Agile, Digital Entrepreneurship & Scaling, Strategic, International, Social and Financial Entrepreneurship, Corporate Innovation, New Venture Creation.",
            "Pitched ventures and strategies to panels throughout the year."
          ],
          tags: ["Pitching", "Venture design", "Strategy"],
          links: ["rosemount", "gradguides", "dealio", "energy", "steeple"]
        },
        {
          id: "gju",
          label: "German Jordanian University",
          theme: "emerald",
          title: "B.A. German & English for Business and Communication",
          meta: "German Jordanian University · 2017 – 2022",
          bullets: [
            "Thesis: \"The Reliance on Technology During the COVID-19 Pandemic and Its Impact on the Service Sector in Jordan\"."
          ],
          tags: ["Business communication", "German", "Research"],
          links: ["magdeburg"]
        },
        {
          id: "magdeburg",
          label: "Exchange in Germany",
          theme: "emerald",
          title: "Exchange year",
          meta: "Magdeburg-Stendal University of Applied Sciences · Apr – Sep 2021",
          bullets: ["One semester of study, then one semester interning in Germany."],
          links: ["dvag", "ssip"]
        },
        {
          id: "certs",
          label: "Certifications",
          theme: "emerald",
          title: "Certifications",
          meta: "Yale · ITC Academy",
          bullets: [
            "Setting up an Export Marketing Strategy, ITC Academy (Oct 2024)",
            "Considering Export Markets, ITC Academy (Oct 2024)",
            "Introduction to Psychology, Yale University (Jun 2020)"
          ],
          links: ["medal"]
        }
      ]
    },

    /* ───────────────────────── EXPERIENCE ───────────────────────── */
    {
      id: "experience",
      label: "Experience",
      theme: "lapis",
      shape: "octagon",
      summary:
        "Consulting, sales and talent roles in Jordan and Germany.",
      items: [
        {
          id: "medal",
          label: "Medal Consulting",
          theme: "lapis",
          title: "Export Project Officer",
          meta: "Medal Consulting · Amman, Jordan · May 2023 – Sep 2025",
          body: [
            "I tested whether local products could realistically be exported to the markets their owners were targeting. I combined International Trade Centre diagnostic tools with field research."
          ],
          bullets: [
            "Delivered export-readiness assessments for five companies within a single project, including a women-led food-security initiative.",
            "Designed a scoring framework and a standard assessment template. Management adopted them as the basis for an online self-assessment tool.",
            "Acted as the main point of contact for every company: communications, logistics and scoping solutions.",
            "Helped secure an exclusive retainer agreement with one of the five companies, making Medal its sole marketing and consulting partner for its UK expansion.",
            "Ran the company's own digital marketing in-house: set up and supervised Google Ads, Meta and Instagram accounts run by an agency partner, and checked results against Google Analytics.",
            "Led on-page SEO for the company website (keyword research, content optimisation and technical fixes)."
          ],
          tags: ["Export readiness", "ITC diagnostic tools", "Framework design", "Client management", "Google Ads", "SEO"],
          links: ["s-strategy", "s-digital", "certs"]
        },
        {
          id: "blackoasis",
          label: "Black Oasis",
          theme: "lapis",
          title: "Customer Service Representative",
          meta: "Black Oasis · Amman, Jordan · Jul 2022 – Feb 2023",
          body: [
            "A fast-paced outbound business-to-consumer sales role. I handled cold outreach, follow-ups with VIP clients and a full daily cycle of calls on my own."
          ],
          bullets: [
            "Reached a 28% conversion rate on cold outreach while averaging 400 calls a day.",
            "Ranked among the top performers in the team's sales competitions."
          ],
          tags: ["Outbound sales", "Cold calling", "B2C", "Client follow-up"],
          links: ["s-sales"]
        },
        {
          id: "avertra",
          label: "Avertra Corp.",
          theme: "lapis",
          title: "Junior Talent Specialist (contract)",
          meta: "Avertra Corp. · Amman, Jordan · Mar – May 2023",
          bullets: [
            "Interviewed 7 candidates a day in 30-minute interviews, each followed by 30 minutes of documentation.",
            "Sourced candidates through LinkedIn for QA, SAP, Talent Acquisition and Product Owner roles, in Jordan and remotely.",
            "Managed candidates in Zoho Recruit, an applicant tracking system."
          ],
          tags: ["Recruitment", "Zoho Recruit", "Interviewing"],
          links: ["aiesec"]
        },
        {
          id: "ssip",
          label: "SSIP Berlin",
          theme: "lapis",
          title: "Intern Writer",
          meta: "SSIP · Berlin, Germany · Oct 2021 – Feb 2022",
          bullets: [
            "Wrote German-language articles and a research paper on civil society in Jordan, working with a university professor and SSIP's co-founder."
          ],
          tags: ["German", "Research", "Cross-cultural writing"],
          links: ["gju", "s-lang"]
        },
        {
          id: "dvag",
          label: "DVAG",
          theme: "lapis",
          title: "Junior Financial Consultant",
          meta: "DVAG · Magdeburg, Germany · Sep – Nov 2021",
          bullets: [
            "Took part in a client-acquisition sales team's meetings on financial-planning consultations for international students and new residents."
          ],
          tags: ["Client acquisition", "Financial planning"],
          links: ["s-sales"]
        },
        {
          id: "aiesec",
          label: "AIESEC",
          theme: "lapis",
          title: "Talent Manager & Sales Officer",
          meta: "AIESEC · Amman, Jordan · Oct 2019 – Feb 2020",
          bullets: [
            "Ran recruitment from start to finish: interviews, team allocation, mediation and offboarding. Also analysed how team leaders organised their work.",
            "Made 40 cold calls a day and worked a bi-weekly outreach quota, checking every lead against company records and government registries before contacting them.",
            "Spotted that the lead pool was out of date and raised it with leadership, which led them to review how the team sourced leads."
          ],
          tags: ["Business development", "Talent management", "Data quality"],
          links: ["s-sales"]
        }
      ]
    },

    /* ───────────────────────── PROJECTS ───────────────────────── */
    {
      id: "projects",
      label: "Projects",
      theme: "coral",
      shape: "square",
      summary:
        "My MSc capstone with a real client, plus ventures and analyses from my coursework. All were team projects except the Steeple valuation.",
      items: [
        {
          id: "rosemount",
          label: "Rosemount capstone",
          theme: "coral",
          title: "Capstone consulting project: funding strategy",
          meta: "MSc capstone (part of my Master's) · Rosemount Family Resource Centre, Dundrum · May – Jul 2026",
          body: [
            "For my MSc capstone I worked with a family support organisation funded by Tusla, the Irish state's child and family agency. I built a multi-year funding strategy from its stakeholders' needs and its own data."
          ],
          bullets: [
            "Benchmarked the organisation against similar family resource centres.",
            "Consulted the organisation's leadership so the strategy matched how services are really delivered and aligned with Ireland's National Drugs Strategy 2026–2029.",
            "Built the case using Porter's Five Forces, PESTEL and Hofstede.",
            "Capstone graded 75%."
          ],
          tags: ["Funding strategy", "Stakeholder consultation", "Benchmarking", "Porter's Five Forces", "PESTEL", "Hofstede"],
          links: ["tcd", "s-strategy", "energy"]
        },
        {
          id: "gradguides",
          label: "Grad Guides",
          theme: "coral",
          title: "Grad Guides: alumni mentors for international students",
          meta: "Digital Entrepreneurship & Scaling · team of four",
          body: [
            "Our interviews showed that international students don't mainly struggle emotionally. They struggle with information: visa categories, work eligibility and graduate hiring cycles. The help they get is friendly but unstructured, and often comes too late.",
            "Grad Guides is a mobile app that matches students with verified alumni mentors, combined with trusted resources on academics, visas and jobs, plus a community space."
          ],
          bullets: [
            "My role: defined the must-have and nice-to-have features, co-built the prototype, mapped the user journey and ran the prototype feedback round with students and alumni.",
            "Process: \"How might we\" questions, then brain-writing, a persona, interviews, a wireframe, a prototype and user testing.",
            "Growth plan: a campus ambassador programme, a 24-hour first match, SEO content on LinkedIn and Rednote, then licensing to other universities as a business-to-business product."
          ],
          tags: ["Design thinking", "Prototyping", "User research", "AARRR growth", "B2B2C"],
          links: ["tcd", "s-digital", "dealio"]
        },
        {
          id: "dealio",
          label: "Dealio",
          theme: "coral",
          title: "Dealio: verified student deals, made by international students",
          meta: "International Entrepreneurship · team project + my own entry-strategy report",
          body: [
            "Students told us that discount apps feel cluttered, unreliable and full of irrelevant offers, so they ignore them. Dealio shows only verified, student-relevant food and online-shopping deals, with expiry dates and clear instructions on how to claim each one."
          ],
          bullets: [
            "Macro analysis with STEEPLE, plus a market-sizing model (total, serviceable and obtainable market) built from public education and digital-use statistics.",
            "Competitor teardown of global student-discount platforms and food-delivery apps. Our edge is local partnerships with Irish businesses, which large global players have little reason to pursue.",
            "In my individual report I compared two market-entry strategies: a trust-first local launch (Freshers' Week, ambassadors, student-union backing) and a phased digital launch (MVP, then a closed beta at TCD, then a Dublin-wide rollout) using the Lean Startup build-measure-learn loop.",
            "Tested the strategy with Porter's Five Forces and Hofstede's cultural dimensions."
          ],
          tags: ["Market entry", "STEEPLE", "TAM / SAM / SOM", "Porter's Five Forces", "Hofstede", "Lean Startup"],
          links: ["gradguides", "s-strategy", "blackoasis"]
        },
        {
          id: "energy",
          label: "Fair Energy Navigator",
          theme: "coral",
          title: "Fair Energy Navigator: no household left behind",
          meta: "Social & Sustainable Entrepreneurship · team pitch to a mock investment committee",
          body: [
            "Ireland funds home energy retrofits, but the households who need them most rarely get them. Many low-income households don't know the grants exist, the schemes overlap and contradict each other, and waiting lists run to years. The problem isn't motivation; it's navigation.",
            "Our venture is a navigation service. A household enters its Eircode and answers a few questions, sees which schemes it qualifies for, follows a guided application path, and gets low-cost energy-saving actions to take while it waits. When someone gets stuck, a trained community navigator steps in."
          ],
          bullets: [
            "My part: the revenue and funding model, and the scaling plan.",
            "Funding moves from a grant-funded pilot, to a mix of grants and early outcome contracts, to social outcome contracts in which public bodies pay per household helped, with a social impact bond as a longer-term option.",
            "We deliberately ruled out charging households and taking contractor commissions, both of which would conflict with the mission.",
            "Scaling works through a hub-and-spoke model: a small central team runs the platform, training and data, while local partners (local authorities, housing bodies, family resource centres) handle outreach and trust."
          ],
          tags: ["Social enterprise", "Theory of Change", "Outcome contracts", "Scaling", "Funding mix"],
          links: ["rosemount", "s-strategy"]
        },
        {
          id: "steeple",
          label: "Steeple Group valuation",
          theme: "coral",
          title: "Steeple Group: financially strong, commercially under-accelerated",
          meta: "Financing Entrepreneurship · individual analysis",
          body: [
            "I valued a private UK wholesaler of furniture, carpets and lighting, then recommended how it should fund its next phase of growth. (I've left out the company's figures here; this explains the method and the conclusions.)"
          ],
          bullets: [
            "Ratio analysis: margins held up and liquidity was very strong with almost no debt, but revenue and asset efficiency were slipping. So my diagnosis was \"resilient but under-accelerated\", not \"in trouble\".",
            "Working capital: traced how long cash was tied up in stock, which pointed to clear gains from tighter inventory management.",
            "Valuation: compared five methods (earnings multiple, EV/EBITDA, revenue multiple, a discounted cash flow model before and after the business plan, and book value), then settled on a range instead of a single figure, with the cash flow model as the central case.",
            "Financing recommendation: mainly the company's own cash plus a modest revolving credit facility, with no outside equity. The point was to fund focused growth in markets the company already knows, not to diversify."
          ],
          tags: ["Ratio analysis", "DCF", "Valuation multiples", "Working capital", "Sources of finance"],
          links: ["s-strategy", "dvag"]
        }
      ]
    },

    /* ───────────────────────── SKILLS ───────────────────────── */
    {
      id: "skills",
      label: "Skills",
      theme: "violet",
      shape: "pentagon",
      summary: "What I bring to a team, and where each skill was earned.",
      items: [
        {
          id: "s-strategy",
          label: "Strategy & analysis",
          theme: "violet",
          title: "Strategy & framework-driven analysis",
          bullets: [
            "Porter's Five Forces, PESTEL / STEEPLE, Hofstede, Business Model Canvas, Theory of Change.",
            "Funding and business cases, valuation and ratio analysis.",
            "Export-readiness diagnostics and scoring frameworks."
          ],
          links: ["medal", "rosemount", "dealio", "steeple", "energy"]
        },
        {
          id: "s-digital",
          label: "Digital marketing",
          theme: "violet",
          title: "Digital marketing & growth",
          bullets: [
            "Google Ads, Meta and Instagram ad accounts, on-page SEO, Google Analytics.",
            "Growth frameworks (AARRR), A/B testing plans, content-led acquisition."
          ],
          links: ["medal", "gradguides"]
        },
        {
          id: "s-sales",
          label: "Sales & clients",
          theme: "violet",
          title: "Sales & client relationships",
          bullets: [
            "Outbound prospecting and cold calling: up to 400 calls a day, with a 28% conversion rate on cold outreach.",
            "Consultative selling, lead qualification and managing a client portfolio.",
            "Stakeholder management with senior decision-makers."
          ],
          links: ["blackoasis", "dvag", "aiesec", "medal"]
        },
        {
          id: "s-research",
          label: "Research & communication",
          theme: "violet",
          title: "Research, presenting & communication",
          bullets: [
            "Market research, customer interviews, surveys and user testing.",
            "Business writing and research reports, in English and German.",
            "Pitching and presenting to panels and stakeholders.",
            "Cross-cultural communication and teamwork."
          ],
          links: ["gradguides", "dealio", "ssip", "rosemount"]
        },
        {
          id: "s-tools",
          label: "Tools",
          theme: "violet",
          title: "Tools I use",
          bullets: [
            "Microsoft Excel: financial modelling, ratio analysis and tracking.",
            "Google Ads, Meta Ads Manager, Google Analytics.",
            "Zoho Recruit (applicant tracking), candidate sourcing on LinkedIn.",
            "Lucidspark for user journeys; Business Model Canvas."
          ],
          links: ["steeple", "medal", "avertra"]
        },
        {
          id: "s-lang",
          label: "Languages",
          theme: "violet",
          title: "Languages",
          bullets: ["Arabic (native)", "English (fluent)", "German (conversational)"],
          links: ["ssip", "gju"]
        }
      ]
    }
  ],

  // Topics offered in the "Ask me about" form. Picks are counted in Umami.
  askTopics: [
    "Export readiness / MENA markets",
    "Funding strategy for non-profits",
    "Digital marketing & SEO",
    "Market entry strategy",
    "Startup valuation",
    "Working with me"
  ]
};

/*
  PHOTOS: one general stock photo per subtopic, free under the Unsplash License
  (https://unsplash.com/license). Each is credited in the panel. To change one, find a photo
  on unsplash.com and paste its image id ("photo-...") as src, the photographer's username as user,
  and the photo's page slug as page.
*/
window.SITE.photos = {
  story:        { src: "photo-1614772067419-1452cf9aeaa3", user: "hisham_zayadneh", page: "white-and-brown-concrete-buildings-during-daytime-cKdPnDMmpH8", alt: "Hillside buildings in Amman, Jordan" },
  drive:        { src: "photo-1504607798333-52a30db54a5d", user: "codzilla_swiss", page: "shallow-focus-photograph-of-black-and-gray-compass-uCMKx2H1Y38", alt: "A compass" },
  next:         { src: "photo-1772620461831-7c14a2a1f50e", user: "asantoro90", page: "modern-bridge-over-a-wide-river-in-a-city-MqJosbD2PEw", alt: "A modern bridge over a river in a city" },
  interests:    { src: "photo-1776847651583-1d804b5cc339", user: "gabigi", page: "archery-targets-with-arrows-in-the-bullseye-DXGtmrGmmJI", alt: "Archery targets with arrows in the bullseye" },
  tcd:          { src: "photo-1530608031805-8e170c1b793a", user: "jbsinger1970", page: "library-interioe-NgU7IJ5XuyY", alt: "A grand library interior" },
  gju:          { src: "photo-1758270704262-ecc82b23dc37", user: "silverkblack", page: "professor-lectures-to-students-in-a-classroom-setting-RDf6Cvns88Q", alt: "A lecture in a classroom" },
  magdeburg:    { src: "photo-1580419968835-409eec5e6143", user: "sauer", page: "brown-concrete-building-near-body-of-water-during-daytime-4-yrDy-2PMQ", alt: "Magdeburg by the river" },
  certs:        { src: "photo-1638636241638-aef5120c5153", user: "heyquilia", page: "a-framed-diploma-with-a-gold-seal-on-it-lJvU6RQno0g", alt: "A framed certificate with a gold seal" },
  medal:        { src: "photo-1605732562742-3023a888e56e", user: "aronyigin", page: "stacked-orange-shipping-containers-sNY6B9NsPP8", alt: "Stacked shipping containers" },
  blackoasis:   { src: "photo-1553775282-20af80779df7", user: "machec", page: "black-and-brown-headset-near-laptop-computer-BeVGrXEktIk", alt: "A headset beside a laptop" },
  avertra:      { src: "photo-1686771416282-3888ddaf249b", user: "miinrad", page: "a-man-and-a-woman-shaking-hands-in-front-of-a-laptop-qFSQFSmfZkA", alt: "A handshake at an interview" },
  ssip:         { src: "photo-1587330979470-3595ac045ab0", user: "florianwehde", page: "brandenburg-gate-at-night-in-berlin-uFGi0_YciE0", alt: "The Brandenburg Gate in Berlin at night" },
  dvag:         { src: "photo-1772588627373-729b0f47e5bb", user: "kellysikkema", page: "person-reviewing-documents-with-calculator-and-laptop-tLqtcDZltPs", alt: "Reviewing financial documents with a calculator" },
  aiesec:       { src: "photo-1542323228-002ac256e7b8", user: "camylla93", page: "people-with-hands-gathered-in-the-middle-ABVE1cyT7hk", alt: "A team with hands gathered in the middle" },
  rosemount:    { src: "photo-1529180979161-06b8b6d6f2be", user: "mscheid", page: "family-in-silhouette-against-orange-sky-0iqkntLw93A", alt: "A family holding hands at sunset" },
  gradguides:   { src: "photo-1761781342506-30f68c930a16", user: "ethan_gowans", page: "graduation-ceremony-with-students-in-blue-caps-and-gowns-NXnX56qv2c0", alt: "Students at a graduation ceremony" },
  dealio:       { src: "photo-1753351057311-8fd3c46bc4e2", user: "silverkblack", page: "friends-are-sharing-pizza-and-conversation-at-a-restaurant-Isbx9diUnhU", alt: "Friends sharing pizza" },
  energy:       { src: "photo-1607400201889-565b1ee75f8e", user: "introspectivedsgn", page: "person-installing-wiring-in-wall-insulation-aCshJn3y93s", alt: "Insulation being fitted in a wall" },
  steeple:      { src: "photo-1760611656148-063d3b9a8dbc", user: "davidkristianto", page: "various-chairs-displayed-in-a-showroom-setting-rItWuQHaOpM", alt: "Chairs in a furniture showroom" },
  "s-strategy": { src: "photo-1528819622765-d6bcf132f793", user: "felix_mittermeier", page: "chess-pieces-on-board-nAjil1z3eLk", alt: "Chess pieces on a board" },
  "s-digital":  { src: "photo-1666875753105-c63a6f3bdc86", user: "dengxiangs", page: "graphical-user-interface--WXQm_NTK0U", alt: "An analytics dashboard" },
  "s-sales":    { src: "photo-1758519288905-38b7b00c1023", user: "silverkblack", page: "two-businessmen-shaking-hands-across-a-table-lZXX-QVdyXY", alt: "A handshake across a table" },
  "s-research": { src: "photo-1488190211105-8b0e65b80b4e", user: "thoughtcatalog", page: "person-holding-ballpoint-pen-writing-on-notebook-505eectW54k", alt: "Writing notes in a notebook" },
  "s-tools":    { src: "photo-1766074903100-bc435aa4c60d", user: "wolfart32", page: "laptop-screen-showing-a-video-conference-and-spreadsheet-5FRDoTNMvfI", alt: "A spreadsheet on a laptop" },
  "s-lang":     { src: "photo-1543165796-5426273eaab3", user: "waldemarbrandt67w", page: "open-dictionary-U3Ptj3jafX8", alt: "An open dictionary" }
};

/*
  FUN FACTS: sparkling stars appear in the web while people read (one every 2 minutes).
  Clicking a star shows one of these. Add, remove or reorder freely (the web has room for 5).
*/
window.SITE.funFacts = [
  {
    title: "Cup of Positivity",
    text: "I graduated school with the IB Diploma and the Cup of Positivity award. Proof that optimism can be measured, or at least engraved."
  },
  {
    title: "Composer, briefly",
    text: "I taught myself enough piano to write an original piece of my own. The piano is on pause; the urge to make music never left."
  },
  {
    title: "One constant on any map",
    text: "Amman, Dublin or anywhere in between, I'll find the Italian place. Lasagna, pasta or tiramisu, it's the one cuisine I never get tired of."
  },
  {
    title: "An early passport",
    text: "Before I was a teenager I'd already been to Vienna, Bulgaria, Madrid and Barcelona, plus closer to home in Syria and Lebanon. That's where my habit of comparing how different places work started."
  },
  {
    title: "My rabbit hole",
    text: "I spend a lot of time on how AI is reshaping creative industries: the line between \"AI slop\" and AI that closes skill gaps without pushing artists out. I'm firmly on the side of the second."
  }
];
