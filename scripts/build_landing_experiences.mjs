import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const VERIFIED = 'Information and public project details checked 17 August 2026. Prices, payment plans, availability, completion targets, regulations and visa criteria can change. Request dated unit-level documents before relying on them. General information only—not legal, tax, financial or investment advice.';
const PHONE = '+971 52 842 0933';
const WA = 'https://wa.me/971528420933';

const pages = [
  {
    slug: 'emaar', theme: 'emaar', host: 'emaar.jamesrealty.uk', lang: 'en-AE', layout: 'split',
    title: 'Emaar Properties Dubai | Latest Projects & Investment',
    description: 'Compare current Emaar projects, verified starting prices and Dubai communities with independent unit-level guidance from James Realty.',
    image: 'emaar-dubai-waterfront-investment.webp',
    imageAlt: 'Contemporary Emaar-style waterfront residences in a premium Dubai master community at dusk',
    kicker: 'Independent Emaar project advisory',
    h1: 'The Emaar address, selected with discipline.',
    heroText: 'A calm, evidence-led shortlist of current Emaar releases—built around location, unit quality, payment timing and your exit or occupancy plan.',
    heroProof: ['Current launch check', 'Official price evidence', 'Unit-level comparison'],
    primary: 'Request current prices', secondary: 'Compare latest projects',
    nav: [['New releases','projects'],['Communities','locations'],['Investor lens','why-invest'],['Enquire','enquire']],
    bar: [['Golf Fields','Emaar South'],['Golf Vale','Emaar South'],['Fior 1','Rashid Yachts & Marina'],['Independent','James Realty advice']],
    projectsTitle: 'Three current releases. Three different investment cases.',
    projectsIntro: 'Emaar’s official latest-launch list changes frequently. These releases were visible on the developer’s official website when checked; live units and schedules are reconfirmed before recommendation.',
    projects: [
      {meta:'Latest release · Dubai Creek Harbour',name:'Valia',desc:'One- to four-bedroom apartments in a waterfront master community, positioned near the canal, park and planned Blue Line connectivity.',facts:['1–4 bedroom apartments','Premium finishes','Creek, skyline or park outlooks'],price:'From AED 1.96m',priceNote:'Official starting price',source:'https://www.emaar.com/en/properties/valia-at-dubai-creek-harbour'},
      {meta:'Golf-side · Emaar South',name:'Golf Trails',desc:'Mid-rise apartments and three-bedroom townhouses beside the 18-hole golf course, with access to Dubai South’s developing growth corridor.',facts:['1–3 bedroom apartments','3 bedroom townhouses','Golf-course setting'],price:'From AED 1.25m',priceNote:'Official starting price',source:'https://www.emaar.com/en/properties/golf-trails-at-emaar-south'},
      {meta:'Marina living · Rashid Yachts & Marina',name:'Fior 1',desc:'A current Emaar launch for buyers comparing marina lifestyle, central-waterfront positioning and apartment-led ownership.',facts:['Current official launch','Marina masterplan','Price on verified request'],price:'Request live sheet',priceNote:'Inventory changes by release',source:'https://www.emaar.com/en/properties/fior-1-at-rashid-yachts-and-marina'},
    ],
    lensTitle:'What the brochure cannot decide for you.',
    lensText:'The developer name is one part of the decision. James Realty compares the exact stack, view, floor plan, construction-linked cash flow, service charges, competing supply and realistic rental or resale audience.',
    lenses:[['Community maturity','Established demand behaves differently from an emerging growth corridor.'],['Unit efficiency','Saleable area, usable space and view premium must be compared together.'],['Payment timing','Percentages matter less than the dated instalment schedule and your currency plan.'],['Exit depth','Test future competing stock and the likely buyer pool for the same unit type.']],
    asides:[['No hype','Returns are never presented as guaranteed.'],['Live evidence','Availability is checked before advice.']],
    routeTitle:'Choose the community before the tower.',
    routeText:'Downtown and Dubai Hills offer established recognition; Dubai Creek Harbour, Emaar South and Rashid Yachts & Marina have different infrastructure, supply and tenant profiles.',
    route:[['Dubai Creek Harbour','Waterfront apartments and a growing mixed-use destination.'],['Emaar South','Golf and family living within the Dubai South corridor.'],['Rashid Yachts & Marina','Marina-led apartments closer to historic central Dubai.']],
    journeyTitle:'From launch list to exact unit',
    journey:[['01','Define','Budget, use, time horizon and acceptable downside.'],['02','Compare','Community, layout, cash flow and relevant alternatives.'],['03','Verify','Dated price sheet, payment plan and reservation documents.'],['04','Decide','Proceed only when the unit fits the investment brief.']],
    formTitle:'Receive an Emaar shortlist—not a project dump.', formText:'Share the budget, property type and intended holding strategy. James will return current Emaar options with the key trade-offs visible.', formIntro:'Hello James, I would like a current Emaar project shortlist.',
    faq:[['Which Emaar releases are highlighted here?','Golf Fields, Golf Vale and Fior 1 were listed by Emaar when checked on 17 August 2026. The launch list and inventory change, so availability is reconfirmed when you enquire.'],['What is the lowest verified entry price shown here?','Golf Vale publishes an official starting price of AED 1.09 million. A starting figure does not confirm an available unit or the total acquisition cost.'],['Can an overseas buyer purchase Emaar property?','Foreign buyers may own eligible property in designated Dubai freehold areas, subject to the exact project, identity checks and registration process.'],['Are payment plans guaranteed?','No. Plans can vary by project, release and unit. Request the dated schedule for the exact unit before reserving.'],['Is Emaar property guaranteed to appreciate?','No property return is guaranteed. Compare price, total costs, future supply, demand evidence and a downside scenario.']],
    sources:[['Emaar latest launches','https://www.emaar.com/en'],['Dubai buying costs guide','https://jamesrealty.uk/dubai-property-buying-costs/'],['Off-plan vs ready guide','https://jamesrealty.uk/off-plan-vs-ready-property-dubai/']],
  },
  {
    slug:'aldar',theme:'aldar',host:'aldar.jamesrealty.uk',lang:'en-AE',layout:'framed',
    title:'Aldar Properties | Abu Dhabi & Dubai Projects 2026',description:'Compare current Aldar launches across Saadiyat, Yas Island and Dubai with verified project facts and independent investor guidance.',
    image:'aldar-yas-waterfront-investment.webp',imageAlt:'Premium waterfront residences and landscaped setting representing Aldar property in Abu Dhabi',
    kicker:'Abu Dhabi and Dubai opportunity desk',h1:'Live fully. Invest thoughtfully.',heroText:'A human-centred comparison of Aldar’s cultural, waterfront and family-community releases—translated into the details an investor can actually test.',heroProof:['Abu Dhabi expertise','Dubai options compared','Official release evidence'],primary:'Check available Aldar units',secondary:'Explore current launches',
    nav:[['Opportunity map','locations'],['Current launches','projects'],['Decision framework','why-invest'],['Speak to James','enquire']],
    bar:[['Saadiyat','Culture-led luxury'],['Yas Point','Waterfront living'],['The Wilds','Dubai family community'],['James Realty','Independent adviser']],
    projectsTitle:'Aldar opportunities by lifestyle and demand driver',projectsIntro:'Do not compare a Saadiyat branded residence, a Yas waterfront apartment and a Dubai family home as if they serve the same buyer.',
    projects:[
      {meta:'Yas Island · Waterfront',name:'The Canopies',desc:'Studios through three-bedroom residences at Yas Point, combining marina, beach, garden and promenade amenities.',facts:['592 homes','Estimated handover 2030','55/45 plan; 5% down'],price:'From AED 1.65m',priceNote:'Official project page',source:'https://www.aldar.com/properties/en/yascanopies'},
      {meta:'Saadiyat Cultural District',name:'The Row Saadiyat',desc:'Seven buildings with one- to three-bedroom residences framed by museums, cultural institutions and curated resident amenities.',facts:['1–3 bedroom homes','Culture-led location','Climate-controlled connections'],price:'Request current release',priceNote:'Official availability required',source:'https://www.aldar.com/properties/en/uae/saadiyat-island/the-row-saadiyat'},
      {meta:'Branded luxury · Saadiyat',name:'Mandarin Oriental Residences',desc:'A hospitality-branded proposition in Saadiyat Cultural District with extensive wellness, service and residents’ amenities.',facts:['Branded residence','Saadiyat Island','Operator and fee review needed'],price:'Request current release',priceNote:'Verify unit and charges',source:'https://www.aldar.com/properties/en/uae/saadiyat-island/mandarin-oriental-residences'},
    ],
    lensTitle:'Place, people and the ownership model.',lensText:'Aldar’s portfolio spans very different demand stories. The right shortlist starts with who will live there, what already anchors the location and how the exact ownership costs compare.',
    lenses:[['Cultural district','Saadiyat demand may value proximity, brand and rarity—but the premium still needs evidence.'],['Waterfront reality','Verify orientation, future obstruction, access and maintenance rather than buying a label.'],['Emirate rules','Registration and foreign-ownership conditions should be checked for the exact property.'],['Service model','Branded residences require careful review of operator scope and recurring charges.']],
    asides:[['People first','End-user appeal informs liquidity.'],['Details driven','Every unit receives a separate check.']],
    routeTitle:'One portfolio, distinct location stories',routeText:'Aldar is deeply associated with Abu Dhabi and also develops in Dubai. Your return and use case depend on the specific emirate, community and resident profile.',
    route:[['Saadiyat Island','Culture, beaches and premium residential positioning.'],['Yas Island','Leisure, hospitality and an expanding residential waterfront.'],['Dubai communities','Family-led options that must be compared with local competing supply.']],
    journeyTitle:'Aldar decision sequence',journey:[['01','Choose the emirate','Match regulation, location and target resident.'],['02','Match the product','Apartment, branded home or family community.'],['03','Test the premium','Price, view, services, charges and future supply.'],['04','Verify the unit','Current sheet, payment schedule and documents.']],
    formTitle:'Build an Aldar opportunity map.',formText:'Tell James whether you are comparing Yas, Saadiyat, Dubai or a wider UAE portfolio. Receive current options grouped by investor objective.',formIntro:'Hello James, I would like a current Aldar property comparison.',
    faq:[['What are Aldar’s current highlighted launches?','Aldar’s official website highlights The Row Saadiyat and Mandarin Oriental Residences, while The Canopies at Yas Point publishes current property details. Availability changes by release.'],['What is The Canopies payment plan?','The official project page shows a 55/45 plan with 5% down, an AED 1.65 million starting price and estimated 2030 handover. Request the dated unit schedule.'],['Does Aldar only develop in Abu Dhabi?','No. Aldar also has Dubai projects. Location, registration and demand must be assessed by emirate and community.'],['Can foreign investors buy Aldar property?','Ownership depends on the exact project’s designated investment or freehold status and the applicable emirate process.'],['Are waterfront homes automatically better investments?','No. View, layout, premium, maintenance, future construction and target demand all matter.']],
    sources:[['Aldar official website','https://www.aldar.com/en'],['The Canopies official details','https://www.aldar.com/properties/en/yascanopies'],['Abu Dhabi market data','https://jamesrealty.uk/abu-dhabi-data/']],
  },
  {
    slug:'damac',theme:'damac',host:'damac.jamesrealty.uk',lang:'en-AE',layout:'cinema',
    title:'DAMAC Properties Dubai | Luxury & Off-Plan Projects',description:'Compare current DAMAC luxury apartments, villas and branded residences with verified prices, payment-plan checks and independent advice.',
    image:'damac-branded-waterfront-residences.webp',imageAlt:'Curved luxury waterfront residence with private pool representing DAMAC branded property in Dubai',
    kicker:'Luxury property, commercially examined',h1:'The spectacle is only the opening scene.',heroText:'Explore DAMAC’s resort communities and branded residences through the unit economics, operating costs and buyer demand behind the visual promise.',heroProof:['Luxury project screening','Branded-residence review','Current unit verification'],primary:'Request luxury availability',secondary:'View project profiles',
    nav:[['The collection','projects'],['Luxury lens','why-invest'],['Buyer journey','process'],['Private enquiry','enquire']],
    bar:[['Chelsea Residences','Waterfront branded homes'],['DAMAC Islands 2','Villas and townhouses'],['Riverside Views','Apartment community'],['James Realty','Independent comparison']],
    projectsTitle:'Three ways to buy the DAMAC proposition',projectsIntro:'Branded waterfront apartments, a resort-style villa community and apartment-led community living have different cash flows, costs and audiences.',
    projects:[
      {meta:'Maritime City · Branded waterfront',name:'Chelsea Residences',desc:'A Chelsea-branded waterfront development with more than 1,400 residences and hospitality-led amenities.',facts:['Branded residence','Waterfront apartments','Brand and fee review'],price:'Request live units',priceNote:'Unit-specific quotation',source:'https://www.damacproperties.com/en/projects/chelsea-residences/'},
      {meta:'Resort community · Villas',name:'DAMAC Islands 2',desc:'Townhouses and villas positioned around a resort-lifestyle community concept for family and second-home buyers.',facts:['Townhouses and villas','Community proposition','Availability changes'],price:'From AED 2.99m',priceNote:'Official website figure',source:'https://www.damacproperties.com/en/communities/damac-islands-2-community/projects/damac-islands-2/'},
      {meta:'Riverside · Apartments',name:'Riverside Views',desc:'Apartment-led community living for buyers who value amenities and a wider neighbourhood rather than a standalone tower.',facts:['Apartment collection','Community amenities','Total-cost comparison'],price:'Request live units',priceNote:'Price sheet required',source:'https://www.damacproperties.com/en/communities/damac-riverside/projects/damac-riverside-views/'},
    ],
    lensTitle:'Luxury is a product—and an operating model.',lensText:'Design, brand and amenities can support demand, but they can also increase premiums and recurring charges. Review what the owner receives, pays and can realistically rent or resell.',
    lenses:[['Brand agreement','Understand who operates what and whether brand participation can change.'],['Amenity cost','Pools, lagoons and hospitality services must be considered alongside service charges.'],['Resale audience','A distinctive product needs a sufficiently deep future buyer pool.'],['Cash-flow timing','Map every construction instalment, completion payment and furnishing requirement.']],
    asides:[['Private brief','Shortlists match the buyer.'],['No guarantees','Yield claims require evidence.']],
    routeTitle:'Match the experience to the investor',routeText:'A branded city residence may suit a different rental and resale audience from a villa community or an amenity-led apartment neighbourhood.',
    route:[['Branded residence','Assess the premium, service model, target tenant and recurring costs.'],['Villas and townhouses','Test family demand, plot utility, access and community phasing.'],['Apartment community','Compare effective price, layout, competing supply and practical connectivity.']],
    journeyTitle:'A private acquisition sequence',journey:[['01','Set the brief','Lifestyle objective, budget and acceptable holding cost.'],['02','Screen the concept','Location, product, brand and competing supply.'],['03','Inspect the unit','Stack, view, plan, price and payment timing.'],['04','Review documents','Reservation, account details, SPA and registration.']],
    formTitle:'Request the private DAMAC edit.',formText:'Receive a concise selection of current DAMAC units, with the brand premium, payment timing and investor trade-offs clearly marked.',formIntro:'Hello James, I would like current DAMAC luxury property options.',
    faq:[['Which DAMAC projects are compared here?','Chelsea Residences, DAMAC Islands 2 and DAMAC Riverside Views represent three distinct current propositions. Live inventory is checked when you enquire.'],['What is the published starting price at DAMAC Islands 2?','The official project page publishes AED 2.99 million. That does not guarantee a particular townhouse or villa is available.'],['What should I check in a branded residence?','Review the legal branding arrangement, operator responsibilities, owner benefits, restrictions and recurring charges.'],['Can an overseas investor buy DAMAC off-plan property?','Foreign buyers may purchase eligible property in designated Dubai freehold areas, subject to project and registration requirements.'],['Are DAMAC rental returns guaranteed?','No. Rent, occupancy, resale value and timing can vary. Use comparable evidence and conservative ownership costs.']],
    sources:[['DAMAC official portfolio','https://www.damacproperties.com/en/'],['Dubai buying costs','https://jamesrealty.uk/dubai-property-buying-costs/'],['Dubai rental yield calculator','https://jamesrealty.uk/dubai-rental-yield-calculator/']],
  },
  {
    slug:'binghatti',theme:'binghatti',host:'binghatti.jamesrealty.uk',lang:'en-AE',layout:'framed',
    title:'Binghatti Properties Dubai | Latest Projects & Prices',description:'Compare current Binghatti launches, apartments, villas and payment plans with verified official details and independent investor analysis.',
    image:'binghatti-geometric-dubai-residences.webp',imageAlt:'Geometric high-rise residential architecture representing Binghatti property in Dubai',
    kicker:'Architecture meets unit economics',h1:'Form. Location. Numbers. In that order.',heroText:'A sharp comparison of Binghatti’s fast-moving release pipeline—from urban apartments to its first master-planned villa community.',heroProof:['Latest release review','Payment-plan mapping','Unit efficiency check'],primary:'Compare available units',secondary:'Enter the collection',
    nav:[['New forms','projects'],['Locations','locations'],['Investor matrix','why-invest'],['Express interest','enquire']],
    bar:[['Wraith','Al Jaddaf apartments'],['Tilal Binghatti','Academic City villas'],['Skyflame','Majan apartments'],['James Realty','Independent adviser']],
    projectsTitle:'A portfolio moving at three different speeds',projectsIntro:'Binghatti’s current portfolio spans urban apartment launches and a new villa-community format. Compare them on exact unit, local supply and buyer profile.',
    projects:[
      {meta:'Al Jaddaf · Urban apartments',name:'Wraith',desc:'Studios to larger apartments in Al Jaddaf, positioned for connectivity to Downtown, DIFC, healthcare and the airport.',facts:['Studio–3 bedroom range','1 bed shown from 662 sq ft','Urban growth corridor'],price:'1 bed from AED 1.30m',priceNote:'Official current listing',source:'https://www.binghatti.com/en/projects/binghatti-wraith'},
      {meta:'Academic City · Villa community',name:'Tilal Binghatti',desc:'Binghatti’s first master-planned community, combining villas, landscapes, water features and more than 50 amenities.',facts:['4–7 bedroom formats','10m+ sq ft masterplan','Future Blue Line context'],price:'4 bed from AED 4.20m',priceNote:'Official current listing',source:'https://www.binghatti.com/en/projects/tilal-binghatti'},
      {meta:'Majan · Apartment collection',name:'Skyflame',desc:'Twin towers with studios, one- and two-bedroom residences, resort amenities and a construction-linked payment structure.',facts:['20/50/30 official plan','Target 31 Dec 2027','1 bed shown from 691 sq ft'],price:'1 bed from AED 1.10m',priceNote:'Official current listing',source:'https://www.binghatti.com/en/projects/binghatti-skyflame'},
    ],
    lensTitle:'A façade can create attention. It cannot create the return.',lensText:'The investor decision still rests on entry price per usable area, layout, service charge, instalment dates, local pipeline and the tenant or future buyer for that exact unit.',
    lenses:[['Release velocity','Fast launches require disciplined comparisons and dated availability.'],['Plan efficiency','Study furniture walls, circulation and balcony allocation—not only total square feet.'],['Location supply','Al Jaddaf, Majan and Academic City have different competing stock and demand.'],['Completion exposure','Targets are not guarantees; read SPA provisions and construction updates.']],
    asides:[['Compare live','Old price sheets expire quickly.'],['Verify first','Bank details and documents matter.']],
    routeTitle:'Three Dubai growth stories',routeText:'Do not transfer the same rent or resale assumptions across Al Jaddaf, Majan and Academic City. Each requires its own comparables and supply analysis.',
    route:[['Al Jaddaf','Central connectivity with a growing high-rise and cultural profile.'],['Majan','Value-oriented apartment stock near Dubailand demand drivers.'],['Academic City','Education-led location with future infrastructure and villa-community positioning.']],
    journeyTitle:'Decode the launch',journey:[['01','Select the format','Apartment, villa or branded luxury.'],['02','Map the cash','Deposit, construction dates and completion balance.'],['03','Test the location','Rents, transactions, supply and tenant audience.'],['04','Verify the unit','Layout, view, documents and live price.']],
    formTitle:'Get the Binghatti comparison sheet.',formText:'Share your budget and preferred location. James will compare current units by layout, payment timing and local investment evidence.',formIntro:'Hello James, I would like a current Binghatti project comparison.',
    faq:[['What are Binghatti’s latest highlighted releases?','The official website currently leads with projects including Wraith, Tilal Binghatti and Skyflame. The release list changes frequently.'],['What is the current Skyflame payment plan?','The official page states 20% on booking, 50% during construction and 30% on completion. Request the dated instalment schedule.'],['What prices are verified here?','Official current listings show Wraith one-bedroom units from AED 1,299,999, Skyflame one-bedroom units from AED 1,099,999 and Tilal four-bedroom villas from AED 4.2 million. Availability may change.'],['Is a branded or highly designed project automatically better?','No. Compare the price premium, fees, layout, local supply and likely buyer or tenant demand.'],['Can I buy remotely?','Remote procedures may be available, but verify identification, signatures, recipient bank details and documents before paying.']],
    sources:[['Binghatti official projects','https://www.binghatti.com/en/projects'],['Dubai market data','https://jamesrealty.uk/dubai-data/'],['Off-plan vs ready','https://jamesrealty.uk/off-plan-vs-ready-property-dubai/']],
  },
  {
    slug:'nakheel',theme:'nakheel',host:'nakheel.jamesrealty.uk',lang:'en-AE',layout:'cinema',
    title:'Nakheel Properties | Palm Jebel Ali & Waterfront Homes',description:'Explore current Nakheel waterfront projects, Palm Jebel Ali homes and island communities with verified 2026 updates and independent advice.',
    image:'nakheel-dubai-island-waterfront.webp',imageAlt:'Aerial view of a premium Dubai island coastline representing Nakheel waterfront property',
    kicker:'Waterfront property intelligence',h1:'Read the shoreline. Then read the contract.',heroText:'Palm Jebel Ali and Nakheel waterfront homes compared through true orientation, delivery evidence, infrastructure phasing and total ownership cost.',heroProof:['Palm Jebel Ali updates','Waterfront due diligence','Current release checks'],primary:'Request waterfront availability',secondary:'Explore the coast',
    nav:[['Waterfront map','locations'],['Current collection','projects'],['Ownership lens','why-invest'],['Enquire','enquire']],
    bar:[['Palm Central','222-home June phase'],['Palm Jebel Ali','Villa delivery programme'],['Palm Beach Towers','Limited beachfront release'],['James Realty','Independent waterfront advice']],
    projectsTitle:'Three points on the Nakheel waterfront map',projectsIntro:'Waterfront value depends on the exact title, access, orientation, future obstruction, infrastructure and ongoing costs—not simply distance to blue water.',
    projects:[
      {meta:'Palm Jebel Ali · Residences',name:'Palm Central',desc:'A June 2026 phase of 222 homes across three buildings, including one- to four-bedroom apartments and four- to five-bedroom townhouses.',facts:['222-home phase','Apartments and townhouses','Official June 2026 release'],price:'Request current release',priceNote:'Dated sheet required',source:'https://www.nakheel.com/en/media-centre/press-releases/news-detail/2026/06/24/nakheel-releases-next-phase-of-palm-central-private-residences-amid-accelerating-demand-for-beachfront-living-on-palm-jebel-ali'},
      {meta:'Palm Jebel Ali · Villas',name:'Palm Jebel Ali Villas',desc:'Nakheel’s April 2026 update announced contracts for 544 villas with a stated Q4 2028 target.',facts:['544-villa contracts','Q4 2028 stated target','SPA timing still controls'],price:'Request current availability',priceNote:'Target is not a guarantee',source:'https://www.nakheel.com/en/media-centre/press-releases/news-detail/2026/04/27/nakheel-awards-contracts-worth-over-aed-3.5-billion-to-build-544-villas-on-dubai-s-palm-jebel-ali'},
      {meta:'Palm Jumeirah gateway · Apartments',name:'Palm Beach Towers',desc:'A limited May 2026 beachfront collection for buyers comparing established Palm adjacency with new-island delivery exposure.',facts:['Limited 2026 collection','Beachfront positioning','Apartment ownership'],price:'Request current release',priceNote:'Verify exact tower and view',source:'https://www.nakheel.com/en/media-centre/press-releases/news-detail/2026/05/19/nakheel-introduces-a-limited-collection-of-beachfront-homes-at-palm-beach-towers'},
    ],
    lensTitle:'Waterfront is not one variable.',lensText:'The exact line of sight, beach access, legal boundary, construction phasing, salt-air maintenance and competing coastal supply must be visible before the premium can be judged.',
    lenses:[['True orientation','Confirm unit direction and possible future obstruction on current plans.'],['Beach access','Water view, beachfront and private beach are not interchangeable claims.'],['Infrastructure phase','Roads, retail and community facilities may arrive on different timelines.'],['Holding cost','Landscape, beach and shared amenities can affect recurring ownership costs.']],
    asides:[['Map first','Locate the exact plot or stack.'],['Contract next','Review the delivery provisions.']],
    routeTitle:'Dubai’s island investment spectrum',routeText:'Palm Jumeirah offers established transaction and rental evidence; Palm Jebel Ali and Dubai Islands involve different delivery and growth assumptions.',
    route:[['Palm Jebel Ali','New island delivery with villas, residences and infrastructure phasing.'],['Palm Jumeirah edge','Established destination evidence and premium entry pricing.'],['Dubai Islands','Emerging coastal neighbourhoods with varied project timelines.']],
    journeyTitle:'Verify the water, home and delivery',journey:[['01','Set the purpose','Primary home, second home or investment.'],['02','Locate precisely','Plot, stack, view corridor and access.'],['03','Review delivery','Construction evidence, target and SPA terms.'],['04','Price ownership','Acquisition, charges, upkeep and downside.']],
    formTitle:'Request the Nakheel waterfront brief.',formText:'Tell James which island, property type and budget you are considering. Receive current options with orientation and delivery questions included.',formIntro:'Hello James, I would like current Nakheel waterfront property options.',
    faq:[['What are Nakheel’s recent releases?','Nakheel announced another Palm Central phase in June 2026 and a limited Palm Beach Towers collection in May 2026.'],['What is the stated Palm Jebel Ali villa timing?','Nakheel’s April 2026 contract announcement stated a Q4 2028 target for 544 villas. Review the exact SPA; targets are not guarantees.'],['Can foreign buyers own at Palm Jebel Ali?','Foreign buyers may own eligible property in designated Dubai freehold areas, subject to exact title and registration requirements.'],['Is beachfront property guaranteed to appreciate?','No. Supply, delivery, access, maintenance, economic conditions and demand affect value.'],['How do I verify a water view?','Review the exact orientation, floor, current masterplan, future plots and legal documents rather than relying on a marketing label.']],
    sources:[['Nakheel official website','https://www.nakheel.com/'],['Dubai property buying costs','https://jamesrealty.uk/dubai-property-buying-costs/'],['Dubai market dashboard','https://jamesrealty.uk/dubai-data/']],
  },
  {
    slug:'mudon',theme:'mudon',host:'mudon.jamesrealty.uk',lang:'en-AE',layout:'minimal',
    title:'Mudon Dubai Villas & Townhouses | Community Guide',description:'Compare Mudon villas, townhouses and apartments by phase, family lifestyle, live availability and verified community evidence.',
    image:'mudon-family-townhouses-dubai.webp',imageAlt:'Landscaped walking path beside modern family townhouses representing Mudon Dubai community living',
    kicker:'Mudon family-home advisory',h1:'Choose the street, not only the community.',heroText:'A practical guide to Mudon’s ready homes, community phases and family lifestyle—built around condition, plot, school route and live market evidence.',heroProof:['Ready-home comparison','Family lifestyle checks','Current resale evidence'],primary:'Request available Mudon homes',secondary:'Explore community phases',
    nav:[['Community life','locations'],['Home types','projects'],['Buyer checklist','why-invest'],['Arrange a shortlist','enquire']],
    bar:[['Arabella','3–4 bedroom townhouses'],['Mudon Views','1–3 bedroom apartments'],['Al Ranim','3–4 bedroom townhouses'],['Al Qudra Road','Dubailand connectivity']],
    projectsTitle:'Mudon is a collection of different home choices',projectsIntro:'Some official Al Ranim phase pages are marked sold out, so current opportunities may be resale, assignment or a later release. Condition and position matter as much as phase name.',
    projects:[
      {meta:'Established · Townhouses',name:'Arabella',desc:'Three- and four-bedroom townhouses in a mature family setting. Compare plot exposure, upgrades, maintenance and actual street position.',facts:['3–4 bedroom townhouses','Ready-home inspections','Established landscaping'],price:'Live resale pricing',priceNote:'Compare asking and transaction evidence',source:'https://www.dp.ae/our-portfolio/all-projects/58/mudon/'},
      {meta:'Apartment living',name:'Mudon Views',desc:'One- to three-bedroom apartments for buyers seeking community access with lower-maintenance living than a villa or townhouse.',facts:['1–3 bedroom apartments','Community lifestyle','Service-charge review'],price:'Live resale pricing',priceNote:'Unit condition varies',source:'https://www.dp.ae/our-portfolio/all-projects/58/mudon/'},
      {meta:'Park-edge · Townhouses',name:'Al Ranim',desc:'Three- and four-bedroom townhouses arranged around park-led community space; several official phase pages show sold out.',facts:['3–4 bedroom townhouses','Phase-by-phase comparison','Verify resale or assignment'],price:'Availability on request',priceNote:'Do not rely on old launch sheets',source:'https://www.dp.ae/our-portfolio/all-projects/58/mudon/'},
    ],
    lensTitle:'The everyday test matters most.',lensText:'Drive the school and work route, inspect sun direction and privacy, price maintenance, review community charges and compare the exact cluster against other family communities.',
    lenses:[['Street position','Corner, backing, road exposure and park proximity influence daily life and resale.'],['Property condition','Ready homes require inspection of systems, finishes, waterproofing and alterations.'],['Family logistics','School route, commuting, groceries and recreation should be tested at real times.'],['Rental evidence','Use achieved rents, vacancy and competing family homes—not advertised yield alone.']],
    asides:[['Liveable first','End-user demand supports liquidity.'],['Inspect always','Condition changes the value.']],
    routeTitle:'A family day in Mudon',routeText:'Mudon is a gated Dubailand community along Al Qudra Road. The buying decision should map the household’s real weekly routine.',
    route:[['Morning','Test school and work routes during actual peak traffic.'],['Afternoon','Compare parks, pools, shade, play areas and nearby services.'],['Weekend','Assess community retail, sports and access to wider Dubai destinations.']],
    journeyTitle:'Shortlist the cluster before the unit',journey:[['01','Map the household','Bedrooms, schools, pets, work and outdoor priorities.'],['02','Compare phases','Home type, age, landscape, charges and access.'],['03','Inspect properly','Condition, orientation, privacy and alterations.'],['04','Price the decision','Purchase cost, upkeep, finance and resale depth.']],
    formTitle:'Receive a live Mudon shortlist.',formText:'Share the bedroom requirement, budget, school or work location and move timeline. James will compare current homes by phase and condition.',formIntro:'Hello James, I would like current homes available in Mudon.',
    faq:[['Where is Mudon?','Mudon is a gated community in Dubailand along Al Qudra Road. Test real travel times to your regular destinations.'],['What property types are available?','Dubai Properties lists Arabella townhouses, Mudon Views apartments and Al Ranim townhouses among the community’s home types.'],['Are new Mudon launches currently available?','Some official Al Ranim pages are marked sold out. Current stock may be resale, assignment or a later release and must be verified.'],['Is Mudon suitable for families?','It is designed around family housing, parks and everyday amenities, but the right phase depends on route, household needs and budget.'],['What should an investor check?','Compare achieved rents, vacancy, charges, maintenance, tenant profile, transaction evidence and competing communities.']],
    sources:[['Dubai Properties Mudon page','https://www.dp.ae/our-portfolio/all-projects/58/mudon/'],['Community comparison guide','https://jamesrealty.uk/best-dubai-communities-by-budget/'],['Dubai transaction data','https://jamesrealty.uk/dubai-data/']],
  },
];

const enhancements = {
  emaar: {
    heroMode: 'editorial', map: { lat: '25.1117', lon: '55.2708', bbox: '55.05,24.94,55.48,25.30' },
    projectImages: ['emaar-golf-community-apartments.webp','emaar-family-townhouses.webp','emaar-waterfront-marina-residences.webp'],
    projectAlts: ['Representative golf-edge apartments in a landscaped Dubai master community','Representative contemporary family townhouses in a landscaped Dubai community','Representative premium marina-front apartments in Dubai at blue hour'],
    signature: ['Master communities','Emaar South','Golf-led homes and Dubai South connectivity.','Rashid Yachts & Marina','Marina living close to central Dubai.','Dubai Creek Harbour','Waterfront scale with an evolving infrastructure story.'],
    flow: ['signature','projects','map','lens','journey'],
  },
  aldar: {
    heroMode: 'destination', map: { lat: '24.4941', lon: '54.6079', bbox: '54.30,24.30,54.82,24.62' },
    projectImages: ['aldar-yas-waterfront-apartments.webp','aldar-saadiyat-cultural-residences.webp','aldar-nature-led-villas.webp'],
    projectAlts: ['Representative nature-led waterfront apartments on Yas Island','Representative cultural-district residences with pale stone colonnades','Representative nature-led family villas in a landscaped UAE community'],
    signature: ['Live the destination','Yas Point','Water, gardens and leisure-led daily life.','Saadiyat Island','Culture, beach and rare residential positioning.','The Wilds, Dubai','Nature-led family living in a new Dubai community.'],
    flow: ['signature','map','projects','lens','journey'],
  },
  damac: {
    heroMode: 'cinematic', map: { lat: '25.2295', lon: '55.2834', bbox: '55.08,24.98,55.48,25.35' },
    projectImages: ['damac-sea-view-residences.webp','damac-lagoon-villa-community.webp','damac-resort-residences.webp'],
    projectAlts: ['Representative cinematic sea-view luxury residence above Dubai Maritime City','Representative resort lagoon villa community in Dubai','Representative hospitality-inspired apartment arrival with water features'],
    signature: ['The private edit','Branded waterfront','A premium that must be tested against service and resale depth.','Resort community','Lifestyle scale with construction, fees and family demand to model.','Apartment neighbourhood','Unit efficiency and operating costs before spectacle.'],
    flow: ['projects','signature','lens','journey','map'],
  },
  binghatti: {
    heroMode: 'graphic', map: { lat: '25.1800', lon: '55.3100', bbox: '55.16,25.03,55.43,25.29' },
    projectImages: ['binghatti-copper-geometric-tower.webp','binghatti-sculptural-villas.webp','binghatti-crystalline-apartments.webp'],
    projectAlts: ['Representative geometric Dubai apartment tower with copper balcony frames','Representative sculptural villa compound with angular sandstone screens','Representative crystalline mid-rise apartment tower in Dubai'],
    signature: ['Compare the form','Urban apartments','Fast-moving supply; layout and building position matter.','Villa masterplan','Lower density, larger capital exposure and a different exit pool.','Value apartment','Ticket size helps entry; local pipeline decides resilience.'],
    flow: ['signature','projects','matrix','map','lens','journey'],
  },
  nakheel: {
    heroMode: 'coastline', map: { lat: '25.0134', lon: '54.9870', bbox: '54.82,24.90,55.23,25.18' },
    projectImages: ['nakheel-private-island-villas.webp','nakheel-lagoon-residences.webp','nakheel-beachfront-tower.webp'],
    projectAlts: ['Representative aerial view of private island villas and beaches in Dubai','Representative low-rise private residences around a protected island lagoon','Representative mature beachfront tower residence on the Dubai coast'],
    signature: ['Read the coastline','Private frond villa','Beach orientation, plot utility and handover evidence.','Island apartment','A broader entry route into a long-horizon masterplan.','Mature waterfront','Established access and operations versus a newer-island premium.'],
    flow: ['map','signature','projects','lens','journey'],
  },
  mudon: {
    heroMode: 'residential', map: { lat: '25.0267', lon: '55.2636', bbox: '55.20,24.98,55.33,25.08' },
    projectImages: ['mudon-family-townhouses.webp','mudon-community-park.webp','mudon-villa-street.webp'],
    projectAlts: ['Representative leafy family townhouse cluster in Mudon-style Dubai community','Representative green community park with cycling path and family pavilion','Representative practical villa street with private gardens and mature trees'],
    signature: ['The everyday test','Morning','School and work routes in real peak traffic.','Afternoon','Shade, parks, pools and children’s movement.','Weekend','Retail, sports and the drive to wider Dubai.'],
    flow: ['signature','projects','map','day','lens','journey'],
  },
  uk: {
    heroMode: 'market', map: { lat: '25.2048', lon: '55.2708', bbox: '55.08,24.98,55.46,25.35' },
    projectImages: ['uk-downtown-dubai-apartment.webp','uk-dubai-hills-apartment.webp'],
    projectAlts: ['Representative Downtown Dubai investment apartment viewed from a balcony','Representative Dubai Hills apartment overlooking green park and golf landscape'],
    flow: ['currency','projects','costs','map','lens','journey'],
  },
  usa: {
    heroMode: 'underwriting', map: { lat: '25.0800', lon: '55.1450', bbox: '55.05,24.96,55.38,25.28' },
    projectImages: ['usa-dubai-marina-apartment.webp','usa-dubai-townhouse.webp'],
    projectAlts: ['Representative ready apartment overlooking Dubai Marina','Representative Dubai family townhouse in a shaded master community'],
    flow: ['underwriting','projects','costs','map','lens','journey'],
  },
  india: {
    heroMode: 'payment', map: { lat: '25.1972', lon: '55.3614', bbox: '55.16,24.98,55.48,25.32' },
    projectImages: ['india-dubai-creek-apartment.webp','india-waterfront-offplan.webp'],
    projectAlts: ['Representative efficient Dubai Creek investment apartment with waterfront view','Representative off-plan waterfront apartment building with landscaped promenade'],
    flow: ['currency','projects','payment','map','lens','journey'],
  },
  ar: {
    heroMode: 'arabic', map: { lat: '25.2048', lon: '55.2708', bbox: '55.08,24.98,55.46,25.35' },
    projectImages: ['arabic-dubai-villa-courtyard.webp','arabic-downtown-apartment.webp'],
    projectAlts: ['فناء فيلا عصرية في دبي مع جلسة خارجية خاصة ومظللة','شقة فاخرة في وسط دبي بإطلالة على الأفق عند الغروب'],
    flow: ['projects','arabicGuide','map','lens','journey'],
  },
};

for (const page of pages) Object.assign(page, enhancements[page.slug]);

const currentProjectOverrides = {
  emaar: [
    {meta:'Latest release · Emaar South',name:'Golf Fields',desc:'One- to three-bedroom apartments and three-bedroom townhouses beside the golf landscape in Dubai South.',facts:['1–3 bedroom apartments','3 bedroom townhouses','Official latest-launch list'],price:'From AED 1.26m',priceNote:'Official price checked 17 Aug 2026',source:'https://www.emaar.com/en/properties/golf-fields-at-emaar-south'},
    {meta:'Latest release · Emaar South',name:'Golf Vale',desc:'Golf-view apartments and townhouses for buyers comparing a lower entry point with a long-horizon growth corridor.',facts:['1–3 bedroom apartments','3 bedroom townhouses','Dubai South location'],price:'From AED 1.09m',priceNote:'Official price checked 17 Aug 2026',source:'https://www.emaar.com/en/properties/golf-vale-at-emaar-south'},
    {meta:'Latest release · Rashid Yachts & Marina',name:'Fior 1',desc:'One- to three-bedroom marina-front apartments shaped around waterfront views and central-Dubai access.',facts:['1–3 bedroom apartments','Marina masterplan','Current official launch'],price:'From AED 2.2m',priceNote:'Official price checked 17 Aug 2026',source:'https://www.emaar.com/en/properties/fior-1-at-rashid-yachts-and-marina'},
  ],
  aldar: [
    {meta:'July 2026 launch · Yas Point',name:'The Canopies',desc:'The first residential community at Yas Point, pairing nature-led waterfront living with the wider Yas Island demand story.',facts:['Yas Point waterfront','Official July 2026 launch','Unit schedule required'],price:'From AED 1.65m',priceNote:'Official launch figure; reconfirm unit',source:'https://www.aldar.com/en/news-and-media/aldar-launches-the-canopies-at-yas-point-bringing-nature-inspired-living-to-yas-island-s-northern-shore'},
    {meta:'February 2026 · Saadiyat Island',name:'Baccarat Residences Saadiyat',desc:'A limited collection of 77 branded homes in Saadiyat Cultural District for a highly specific luxury buyer profile.',facts:['77 residences','2–3 bedroom collection','Brand and fee review'],price:'Request current release',priceNote:'Availability and charges verified by unit',source:'https://www.aldar.com/en/news-and-media/aldar-launches-baccarat-residences-saadiyat'},
    {meta:'February 2026 · Dubai',name:'The Wilds Residences',desc:'Six residential buildings extending Aldar’s nature-led Wilds community proposition in Dubai.',facts:['Nature-led Dubai community','Six residential buildings','Current availability required'],price:'Request current release',priceNote:'Official release; live sheet required',source:'https://www.aldar.com/en/news-and-media/aldar-introduces-the-wilds-residences'},
  ],
  damac: [
    {meta:'Dubai Maritime City · Branded waterfront',name:'Chelsea Residences',desc:'A Chelsea-branded waterfront development with more than 1,400 residences and hospitality-led amenities.',facts:['1–3 bedroom apartments','Sea-view positioning','Brand and fee review'],price:'From AED 3.005m',priceNote:'Official project page',source:'https://www.damacproperties.com/en/projects/chelsea-residences/'},
    {meta:'Resort community · Villas',name:'DAMAC Islands 2',desc:'Townhouses and villas positioned around a resort-lifestyle community concept for family and second-home buyers.',facts:['Townhouses and villas','Phased master community','Handover evidence required'],price:'From AED 2.99m',priceNote:'Official website figure',source:'https://www.damacproperties.com/en/communities/damac-islands-2-community/projects/damac-islands-2/'},
    {meta:'Riverside · Apartments',name:'Riverside Views',desc:'Apartment-led community living for buyers comparing amenities, practical connectivity and a wider neighbourhood proposition.',facts:['Apartment collection','Community amenities','Total-cost comparison'],price:'Request live units',priceNote:'Dated price sheet required',source:'https://www.damacproperties.com/en/communities/damac-riverside/projects/damac-riverside-views/'},
  ],
  binghatti: [
    {meta:'Al Jaddaf · Current portfolio',name:'Binghatti Wraith',desc:'Studios to three-bedroom apartments in a well-connected urban district, with exact unit efficiency and local supply to compare.',facts:['Studio–3 bedroom range','Al Jaddaf','Building-level demand check'],price:'From AED 799,999',priceNote:'Official portfolio starting price',source:'https://www.binghatti.com/en/projects'},
    {meta:'Academic City · Villa community',name:'Tilal Binghatti',desc:'Binghatti’s villa-community format for buyers comparing larger homes, lower density and a narrower future buyer pool.',facts:['4–7 bedroom range','Academic City','Community phasing review'],price:'From AED 4.2m',priceNote:'Official portfolio starting price',source:'https://www.binghatti.com/en/projects'},
    {meta:'Majan · Value apartments',name:'Binghatti Skyflame',desc:'Studio to two-bedroom apartments with a lower headline entry point in a developing Dubai residential node.',facts:['Studio–2 bedroom range','Majan','Pipeline and rent evidence'],price:'From AED 585,000',priceNote:'Official portfolio starting price',source:'https://www.binghatti.com/en/projects'},
  ],
  uk: [
    {meta:'Current Emaar example · Emaar South',name:'Golf Vale',desc:'A golf-edge apartment and townhouse release for a UK buyer comparing lower entry price with Dubai South’s longer infrastructure horizon.',facts:['From AED 1.09m','1–3 bed apartments','GBP cash-flow model needed'],price:'≈ £220k at your rate',priceNote:'Use the editable calculator; excludes costs',source:'https://www.emaar.com/en/properties/golf-vale-at-emaar-south'},
    {meta:'Current Aldar example · Yas Point',name:'The Canopies',desc:'A nature-led waterfront launch on Yas Island for buyers considering Abu Dhabi alongside Dubai.',facts:['From AED 1.65m','Official July 2026 launch','Abu Dhabi cost path'],price:'≈ £333k at your rate',priceNote:'Illustrative only; live rate and unit required',source:'https://www.aldar.com/en/news-and-media/aldar-launches-the-canopies-at-yas-point-bringing-nature-inspired-living-to-yas-island-s-northern-shore'},
  ],
  usa: [
    {meta:'Ready-market lens · Dubai Marina',name:'Ready marina apartment',desc:'A completed unit can be underwritten against building-level rent, vacancy, service charges and management from day one.',facts:['Inspect before closing','Comparable rents','Operating setup'],price:'Model net USD income',priceNote:'No yield is guaranteed',source:'https://jamesrealty.uk/dubai-rental-yield-calculator/'},
    {meta:'Current DAMAC example · Maritime City',name:'Chelsea Residences',desc:'A branded off-plan waterfront proposition where brand premium, completion exposure, recurring fees and future exit depth must be modeled.',facts:['From AED 3.005m','1–3 bedroom apartments','Branded fee review'],price:'≈ $818k at AED peg',priceNote:'Excludes transaction and operating costs',source:'https://www.damacproperties.com/en/projects/chelsea-residences/'},
  ],
  india: [
    {meta:'Current Binghatti example · Majan',name:'Binghatti Skyflame',desc:'A lower headline entry point that still needs a complete INR schedule across booking, construction, completion and costs.',facts:['From AED 585k','Studio–2 bedroom range','LRS calendar first'],price:'Map full INR outflow',priceNote:'Editable rate; bank advice required',source:'https://www.binghatti.com/en/projects'},
    {meta:'Current Emaar example · Emaar South',name:'Golf Fields',desc:'Apartments and townhouses for buyers comparing staged off-plan payments with a longer Dubai South holding case.',facts:['From AED 1.26m','1–3 bed apartments','3 bed townhouses'],price:'Plan every remittance',priceNote:'Not only the booking amount',source:'https://www.emaar.com/en/properties/golf-fields-at-emaar-south'},
  ],
  ar: [
    {meta:'مشروع حالي · نخيل',name:'بالم سنترال — نخلة جبل علي',desc:'مساكن خاصة معاصرة في قلب الجزيرة؛ القرار يحتاج إلى مراجعة الوحدة والإطلالة والجدول الزمني والتكاليف.',facts:['شقق وتاون هاوس','مشروع واجهة بحرية','التحقق من الوحدة الحالية'],price:'اطلب السعر الحالي',priceNote:'السعر والتوفر حسب الإصدار',source:'https://www.nakheel.com/en/new-launches/palm-central-private-residences'},
    {meta:'إطلاق يوليو 2026 · الدار',name:'ذا كانوبيز — ياس بوينت',desc:'مجتمع سكني جديد بطابع طبيعي على الواجهة البحرية في جزيرة ياس، مع اختلاف إجراءات الشراء والتسجيل عن دبي.',facts:['ابتداءً من 1.65 مليون درهم','واجهة بحرية في ياس','مقارنة أبوظبي ودبي'],price:'من 1.65 مليون درهم',priceNote:'رقم الإطلاق الرسمي؛ تحقق من الوحدة',source:'https://www.aldar.com/en/news-and-media/aldar-launches-the-canopies-at-yas-point-bringing-nature-inspired-living-to-yas-island-s-northern-shore'},
  ],
};

for (const page of pages) if (currentProjectOverrides[page.slug]) page.projects = currentProjectOverrides[page.slug];

pages.push(
  {
    slug:'uk',theme:'uk',host:'dubai.jamesrealty.uk',lang:'en-GB',layout:'split',
    title:'Dubai Property Investment from the UK | British Buyers',description:'A practical UK investor guide to buying Dubai property remotely, GBP/AED planning, ownership, costs, tax questions and due diligence.',
    image:'uk-investor-dubai-property-research.webp',imageAlt:'UK investor reviewing Dubai property plans from a professional workspace overlooking the city',
    kicker:'UK to Dubai property desk',h1:'Build the Dubai case in pounds and dirhams.',heroText:'A British-buyer journey that keeps currency exposure, UK reporting, Dubai purchase costs and remote due diligence visible before reservation.',heroProof:['GBP/AED cash-flow plan','UK tax questions flagged','Remote purchase support'],primary:'Get UK investor recommendations',secondary:'See the buying pathway',
    nav:[['UK case','why-invest'],['Property routes','projects'],['Buying pathway','process'],['Book a consultation','enquire']],
    bar:[['Ownership','Eligible freehold areas'],['Currency','Plan every AED instalment'],['UK reporting','Qualified advice required'],['Remote buying','Document-led process']],
    projectsTitle:'Choose the investment format before the promoted project',projectsIntro:'A British investor should first decide whether the objective favours income visibility, staged payments or family-size scarcity—then shortlist projects.',
    projects:[
      {meta:'Income-led · Ready property',name:'Established apartment',desc:'A ready apartment can be inspected and compared against achieved rents, service charges and building history before purchase.',facts:['Inspect before transfer','Existing rent evidence','Earlier operating cash flow'],price:'Budget in GBP + AED',priceNote:'Include transfer and furnishing costs',source:'https://jamesrealty.uk/dubai-property-buying-costs/'},
      {meta:'Growth-led · Off-plan',name:'Developer launch',desc:'Construction-linked payments may spread capital calls, but introduce delivery, contract, resale and future-supply exposure.',facts:['Staged AED payments','Developer and escrow checks','Completion risk'],price:'Map every instalment',priceNote:'Stress-test GBP movement',source:'https://jamesrealty.uk/off-plan-vs-ready-property-dubai/'},
      {meta:'Family demand · Low density',name:'Townhouse or villa',desc:'Family homes can serve end-users and longer-term tenants, with higher entry cost and greater maintenance considerations.',facts:['Community selection','Plot and condition review','Family tenant profile'],price:'Total-cost comparison',priceNote:'Finance and upkeep matter',source:'https://jamesrealty.uk/best-dubai-communities-by-budget/'},
    ],
    lensTitle:'Why UK buyers look at Dubai—and what still follows them home.',lensText:'Dubai freehold access, new supply and lifestyle appeal can be attractive. A UK resident still needs to consider sterling conversion, UK tax reporting, financing and the management of an overseas asset.',
    lenses:[['Sterling exposure','Record AED payment dates and stress-test a weaker pound before committing.'],['UK tax position','Overseas rental income and gains may require UK reporting; obtain current professional advice.'],['Remote verification','Use live video, exact plans, official accounts and independent document review.'],['Management reality','Price leasing, service charges, maintenance, vacancy and remote decision authority.']],
    asides:[['No tax slogans','Claims are carefully qualified.'],['One currency map','Every payment stays visible.']],
    routeTitle:'Three Dubai area profiles for a UK shortlist',routeText:'Established central apartments, emerging master communities and family districts behave differently. James compares the location with your UK-based operating plan.',
    route:[['Established central areas','Deeper transaction evidence, higher entry pricing and building-level variation.'],['Emerging master communities','New infrastructure and supply require completion and absorption analysis.'],['Family villa districts','Longer leases may appeal, with greater maintenance and management needs.']],
    journeyTitle:'From a UK enquiry to Dubai ownership',journey:[['01','Build the GBP brief','Capital, finance, income objective and currency reserve.'],['02','Compare in AED','Property, costs, instalments and conservative rent.'],['03','Verify remotely','Unit, seller or developer, documents and recipient account.'],['04','Complete with advice','Dubai conveyancing plus UK tax and financial guidance.']],
    formTitle:'Get a UK-to-Dubai investment shortlist.',formText:'Share your GBP/AED budget, income or growth objective and purchase timing. Receive current options with currency and due-diligence questions included.',formIntro:'Hello James, I am based in the UK and would like Dubai property recommendations.',
    faq:[['Can a British citizen buy property in Dubai?','Yes, foreign buyers may own eligible property in designated Dubai freehold areas, subject to the exact title and registration process.'],['Can I buy while remaining in the UK?','Remote purchase procedures may be available. Verify identity, signing, official bank details, title or project registration and use professional advice where appropriate.'],['Do UK residents pay UK tax on Dubai rental income?','UK residents may have UK reporting and tax obligations on overseas income. Obtain current advice from a qualified UK tax professional for your circumstances.'],['How much are Dubai buying costs?','Costs vary by transaction and can include registration, agency, trustee or conveyancing, financing and other charges. Build a dated unit-level cost sheet.'],['Does a property purchase guarantee UAE residency?','No. Visa routes have separate eligibility, evidence and authority approval requirements that can change.']],
    sources:[['HMRC foreign income guidance','https://www.gov.uk/tax-foreign-income'],['UAE government foreign ownership','https://u.ae/en/information-and-services/moving-to-the-uae/expatriates-buying-a-property-in-the-uae'],['James Realty UK buyer guide','https://jamesrealty.uk/dubai-property-investment-uk-buyers/']],
    countryDefault:'United Kingdom',currency:'GBP / AED',
  },
  {
    slug:'usa',theme:'usa',host:'dubairealestate.jamesrealty.uk',lang:'en-US',layout:'framed',
    title:'Dubai Real Estate for Americans | US Investor Guide',description:'A US-focused guide to Dubai real estate ownership, remote buying, USD/AED planning, federal reporting questions and investment due diligence.',
    image:'usa-investor-dubai-real-estate-research.webp',imageAlt:'American investor reviewing Dubai real estate research and financial plans from a modern office',
    kicker:'US to Dubai cross-border desk',h1:'Underwrite Dubai like an overseas asset—not a vacation purchase.',heroText:'A US-investor framework connecting Dubai title, property operations and unit economics with the American reporting and ownership questions that remain relevant.',heroProof:['USD/AED framework','US reporting questions surfaced','Dubai unit underwriting'],primary:'Get a US investor brief',secondary:'Review the cross-border plan',
    nav:[['Investment case','why-invest'],['Property formats','projects'],['Execution plan','process'],['Talk to James','enquire']],
    bar:[['USD/AED','AED is pegged to USD'],['Ownership','Eligible freehold areas'],['US reporting','Professional advice required'],['Dubai costs','Model the full basis']],
    projectsTitle:'Select the operating model first',projectsIntro:'The best Dubai asset for a US buyer depends on how rent, management, capital calls and future sale will work from another time zone.',
    projects:[
      {meta:'Operating income · Ready',name:'Ready rental apartment',desc:'Inspect the building, review actual rents, service charges and management options, then underwrite vacancy and maintenance.',facts:['Existing evidence','Earlier leasing potential','Building-level risk'],price:'Model in USD + AED',priceNote:'Include all closing costs',source:'https://jamesrealty.uk/dubai-rental-yield-calculator/'},
      {meta:'Capital schedule · Off-plan',name:'Dubai off-plan property',desc:'A staged payment schedule can manage capital deployment but adds completion, contract and future-supply risk.',facts:['Construction instalments','Developer checks','No guaranteed return'],price:'Underwrite each call',priceNote:'Liquidity before completion varies',source:'https://jamesrealty.uk/off-plan-vs-ready-property-dubai/'},
      {meta:'Luxury or family use',name:'Villa or branded residence',desc:'A larger or branded asset may fit wealth-preservation or lifestyle goals, but fees and resale depth require closer review.',facts:['Premium-entry analysis','Operator or community fees','Narrower future buyer pool'],price:'Scenario analysis',priceNote:'Base and downside cases',source:'https://jamesrealty.uk/best-dubai-communities-by-budget/'},
    ],
    lensTitle:'What changes—and what does not—for an American owner.',lensText:'Dubai does not replace US tax or reporting obligations. Property title, entity use, foreign accounts, rental income and sale proceeds should be reviewed with qualified US and UAE advisers.',
    lenses:[['Federal reach','US citizens and residents generally remain subject to US tax rules on worldwide income.'],['Account reporting','Foreign-account reporting depends on facts such as ownership and account structure; obtain tailored advice.'],['Entity choice','Do not create a company or ownership structure without legal and tax analysis.'],['Remote operations','Set authority, leasing, maintenance, banking and recordkeeping before completion.']],
    asides:[['Claims qualified','No “tax-free” shorthand.'],['Numbers sourced','Unit facts are verified.']],
    routeTitle:'Three underwriting lenses for Dubai locations',routeText:'Separate tenant demand, completion pipeline and building or community operating quality. Citywide averages are not a substitute for unit comparables.',
    route:[['Central apartment districts','Review building age, service charges, rent evidence and nearby pipeline.'],['New master communities','Model infrastructure delivery, competing stock and future demand.'],['Luxury waterfront or branded','Test premium, operating fees and depth of the resale audience.']],
    journeyTitle:'Run two workstreams together',journey:[['01','Define the mandate','Income, growth, lifestyle, time horizon and liquidity.'],['02','Underwrite Dubai','Unit price, costs, rent, vacancy, fees and downside.'],['03','Review US position','Tax, reporting, accounts and ownership structure with advisers.'],['04','Close and operate','Verified transfer, records, management and annual review.']],
    formTitle:'Request the US investor underwriting brief.',formText:'Share your USD/AED budget, asset preference and income or growth objective. James will return a focused Dubai shortlist and operating checklist.',formIntro:'Hello James, I am based in the United States and would like a Dubai real estate investment shortlist.',
    faq:[['Can Americans own Dubai real estate?','Foreign buyers may own eligible property in designated Dubai freehold areas, subject to title, identification and registration requirements.'],['Is Dubai rental income tax-free for an American?','Do not assume so. US taxpayers generally need to consider US rules on worldwide income. Obtain current professional advice.'],['Does owning a Dubai property create an FBAR filing?','Property ownership by itself is not the same as a foreign financial account, but related accounts or structures may create reporting questions. Seek tailored US advice.'],['Can I finance a Dubai property from the US?','Financing may be available subject to lender criteria, residency, income, valuation and property status. Compare total cost and timing.'],['Are Dubai rental yields guaranteed?','No. Rent, occupancy, expenses, currency, building performance and future supply can vary.']],
    sources:[['IRS international taxpayers','https://www.irs.gov/individuals/international-taxpayers'],['FinCEN FBAR guidance','https://www.fincen.gov/report-foreign-bank-and-financial-accounts'],['UAE government ownership guidance','https://u.ae/en/information-and-services/moving-to-the-uae/expatriates-buying-a-property-in-the-uae']],
    countryDefault:'United States',currency:'USD / AED',
  },
  {
    slug:'india',theme:'india',host:'dubaiproperties.jamesrealty.uk',lang:'en-IN',layout:'minimal',
    title:'Dubai Property for Indian Investors | India Buyer Guide',description:'A practical India-to-Dubai property guide covering INR/AED planning, LRS, remittance documentation, TCS questions and verified buying steps.',
    image:'india-investor-dubai-property-planning.webp',imageAlt:'Indian property investor reviewing Dubai plans, remittance timing and investment documents',
    kicker:'India to Dubai property desk',h1:'Plan the remittance before the reservation.',heroText:'A localized buying journey that connects Dubai property selection with INR/AED timing, authorised-dealer documentation, LRS usage and total acquisition cost.',heroProof:['INR/AED payment map','LRS and TCS questions flagged','Remote purchase support'],primary:'Get India investor options',secondary:'See the remittance pathway',
    nav:[['India case','why-invest'],['Property choices','projects'],['Payment pathway','process'],['WhatsApp James','enquire']],
    bar:[['LRS','Confirm current bank process'],['INR/AED','Map every instalment'],['TCS','Obtain current tax advice'],['Ownership','Eligible Dubai freehold areas']],
    projectsTitle:'Match the property to the remittance profile',projectsIntro:'A low booking amount does not make a property affordable. Compare the entire INR/AED payment calendar, TCS cash-flow effect, acquisition costs and operating plan.',
    projects:[
      {meta:'Lower ticket · Apartments',name:'Investment apartment',desc:'A studio or one-bedroom can reduce entry capital, but building charges, local supply and real tenant demand still decide performance.',facts:['Ready or off-plan','Building-level evidence','Rental demand check'],price:'Model total INR outflow',priceNote:'Not only booking amount',source:'https://jamesrealty.uk/dubai-rental-yield-calculator/'},
      {meta:'Staged capital · Off-plan',name:'Construction-linked plan',desc:'Instalments can spread payments across financial years, subject to contract dates, LRS capacity and authorised-dealer procedures.',facts:['Dated instalments','Developer and escrow checks','Completion balance reserve'],price:'Map each remittance',priceNote:'Confirm LRS usage first',source:'https://jamesrealty.uk/off-plan-vs-ready-property-dubai/'},
      {meta:'Family wealth · Villas',name:'Townhouse or villa',desc:'Larger homes can suit family use or long-term tenant demand, with higher acquisition, maintenance and remittance requirements.',facts:['Family community selection','Plot and maintenance review','Higher capital concentration'],price:'Plan full family funding',priceNote:'Ownership and remitter must align',source:'https://jamesrealty.uk/best-dubai-communities-by-budget/'},
    ],
    lensTitle:'The Dubai decision and Indian payment rules meet in one calendar.',lensText:'Indian residents should confirm current LRS, authorised-dealer, TCS, tax and documentation treatment before committing. The structure and remitter must match the genuine ownership arrangement.',
    lenses:[['LRS capacity','RBI’s current FAQ states USD 250,000 per resident individual per financial year for permitted transactions, subject to current rules.'],['TCS cash flow','TCS treatment can affect upfront cash even where credit may later be available; confirm applicability with bank and adviser.'],['Ownership alignment','Buyer, remitter, beneficial interest and documents must be consistent and accepted.'],['Currency timing','Stress-test INR weakness across booking, construction and completion payments.']],
    asides:[['Bank first','Use an authorised dealer.'],['No shortcuts','Keep documents consistent.']],
    routeTitle:'A practical India-to-Dubai funding map',routeText:'Map the developer or seller schedule against financial years, available LRS limits, bank processing time and conservative INR/AED assumptions.',
    route:[['Before reservation','Confirm ownership, remitter, purpose code, available limits and documents.'],['During construction','Track each instalment, remittance record, TCS and remaining capacity.'],['At completion','Reserve transfer costs, final payment, furnishing and operating cash.']],
    journeyTitle:'From Indian bank to Dubai title',journey:[['01','Set the structure','Buyer names, ownership shares and genuine remitters.'],['02','Confirm the bank path','LRS capacity, purpose, documents and timing.'],['03','Verify Dubai property','Title or project, unit, price, escrow and contract.'],['04','Retain records','Remittances, TCS, registration, income and annual advice.']],
    formTitle:'Get an India-ready Dubai shortlist.',formText:'Share the budget, likely remitters, property type and payment preference. James will compare current options with the INR/AED schedule visible.',formIntro:'Hello James, I am based in India and would like Dubai property recommendations with payment planning.',
    faq:[['Can an Indian resident use LRS to buy property in Dubai?','RBI guidance permits resident individuals to use LRS for eligible overseas property acquisition, subject to the current limit, purpose and authorised-dealer procedures.'],['What is the current LRS limit?','RBI’s current FAQ states USD 250,000 per resident individual per financial year for permitted current or capital account transactions, or a combination. Confirm before remitting.'],['How can TCS affect the payment?','TCS treatment depends on current law, purpose and thresholds. It can affect upfront cash flow even where credit may later be available. Obtain current bank and tax advice.'],['Can family members combine limits?','Do not assume simple aggregation. Ownership, remittance purpose, documentation and beneficial interest must be genuine and accepted by the authorised dealer.'],['Can Indian buyers own Dubai freehold property?','Foreign buyers may own eligible property in designated Dubai freehold areas, subject to exact title and registration requirements.']],
    sources:[['RBI Liberalised Remittance Scheme FAQ','https://www.rbi.org.in/commonperson/english/scripts/FAQs.aspx?Id=1834'],['Income Tax Department TCS overview','https://www.incometaxindia.gov.in/w/tax-collection-at-source-tcs-'],['James Realty India buyer guide','https://jamesrealty.uk/dubai-property-investment-indian-buyers/']],
    countryDefault:'India',currency:'INR / AED',
  },
  {
    slug:'ar',theme:'ar',host:'dubaiproperty.jamesrealty.uk',lang:'ar-AE',dir:'rtl',layout:'cinema',
    title:'عقارات دبي | شقق وفلل ومشاريع قيد الإنشاء',description:'استشارة عقارية مستقلة باللغة العربية لمقارنة عقارات دبي الجاهزة وقيد الإنشاء، مع توضيح التكاليف وخطط السداد وإجراءات التحقق.',
    image:'arabic-dubai-waterfront-property.webp',imageAlt:'مساكن فاخرة على الواجهة البحرية في دبي مع إطلالة على برج خليفة',
    kicker:'استشارات عقارية مستقلة في دبي',h1:'قرار عقاري واضح، من أول رقم إلى آخر وثيقة.',heroText:'تجربة عربية احترافية تساعدك على مقارنة المشاريع والمناطق والوحدات المتاحة وفق الميزانية والهدف الاستثماري، بعيداً عن الوعود العامة.',heroProof:['مقارنة وحدات فعلية','تحقق من الأسعار الحالية','شرح واضح للتكاليف'],primary:'احصل على الخيارات الحالية',secondary:'ابدأ المقارنة',
    nav:[['خيارات العقار','projects'],['المناطق','locations'],['منهج الاستثمار','why-invest'],['تواصل معنا','enquire']],
    bar:[['شقق جاهزة','بيانات إيجار ومعاينة'],['عقارات قيد الإنشاء','دفعات مرتبطة بالبناء'],['فلل وتاون هاوس','طلب عائلي طويل الأجل'],['جيمس ريالتي','استشارة مستقلة']],
    projectsTitle:'اختر نوع العقار قبل اختيار اسم المشروع',projectsIntro:'الهدف والميزانية ومدة الاحتفاظ وطريقة الإدارة تحدد ما إذا كان العقار الجاهز أو قيد الإنشاء أو المنزل العائلي هو الأنسب.',
    projects:[
      {meta:'دخل محتمل · عقار جاهز',name:'شقة جاهزة',desc:'يمكن معاينة الوحدة ومراجعة الإيجارات الفعلية ورسوم الخدمات وحالة المبنى قبل الشراء.',facts:['معاينة فعلية','بيانات إيجار قائمة','إدارة وتشغيل مبكر'],price:'ميزانية شاملة',priceNote:'السعر والرسوم والتأثيث',source:'https://jamesrealty.uk/dubai-rental-yield-calculator/'},
      {meta:'دفعات مرحلية · مشروع جديد',name:'عقار قيد الإنشاء',desc:'قد تساعد خطة السداد على توزيع التدفقات النقدية، مع ضرورة مراجعة التسجيل وحساب الضمان والعقد ومخاطر الإنجاز.',facts:['خطة سداد مؤرخة','تحقق من المطور والمشروع','لا توجد عوائد مضمونة'],price:'اطلب السعر الحالي',priceNote:'لوحدة محددة ومتاحة',source:'https://jamesrealty.uk/off-plan-vs-ready-property-dubai/'},
      {meta:'سكن عائلي · كثافة أقل',name:'فيلا أو تاون هاوس',desc:'خيار مناسب للعائلات أو الإيجار طويل الأجل، مع تكاليف شراء وصيانة أعلى واختلاف كبير بين المجتمعات.',facts:['اختيار المجتمع','فحص الأرض والحالة','دراسة طلب العائلات'],price:'قارن التكلفة الكاملة',priceNote:'بما في ذلك الصيانة',source:'https://jamesrealty.uk/best-dubai-communities-by-budget/'},
    ],
    lensTitle:'لماذا دبي؟ وما الذي يجب التحقق منه؟',lensText:'تتيح دبي تملك الأجانب في مناطق محددة بنظام التملك الحر، وتوفر سوقاً متنوعاً من الوحدات الجاهزة وقيد الإنشاء. لكن القرار يحتاج إلى مقارنة الوحدة والتكاليف والطلب والعرض والمخاطر.',
    lenses:[['التملك القانوني','تحقق من نوع الملكية والمشروع والمنطقة وإجراءات التسجيل للوحدة المحددة.'],['التكلفة الإجمالية','أضف رسوم التسجيل والوساطة والتمويل والتأثيث ورسوم الخدمات.'],['العائد الواقعي','استخدم إيجارات مقارنة ومعدل شغور وتكاليف تشغيل؛ لا تعتمد على عائد إعلاني.'],['الإقامة','شراء العقار لا يعني تلقائياً الحصول على الإقامة؛ لكل مسار شروط وموافقة رسمية.']],
    asides:[['باللغة العربية','شرح طبيعي ومباشر.'],['دون مبالغة','لا نضمن العائد أو الزيادة.']],
    routeTitle:'مناطق دبي حسب نوع الطلب',routeText:'لا توجد منطقة واحدة هي الأفضل للجميع. تختلف المناطق المركزية والواجهات البحرية والمجتمعات العائلية من حيث السعر والسيولة والطلب والمشاريع المستقبلية.',
    route:[['مناطق مركزية','شقق مع بيانات معاملات وإيجارات أعمق واختلاف واضح بين المباني.'],['واجهات بحرية','علاوة سعرية تحتاج إلى تحقق من الإطلالة والوصول والتكاليف.'],['مجتمعات عائلية','فلل وتاون هاوس مع طلب طويل الأجل وصيانة وإدارة أكبر.']],
    journeyTitle:'من الطلب الأول إلى قرار موثق',journey:[['01','حدد الهدف','سكن أو دخل أو نمو، مع ميزانية ومدة احتفاظ.'],['02','قارن السوق','المنطقة والمشروع والوحدة والتكاليف والبدائل.'],['03','تحقق من الوثائق','السعر وخطة السداد والتسجيل والحساب المستلم.'],['04','نفّذ بوعي','بعد مراجعة العقد والاستعانة بالمختصين عند الحاجة.']],
    formTitle:'احصل على ترشيحات عقارية مناسبة لهدفك.',formText:'أرسل الميزانية ونوع العقار والمنطقة المفضلة. سيقارن جيمس الخيارات الحالية ويشرح الفروق وخطوات التحقق باللغة العربية.',formIntro:'مرحباً جيمس، أريد ترشيحات حالية لعقارات دبي باللغة العربية.',
    faq:[['هل يستطيع الأجنبي شراء عقار في دبي؟','يمكن للأجانب تملك العقارات المؤهلة في مناطق التملك الحر المحددة، مع ضرورة التحقق من الوحدة ونوع الملكية وإجراءات التسجيل.'],['ما الأفضل: الجاهز أم قيد الإنشاء؟','العقار الجاهز يتيح المعاينة ومراجعة الإيجار، بينما قد يوزع العقار قيد الإنشاء الدفعات لكنه يضيف مخاطر الإنجاز والعقد والعرض المستقبلي.'],['ما رسوم شراء العقار؟','تختلف حسب الصفقة وقد تشمل التسجيل والوساطة ومركز الأمناء والتمويل والتقييم والتأثيث. اطلب كشفاً محدثاً للوحدة.'],['هل توجد عوائد إيجارية مضمونة؟','لا. الإيجار والشغور والقيمة وتكاليف التشغيل تتغير، ويجب بناء سيناريو واقعي ومحافظ.'],['هل شراء العقار يمنح الإقامة؟','ليس تلقائياً. توجد مسارات إقامة مرتبطة بشروط قيمة وأهلية ووثائق وموافقة الجهات المختصة.']],
    sources:[['دائرة الأراضي والأملاك — تسجيل البيع','https://dubailand.gov.ae/ar/eservices/property-sale-registration/'],['دائرة الأراضي والأملاك في دبي','https://dubailand.gov.ae/ar/'],['بيانات سوق دبي من جيمس ريالتي','https://jamesrealty.uk/dubai-data/']],
    countryDefault:'الإمارات العربية المتحدة',currency:'درهم إماراتي',arabic:true,
  }
);

// International pages are appended after the developer configuration above, so
// apply the shared enhancement layer only once the full page collection exists.
for (const page of pages) {
  Object.assign(page, enhancements[page.slug]);
  if (currentProjectOverrides[page.slug]) page.projects = currentProjectOverrides[page.slug];
}

function escapeHtml(value='') {
  return String(value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
}

function schemaFor(page) {
  const canonical = `https://${page.host}/`;
  return {
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:page.title,description:page.description,inLanguage:page.lang,dateModified:'2026-08-17',isPartOf:{'@id':'https://jamesrealty.uk/#website'},mainEntity:{'@id':`${canonical}#service`}},
      {'@type':'Service','@id':`${canonical}#service`,name:page.arabic?'استشارات عقارية مستقلة في دبي':`${page.theme[0].toUpperCase()+page.theme.slice(1)} property advisory`,description:page.description,provider:{'@type':'RealEstateAgent',name:'James Realty',url:'https://jamesrealty.uk/',telephone:'+971528420933',image:'https://jamesrealty.uk/james-ravi-profile.jpg'},areaServed:{'@type':'Country',name:'United Arab Emirates'},audience:{'@type':'Audience',audienceType:page.kicker},url:canonical},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'James Realty',item:'https://jamesrealty.uk/'},{'@type':'ListItem',position:2,name:page.title,item:canonical}]},
      {'@type':'FAQPage',mainEntity:page.faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
    ],
  };
}

function head(page) {
  const canonical = `https://${page.host}/`;
  const image = `https://jamesrealty.uk/images/landing/${page.image}`;
  return `<!doctype html><html lang="${page.lang}"${page.dir?` dir="${page.dir}"`:''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${escapeHtml(page.title)}</title><meta name="description" content="${escapeHtml(page.description)}">
<meta name="robots" content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${canonical}"><link rel="icon" href="https://jamesrealty.uk/favicon.svg" type="image/svg+xml">
<link rel="preload" as="image" href="${image}" fetchpriority="high"><link rel="stylesheet" href="https://jamesrealty.uk/assets/landing-experience.css?v=3">
<meta property="og:type" content="website"><meta property="og:site_name" content="James Realty"><meta property="og:locale" content="${page.lang.replace('-','_')}">
<meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(page.title)}"><meta name="twitter:description" content="${escapeHtml(page.description)}"><meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(schemaFor(page)).replace(/</g,'\\u003c')}</script>
<script>window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'landing_view',landing_page:${JSON.stringify(page.title)},landing_host:${JSON.stringify(page.host)},landing_audience:${JSON.stringify(page.kicker)}});</script>
<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-M74SL57L"></script>
</head>`;
}

function nav(page) {
  const links = page.nav.map(([label,id])=>`<a href="#${id}">${escapeHtml(label)}</a>`).join('');
  return `<a class="skip-link" href="#content">${page.arabic?'انتقل إلى المحتوى':'Skip to content'}</a>
<nav class="jr-nav" aria-label="${page.arabic?'التنقل في الصفحة':'Landing page'}"><div class="jr-shell jr-nav__inner">
<a class="jr-brand" href="https://jamesrealty.uk/" aria-label="James Realty"><span class="jr-brand__mark">JR</span><span><strong>James Realty</strong><small>${page.arabic?'استشارات مستقلة':'Independent property advisory'}</small></span></a>
<div class="jr-nav__links" id="landing-menu">${links}</div><a class="jr-button jr-button--small jr-nav__cta" data-cta="nav" data-location="navigation" href="#enquire">${escapeHtml(page.primary)}</a>
<button class="jr-menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="landing-menu">${page.arabic?'القائمة':'Menu'}</button>
</div></nav>`;
}

function hero(page) {
  const image = `https://jamesrealty.uk/images/landing/${page.image}`;
  const layoutClass = page.layout==='cinema'?'':` jr-hero--${page.layout}`;
  const imageEl = `<img class="jr-hero__image" src="${image}" width="1600" height="900" alt="${escapeHtml(page.imageAlt)}" fetchpriority="high" decoding="async">`;
  const proof = page.heroProof.map(item=>`<li>${escapeHtml(item)}</li>`).join('');
  const copy = `<div class="jr-hero__copy" data-reveal><p class="jr-kicker">${escapeHtml(page.kicker)}</p><h1 class="jr-display">${escapeHtml(page.h1)}</h1><p>${escapeHtml(page.heroText)}</p><div class="jr-actions"><a class="jr-button jr-button--light" data-cta="hero-primary" data-location="hero" href="#enquire">${escapeHtml(page.primary)}</a><a class="jr-button jr-button--ghost" data-cta="hero-secondary" data-location="hero" href="#projects">${escapeHtml(page.secondary)}</a></div><ul class="jr-hero__proof">${proof}</ul></div>`;
  if (page.layout==='split') return `<section class="jr-hero jr-hero--split"><div class="jr-hero__inner">${copy}</div><figure class="jr-hero__media">${imageEl}</figure></section>`;
  return `<section class="jr-hero${layoutClass}">${imageEl}<div class="jr-shell jr-hero__inner">${copy}</div></section>`;
}

function proofBar(page) {
  return `<section class="jr-bar" aria-label="${page.arabic?'نظرة سريعة':'At a glance'}"><div class="jr-shell jr-bar__grid">${page.bar.map(([a,b])=>`<article><strong>${escapeHtml(a)}</strong><span>${escapeHtml(b)}</span></article>`).join('')}</div></section>`;
}

function projects(page) {
  return `<section class="jr-section" id="projects"><div class="jr-shell"><header class="jr-heading" data-reveal><h2 class="jr-display">${escapeHtml(page.projectsTitle)}</h2><p>${escapeHtml(page.projectsIntro)}</p></header><div class="jr-projects">${page.projects.map(project=>`<article class="jr-project" data-reveal><span class="jr-project__meta">${escapeHtml(project.meta)}</span><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.desc)}</p><ul class="jr-project__facts">${project.facts.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul><div class="jr-project__bottom"><span class="jr-project__price"><strong>${escapeHtml(project.price)}</strong><span>${escapeHtml(project.priceNote)}</span></span><a class="jr-project__link" href="${project.source}" target="_blank" rel="noopener noreferrer">${page.arabic?'المصدر ↗':'Verify source ↗'}</a></div></article>`).join('')}</div></div></section>`;
}

function lens(page) {
  return `<section class="jr-section jr-section--tint" id="why-invest"><div class="jr-shell jr-lens"><div class="jr-lens__main" data-reveal><p class="jr-kicker">${page.arabic?'منهج القرار':'Investor decision lens'}</p><h2 class="jr-display">${escapeHtml(page.lensTitle)}</h2><p class="jr-muted">${escapeHtml(page.lensText)}</p><div class="jr-lens__grid">${page.lenses.map(([a,b])=>`<article><strong>${escapeHtml(a)}</strong><p>${escapeHtml(b)}</p></article>`).join('')}</div></div><aside class="jr-lens__aside">${page.asides.map(([a,b])=>`<article data-reveal><strong>${escapeHtml(a)}</strong><span>${escapeHtml(b)}</span></article>`).join('')}</aside></div></section>`;
}

function route(page) {
  return `<section class="jr-section" id="locations"><div class="jr-shell jr-route"><div class="jr-route__map" data-reveal><p class="jr-kicker">${page.arabic?'خريطة الاختيار':'Location and use map'}</p><h2 class="jr-display">${escapeHtml(page.routeTitle)}</h2><p class="jr-muted">${escapeHtml(page.routeText)}</p></div><div class="jr-route__list">${page.route.map(([a,b])=>`<article data-reveal><strong>${escapeHtml(a)}</strong><p>${escapeHtml(b)}</p></article>`).join('')}</div></div></section>`;
}

function journey(page) {
  return `<section class="jr-section jr-section--dark" id="process"><div class="jr-shell"><header class="jr-heading jr-heading--stack" data-reveal><p class="jr-kicker">${page.arabic?'خطوات واضحة':'A controlled buying path'}</p><h2 class="jr-display">${escapeHtml(page.journeyTitle)}</h2></header><div class="jr-journey">${page.journey.map(([n,a,b])=>`<article class="jr-step" data-reveal><span>${n}</span><h3>${escapeHtml(a)}</h3><p>${escapeHtml(b)}</p></article>`).join('')}</div></div></section>`;
}

function form(page) {
  const labels = page.arabic ? {name:'الاسم',email:'البريد الإلكتروني',phone:'رقم الهاتف أو واتساب',country:'الدولة',budget:'الميزانية',pref:'نوع العقار',notes:'ما الذي تبحث عنه؟',consent:'أوافق على أن يتواصل معي جيمس ريالتي بخصوص هذا الطلب. لن تتم مشاركة بياناتي مع أطراف غير ضرورية.',submit:'إرسال الطلب عبر واتساب',select:'اختر'} : {name:'Name',email:'Email',phone:'Phone / WhatsApp',country:'Country',budget:'Investment budget',pref:'Property preference',notes:'What should James know?',consent:'I agree that James Realty may contact me about this enquiry. My details will not be sold or shared with unrelated parties.',submit:'Send request via WhatsApp',select:'Select'};
  const countryOptions = [page.countryDefault,'United Arab Emirates','United Kingdom','United States','India','Saudi Arabia','Qatar','Kuwait','Other'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
  const budgetOptions = page.arabic?['أقل من مليون درهم','1–2 مليون درهم','2–5 ملايين درهم','5–10 ملايين درهم','أكثر من 10 ملايين درهم']:['Below AED 1 million','AED 1–2 million','AED 2–5 million','AED 5–10 million','Above AED 10 million'];
  const prefOptions = page.arabic?['شقة جاهزة','عقار قيد الإنشاء','تاون هاوس','فيلا','عقار فاخر أو بعلامة تجارية']:['Ready apartment','Off-plan apartment','Townhouse','Villa','Branded or luxury residence'];
  return `<section class="jr-section jr-form-section" id="enquire"><div class="jr-shell jr-form-wrap"><div class="jr-form-copy" data-reveal><p class="jr-kicker">${page.arabic?'ابدأ المحادثة':'Private advisory enquiry'}</p><h2 class="jr-display">${escapeHtml(page.formTitle)}</h2><p>${escapeHtml(page.formText)}</p><div class="jr-contact"><a data-location="form" href="${WA}">${page.arabic?'واتساب':'WhatsApp'} · ${PHONE}</a><a data-location="form" href="tel:+971528420933">${page.arabic?'اتصال مباشر':'Call'} · ${PHONE}</a></div></div>
<form class="jr-form" id="landing-enquiry" data-whatsapp-landing data-page="${escapeHtml(page.title)}" data-intro="${escapeHtml(page.formIntro)}" data-opening="${page.arabic?'جارٍ فتح واتساب…':'Opening WhatsApp…'}">
<label>${labels.name}<input name="name" data-label="${labels.name}" autocomplete="name" required></label><label>${labels.email}<input type="email" name="email" data-label="${labels.email}" autocomplete="email" required></label>
<label>${labels.phone}<input type="tel" name="phone" data-label="${labels.phone}" autocomplete="tel" inputmode="tel" required></label><label>${labels.country}<select name="country" data-label="${labels.country}" required><option value="">${labels.select}</option>${countryOptions.map(v=>`<option${v===page.countryDefault?' selected':''}>${escapeHtml(v)}</option>`).join('')}</select></label>
<label>${labels.budget}<select name="budget" data-label="${labels.budget}" required><option value="">${labels.select}</option>${budgetOptions.map(v=>`<option>${escapeHtml(v)}</option>`).join('')}</select></label><label>${labels.pref}<select name="preference" data-label="${labels.pref}"><option value="">${labels.select}</option>${prefOptions.map(v=>`<option>${escapeHtml(v)}</option>`).join('')}</select></label>
<label class="full">${labels.notes}<textarea name="notes" data-label="${labels.notes}" maxlength="600"></textarea></label><label class="full jr-consent"><input type="checkbox" name="consent" required><span>${labels.consent}</span></label>
<div class="full"><button class="jr-button jr-button--light" type="submit">${labels.submit}</button><span class="jr-form__status" data-form-status aria-live="polite"></span></div><p class="full jr-form__note">${page.arabic?'يحوّل النموذج طلبك إلى رسالة واتساب جاهزة للمراجعة قبل الإرسال. يتم تأكيد الأسعار والتوفر وخطط السداد قبل تقديم أي توصية.':'The form prepares your enquiry as a WhatsApp message for review before you send it. Current prices, availability and payment plans are reconfirmed before any recommendation.'}</p>
</form></div></section>`;
}

function faq(page) {
  const sourceLabel = page.arabic?'المصادر الرسمية المستخدمة':'Official sources and supporting guides';
  const disclaimer = page.arabic?'تمت مراجعة المعلومات في 17 أغسطس 2026. قد تتغير الأسعار وخطط السداد والتوفر ومواعيد الإنجاز والأنظمة وشروط الإقامة. اطلب مستندات حديثة للوحدة قبل الاعتماد عليها. المعلومات عامة وليست استشارة قانونية أو ضريبية أو مالية أو استثمارية.':VERIFIED;
  return `<section class="jr-section" id="faq"><div class="jr-shell"><div class="jr-faq"><header data-reveal><p class="jr-kicker">FAQ</p><h2 class="jr-display">${page.arabic?'أسئلة المستثمرين':'Questions investors ask before reserving'}</h2></header><div>${page.faq.map(([q,a])=>`<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}</div></div><details class="jr-sources"><summary>${sourceLabel}</summary><ul>${page.sources.map(([a,b])=>`<li><a href="${b}" target="_blank" rel="noopener noreferrer">${escapeHtml(a)} ↗</a></li>`).join('')}</ul><p>${escapeHtml(disclaimer)}</p></details></div></section>`;
}

function footer(page) {
  return `<footer class="jr-footer"><div class="jr-shell jr-footer__inner"><p>${page.arabic?'جيمس ريالتي جهة استشارية مستقلة وليست الموقع الرسمي لأي مطور. جميع أسماء المطورين والمشاريع تعود إلى أصحابها وتستخدم للتعريف فقط.':'James Realty is an independent advisory service and is not the official website of any featured developer. Developer and project names remain the property of their respective owners and are used for identification only.'}</p><a href="https://jamesrealty.uk/about-me/">${page.arabic?'تعرف على جيمس رافي':'About James Ravi'} ↗</a></div></footer><div class="jr-mobile-cta"><a class="jr-button" data-cta="mobile-form" data-location="mobile-sticky" href="#enquire">${page.arabic?'أرسل طلبك':'Request options'}</a><a class="jr-button jr-button--ghost" data-location="mobile-sticky" href="${WA}">${page.arabic?'واتساب':'WhatsApp'}</a></div>`;
}

function render(page) {
  const orderByTheme = {
    emaar:['projects','route','lens','journey'],aldar:['route','projects','lens','journey'],damac:['projects','lens','route','journey'],binghatti:['projects','route','lens','journey'],nakheel:['route','projects','lens','journey'],mudon:['route','projects','lens','journey'],
    uk:['lens','projects','route','journey'],usa:['projects','lens','route','journey'],india:['route','lens','projects','journey'],ar:['projects','route','lens','journey'],
  };
  const sections = {projects:()=>projects(page),lens:()=>lens(page),route:()=>route(page),journey:()=>journey(page)};
  const main = orderByTheme[page.theme].map(name=>sections[name]()).join('');
  return `${head(page)}<body class="theme-${page.theme}" data-page="${escapeHtml(page.title)}">${nav(page)}<main id="content">${hero(page)}${proofBar(page)}${main}${form(page)}${faq(page)}</main>${footer(page)}<script src="https://jamesrealty.uk/assets/landing-experience.js?v=3" defer></script></body></html>\n`;
}

function schemaV4(page) {
  const canonical = `https://${page.host}/`;
  return {
    '@context':'https://schema.org',
    '@graph':[
      {'@type':'WebPage','@id':`${canonical}#webpage`,url:canonical,name:page.title,description:page.description,inLanguage:page.lang,dateModified:'2026-08-17',isPartOf:{'@id':'https://jamesrealty.uk/#website'},mainEntity:{'@id':`${canonical}#service`}},
      {'@type':'RealEstateAgent','@id':'https://jamesrealty.uk/#organization',name:'James Realty',url:'https://jamesrealty.uk/',telephone:'+971528420933',image:'https://jamesrealty.uk/james-ravi-profile.jpg',areaServed:[{'@type':'Country','name':'United Arab Emirates'},{'@type':'City','name':'Dubai'},{'@type':'City','name':'Abu Dhabi'}]},
      {'@type':'Service','@id':`${canonical}#service`,name:page.arabic?'استشارات عقارية مستقلة في دبي':`${page.theme[0].toUpperCase()+page.theme.slice(1)} property advisory`,description:page.description,provider:{'@id':'https://jamesrealty.uk/#organization'},audience:{'@type':'Audience',audienceType:page.kicker},url:canonical},
      {'@type':'ItemList','@id':`${canonical}#projects`,name:page.projectsTitle,itemListElement:page.projects.map((project,index)=>({'@type':'ListItem',position:index+1,url:project.source,name:project.name}))},
      {'@type':'FAQPage','mainEntity':page.faq.map(([question,answer])=>({'@type':'Question',name:question,acceptedAnswer:{'@type':'Answer',text:answer}}))},
    ],
  };
}

function headV4(page) {
  const canonical = `https://${page.host}/`;
  const image = `https://jamesrealty.uk/images/landing/${page.image}`;
  const locale = page.lang.replace('-','_');
  return `<!doctype html><html lang="${page.lang}"${page.dir?` dir="${page.dir}"`:''}><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#111411">
<title>${escapeHtml(page.title)}</title><meta name="description" content="${escapeHtml(page.description)}"><meta name="robots" content="noindex,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${canonical}"><link rel="icon" href="https://jamesrealty.uk/favicon.svg" type="image/svg+xml"><link rel="preload" as="image" href="${image}" fetchpriority="high"><link rel="stylesheet" href="https://jamesrealty.uk/assets/landing-experience.css?v=5">
<meta property="og:type" content="website"><meta property="og:site_name" content="James Realty"><meta property="og:locale" content="${locale}"><meta property="og:title" content="${escapeHtml(page.title)}"><meta property="og:description" content="${escapeHtml(page.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${image}"><meta property="og:image:alt" content="${escapeHtml(page.imageAlt)}">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(page.title)}"><meta name="twitter:description" content="${escapeHtml(page.description)}"><meta name="twitter:image" content="${image}">
<script type="application/ld+json">${JSON.stringify(schemaV4(page)).replace(/</g,'\\u003c')}</script><script>window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'landing_view',landing_page:${JSON.stringify(page.title)},landing_host:${JSON.stringify(page.host)},landing_audience:${JSON.stringify(page.kicker)},experience_version:'v4'});</script><script async src="https://www.googletagmanager.com/gtm.js?id=GTM-M74SL57L"></script>
</head>`;
}

function navV4(page) {
  const links = page.nav.map(([label,id])=>`<a href="#${id}">${escapeHtml(label)}</a>`).join('');
  return `<a class="skip-link" href="#content">${page.arabic?'انتقل إلى المحتوى':'Skip to content'}</a><nav class="jr-nav" aria-label="${page.arabic?'التنقل في الصفحة':'Landing page navigation'}"><div class="jr-shell jr-nav__inner"><a class="jr-brand" href="https://jamesrealty.uk/" aria-label="James Realty"><span class="jr-brand__mark">JR</span><span><strong>James Realty</strong><small>${page.arabic?'استشارات عقارية مستقلة':'Independent property advisory'}</small></span></a><div class="jr-nav__links" id="landing-menu">${links}</div><a class="jr-button jr-button--small jr-nav__cta" data-cta="nav" data-location="navigation" href="#enquire">${escapeHtml(page.primary)}</a><button class="jr-menu-toggle" type="button" data-menu-toggle aria-expanded="false" aria-controls="landing-menu">${page.arabic?'القائمة':'Menu'}</button></div></nav>`;
}

function heroV4(page) {
  const image = `https://jamesrealty.uk/images/landing/${page.image}`;
  const proof = page.heroProof.map(item=>`<li>${escapeHtml(item)}</li>`).join('');
  return `<section class="jr-hero jr-hero--${page.heroMode}" aria-labelledby="hero-title"><figure class="jr-hero__media"><img class="jr-hero__image" src="${image}" width="1600" height="900" alt="${escapeHtml(page.imageAlt)}" fetchpriority="high" decoding="async"><span class="jr-hero__wash"></span></figure><div class="jr-shell jr-hero__inner"><div class="jr-hero__copy" data-reveal><p class="jr-kicker">${escapeHtml(page.kicker)}</p><h1 class="jr-display" id="hero-title">${escapeHtml(page.h1)}</h1><p class="jr-hero__lead">${escapeHtml(page.heroText)}</p><div class="jr-actions"><a class="jr-button jr-button--light" data-cta="hero-primary" data-location="hero" href="#enquire">${escapeHtml(page.primary)}</a><a class="jr-text-link" data-cta="hero-secondary" data-location="hero" href="#projects">${escapeHtml(page.secondary)} <span aria-hidden="true">↘</span></a></div><ul class="jr-hero__proof">${proof}</ul></div><p class="jr-hero__independent">${page.arabic?'صفحة استشارية مستقلة من جيمس ريالتي — وليست الموقع الرسمي للمطور.':'Independent James Realty advisory — not the developer’s official website.'}</p></div></section>`;
}

function proofV4(page) {
  return `<section class="jr-facts" aria-label="${page.arabic?'نظرة سريعة':'At a glance'}"><div class="jr-shell jr-facts__track">${page.bar.map(([a,b],index)=>`<article><span>0${index+1}</span><strong>${escapeHtml(a)}</strong><small>${escapeHtml(b)}</small></article>`).join('')}</div></section>`;
}

function projectCardsV4(page) {
  const note = page.arabic?'صورة توضيحية من جيمس ريالتي — ليست تصميماً رسمياً للمشروع':'James Realty advisory visual — not an official project render';
  return `<section class="jr-section jr-project-section" id="projects"><div class="jr-shell"><header class="jr-heading" data-reveal><p class="jr-kicker">${page.arabic?'خيارات حالية':'Current opportunity edit'}</p><h2 class="jr-display">${escapeHtml(page.projectsTitle)}</h2><p>${escapeHtml(page.projectsIntro)}</p></header><div class="jr-projects">${page.projects.map((project,index)=>`<article class="jr-project" data-reveal data-project-card="${escapeHtml(project.name)}"><figure><img src="https://jamesrealty.uk/images/${page.theme==='uk'||page.theme==='usa'||page.theme==='india'||page.theme==='ar'?'investors':'projects'}/${page.projectImages[index]}" width="${page.theme==='uk'||page.theme==='usa'||page.theme==='india'||page.theme==='ar'?'430':'724'}" height="${page.theme==='uk'||page.theme==='usa'||page.theme==='india'||page.theme==='ar'?'600':'543'}" loading="lazy" decoding="async" alt="${escapeHtml(page.projectAlts[index])}"><figcaption>${note}</figcaption></figure><div class="jr-project__body"><span class="jr-project__meta">${escapeHtml(project.meta)}</span><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.desc)}</p><ul>${project.facts.map(f=>`<li>${escapeHtml(f)}</li>`).join('')}</ul><div class="jr-project__bottom"><span><strong>${escapeHtml(project.price)}</strong><small>${escapeHtml(project.priceNote)}</small></span><a class="jr-project__source" data-source-link href="${project.source}" target="_blank" rel="noopener noreferrer">${page.arabic?'تحقق من المصدر':'Verify facts'} ↗</a></div><a class="jr-project__cta" href="#enquire" data-project-select="${escapeHtml(project.name)}">${page.arabic?'اطلب الوحدات المتاحة':'Request current units'} <span aria-hidden="true">→</span></a></div></article>`).join('')}</div></div></section>`;
}

function signatureV4(page) {
  if (!page.signature) return '';
  const [title,...items] = page.signature;
  const cards=[];
  for(let i=0;i<items.length;i+=2) cards.push(`<article data-reveal><span>0${cards.length+1}</span><h3>${escapeHtml(items[i])}</h3><p>${escapeHtml(items[i+1])}</p></article>`);
  return `<section class="jr-section jr-signature" id="overview"><div class="jr-shell"><header class="jr-heading jr-heading--compact"><p class="jr-kicker">${page.arabic?'نظرة على السوق':'A distinct way to explore'}</p><h2 class="jr-display">${escapeHtml(title)}</h2></header><div class="jr-signature__grid">${cards.join('')}</div></div></section>`;
}

function mapV4(page) {
  const {lat,lon,bbox}=page.map;
  const mapUrl=`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lon}`;
  return `<section class="jr-section jr-map-section" id="locations"><div class="jr-shell jr-map"><div class="jr-map__copy" data-reveal><p class="jr-kicker">${page.arabic?'الموقع والاتصال':'Location, demand and access'}</p><h2 class="jr-display">${escapeHtml(page.routeTitle)}</h2><p>${escapeHtml(page.routeText)}</p><div class="jr-map__list">${page.route.map(([a,b])=>`<article><strong>${escapeHtml(a)}</strong><p>${escapeHtml(b)}</p></article>`).join('')}</div></div><figure class="jr-map__frame" data-reveal><iframe title="${page.arabic?'خريطة موقع العقار':'Property location map'}" src="${mapUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><figcaption><span>${page.arabic?'خريطة جغرافية تفاعلية — الموقع تقريبي للمجتمع':'Interactive geographic map — community-level marker'}</span><a data-map-action href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}" target="_blank" rel="noopener noreferrer">${page.arabic?'فتح الخريطة':'Open map'} ↗</a></figcaption></figure></div></section>`;
}

function lensV4(page) {
  return `<section class="jr-section jr-lens-section" id="why-invest"><div class="jr-shell jr-lens"><header data-reveal><p class="jr-kicker">${page.arabic?'منهج القرار':'Investor decision lens'}</p><h2 class="jr-display">${escapeHtml(page.lensTitle)}</h2><p>${escapeHtml(page.lensText)}</p></header><div class="jr-lens__grid">${page.lenses.map(([a,b],index)=>`<article data-reveal><span class="jr-lens__bar" style="--score:${62+index*8}%"></span><strong>${escapeHtml(a)}</strong><p>${escapeHtml(b)}</p></article>`).join('')}</div><aside class="jr-lens__aside">${page.asides.map(([a,b])=>`<p><strong>${escapeHtml(a)}</strong><span>${escapeHtml(b)}</span></p>`).join('')}</aside></div></section>`;
}

function journeyV4(page) {
  return `<section class="jr-section jr-process" id="process"><div class="jr-shell"><header class="jr-heading jr-heading--compact" data-reveal><p class="jr-kicker">${page.arabic?'خطوات واضحة':'A controlled buying path'}</p><h2 class="jr-display">${escapeHtml(page.journeyTitle)}</h2></header><ol class="jr-process__rail">${page.journey.map(([n,a,b])=>`<li data-reveal><span>${n}</span><div><h3>${escapeHtml(a)}</h3><p>${escapeHtml(b)}</p></div></li>`).join('')}</ol></div></section>`;
}

function matrixV4(page) {
  if(page.theme!=='binghatti') return '';
  return `<section class="jr-section jr-matrix" id="comparison"><div class="jr-shell"><header class="jr-heading jr-heading--compact"><p class="jr-kicker">Investor comparison</p><h2 class="jr-display">Three products. Three different tests.</h2></header><div class="jr-table-wrap"><table><thead><tr><th>Decision factor</th><th>Wraith</th><th>Tilal</th><th>Skyflame</th></tr></thead><tbody><tr><th>Format</th><td>Urban apartments</td><td>Large villas</td><td>Value apartments</td></tr><tr><th>Primary test</th><td>Layout + local supply</td><td>Community delivery</td><td>Pipeline + rent evidence</td></tr><tr><th>Capital profile</th><td>Mid-ticket</td><td>High concentration</td><td>Lower entry</td></tr></tbody></table></div></div></section>`;
}

function dayV4(page) {
  if(page.theme!=='mudon') return '';
  return `<section class="jr-section jr-day" id="lifestyle"><div class="jr-shell"><header class="jr-heading jr-heading--compact"><p class="jr-kicker">Use the community</p><h2 class="jr-display">Test Mudon across a real day.</h2></header><div class="jr-day__rail"><article><time>07:30</time><strong>School and work</strong><p>Drive the actual route in peak traffic.</p></article><article><time>16:00</time><strong>Park and pool</strong><p>Check shade, access and everyday movement.</p></article><article><time>19:30</time><strong>Retail and return</strong><p>Review convenience after the commute.</p></article></div></div></section>`;
}

function currencyV4(page) {
  if(!['uk','india'].includes(page.theme)) return '';
  const uk=page.theme==='uk';
  return `<section class="jr-section jr-tool-section" id="currency"><div class="jr-shell jr-tool" data-currency-tool data-currency="${uk?'GBP':'INR'}"><div><p class="jr-kicker">${uk?'GBP / AED planning tool':'INR / AED payment tool'}</p><h2 class="jr-display">${uk?'See the budget in both currencies.':'Map the full rupee commitment.'}</h2><p>${uk?'Use an editable planning rate across price, fees and future instalments.':'Use an editable planning rate before aligning instalments with your bank and LRS calendar.'}</p></div><form><label>Property price (AED)<input name="aed" type="number" min="0" step="1000" value="1000000" inputmode="decimal"></label><label>${uk?'Planning rate (GBP per AED)':'Planning rate (INR per AED)'}<input name="rate" type="number" min="0" step="0.001" value="${uk?'0.20':'23.50'}" inputmode="decimal"></label><output data-currency-output aria-live="polite">—</output><small>Editable planning rate only; not a live foreign-exchange quote. Your bank’s rate and charges may differ.</small></form></div></section>`;
}

function underwritingV4(page) {
  if(page.theme!=='usa') return '';
  return `<section class="jr-section jr-tool-section" id="underwriting"><div class="jr-shell jr-tool" data-underwriting-tool><div><p class="jr-kicker">USD investor underwriting</p><h2 class="jr-display">Model the operating case—not the headline yield.</h2><p>Change the rent, occupancy and annual ownership costs. The output is a scenario, not a forecast.</p></div><form><label>Purchase price (AED)<input name="price" type="number" value="2000000" min="1" step="10000"></label><label>Monthly rent (AED)<input name="rent" type="number" value="12000" min="0" step="500"></label><label>Occupancy (%)<input name="occupancy" type="number" value="92" min="0" max="100"></label><label>Annual costs (AED)<input name="costs" type="number" value="30000" min="0" step="1000"></label><output data-underwriting-output aria-live="polite">—</output><small>Illustrative only. Excludes financing, transaction costs, tax, currency movement and future price changes.</small></form></div></section>`;
}

function marketModuleV4(page,name) {
  if(name==='costs' && ['uk','usa'].includes(page.theme)) return `<section class="jr-section jr-costs" id="costs"><div class="jr-shell"><header class="jr-heading jr-heading--compact"><p class="jr-kicker">Total acquisition view</p><h2 class="jr-display">Price is only the first line.</h2></header><div class="jr-costs__stack"><article><span>01</span><strong>Property price</strong><p>Exact unit and dated offer.</p></article><article><span>02</span><strong>Transaction costs</strong><p>Registration, agency, trustee, finance and professional charges as applicable.</p></article><article><span>03</span><strong>Completion capital</strong><p>Final payment, furnishing, snagging and reserve.</p></article><article><span>04</span><strong>Annual operation</strong><p>Service charges, management, maintenance, vacancy and compliance.</p></article></div></div></section>`;
  if(name==='payment' && page.theme==='india') return `<section class="jr-section jr-payment" id="payment"><div class="jr-shell"><header class="jr-heading jr-heading--compact"><p class="jr-kicker">INR / AED payment calendar</p><h2 class="jr-display">Make the bank path visible before booking.</h2></header><div class="jr-payment__flow"><article><span>India</span><strong>Authorised dealer</strong><p>Purpose, buyer, remitter, documents and current limits.</p></article><i aria-hidden="true">→</i><article><span>Dubai</span><strong>Verified recipient</strong><p>Developer escrow or seller route for the exact transaction.</p></article><i aria-hidden="true">→</i><article><span>Records</span><strong>Retain evidence</strong><p>Remittance, TCS, registration, contract and income records.</p></article></div></div></section>`;
  if(name==='arabicGuide' && page.theme==='ar') return `<section class="jr-section jr-arabic-guide" id="guide"><div class="jr-shell"><header class="jr-heading jr-heading--compact"><p class="jr-kicker">منهج عملي للمستثمر</p><h2 class="jr-display">قارن العقار كأصل قابل للإدارة.</h2></header><div class="jr-costs__stack"><article><span>01</span><strong>حدد الاستخدام</strong><p>سكن أو دخل أو تنويع أو احتفاظ طويل الأجل.</p></article><article><span>02</span><strong>راجع التكلفة</strong><p>السعر والرسوم والتأثيث والصيانة والإدارة.</p></article><article><span>03</span><strong>اختبر الطلب</strong><p>المستأجر أو المشتري المستهدف والعرض المنافس.</p></article><article><span>04</span><strong>تحقق من الوثائق</strong><p>التسجيل والعقد وخطة السداد والحساب المستلم.</p></article></div></div></section>`;
  return '';
}

function formV4Markup(page) {
  const ar=page.arabic;
  const budgetOptions=ar?['أقل من مليون درهم','1–2 مليون درهم','2–5 ملايين درهم','5–10 ملايين درهم','أكثر من 10 ملايين درهم']:['Below AED 1 million','AED 1–2 million','AED 2–5 million','AED 5–10 million','Above AED 10 million'];
  const countryOptions=[page.countryDefault,'United Arab Emirates','United Kingdom','United States','India','Saudi Arabia','Qatar','Kuwait','Other'].filter(Boolean).filter((value,index,array)=>array.indexOf(value)===index);
  const prefs=ar?['شقة جاهزة','عقار قيد الإنشاء','تاون هاوس','فيلا','عقار فاخر أو بعلامة تجارية']:['Ready apartment','Off-plan apartment','Townhouse','Villa','Branded or luxury residence'];
  return `<section class="jr-section jr-form-section" id="enquire"><div class="jr-shell jr-form-wrap"><div class="jr-form-copy" data-reveal><p class="jr-kicker">${ar?'طلب استشارة خاصة':'Private advisory request'}</p><h2 class="jr-display">${escapeHtml(page.formTitle)}</h2><p>${escapeHtml(page.formText)}</p><ul><li>${ar?'يتم حفظ طلبك قبل الانتقال إلى واتساب.':'Your request is saved before WhatsApp opens.'}</li><li>${ar?'لن يتم تقديم سعر أو توفر غير مؤكد.':'Prices and availability are reconfirmed.'}</li><li>${ar?'استشارة مستقلة من جيمس ريالتي.':'Independent advice from James Realty.'}</li></ul><a class="jr-phone" data-phone-action href="tel:+971528420933">${ar?'اتصال مباشر':'Call James'} · ${PHONE}</a></div><form class="jr-form" id="landing-enquiry" data-lead-capture data-page="${escapeHtml(page.title)}" data-intro="${escapeHtml(page.formIntro)}" novalidate><input type="hidden" name="interest" value=""><input class="jr-honeypot" name="company_website" tabindex="-1" autocomplete="off" aria-hidden="true"><label>${ar?'الاسم':'Name'}<input name="name" autocomplete="name" required maxlength="100"></label><label>${ar?'رقم الهاتف أو واتساب':'Phone / WhatsApp'}<input type="tel" name="phone" autocomplete="tel" inputmode="tel" required maxlength="32"></label><label class="full">${ar?'الميزانية الاستثمارية':'Investment budget'}<select name="budget" required><option value="">${ar?'اختر':'Select'}</option>${budgetOptions.map(value=>`<option>${escapeHtml(value)}</option>`).join('')}</select></label><details class="full jr-form__optional"><summary>${ar?'إضافة التفضيلات والبريد الإلكتروني':'Add property preferences and email'}</summary><div><label>${ar?'البريد الإلكتروني':'Email'}<input type="email" name="email" autocomplete="email" maxlength="160"></label><label>${ar?'الدولة':'Country'}<select name="country"><option value="">${ar?'اختر':'Select'}</option>${countryOptions.map(value=>`<option${value===page.countryDefault?' selected':''}>${escapeHtml(value)}</option>`).join('')}</select></label><label>${ar?'نوع العقار':'Property preference'}<select name="preference"><option value="">${ar?'اختر':'Select'}</option>${prefs.map(value=>`<option>${escapeHtml(value)}</option>`).join('')}</select><label>${ar?'الهدف والجدول الزمني':'Goal or timeline'}<textarea name="notes" maxlength="600"></textarea></label></div></details><label class="full jr-consent"><input type="checkbox" name="consent" required><span>${ar?'أوافق على أن يتواصل معي جيمس ريالتي بخصوص هذا الطلب.':'I agree that James Realty may contact me about this enquiry.'}</span></label><div class="full"><button class="jr-button jr-button--light" type="submit">${ar?'احفظ الطلب وتابع':'Save request and continue'}</button><span class="jr-form__status" data-form-status aria-live="polite"></span></div><div class="full jr-form__success" data-lead-success hidden><strong>${ar?'تم حفظ طلبك.':'Your request is saved.'}</strong><p>${ar?'يمكنك الآن متابعة المحادثة على واتساب دون فقدان بيانات الطلب.':'Continue on WhatsApp; your lead details are already captured.'}</p><a class="jr-button" data-whatsapp-continue href="#">${ar?'تابع على واتساب':'Continue on WhatsApp'} ↗</a><small data-lead-reference></small></div></form></div></section>`;
}

function formV4(page) {
  return formV4Markup(page)
    .replace('</select><label>Goal or timeline', '</select></label><label>Goal or timeline')
    .replace('</select><label>الهدف والجدول الزمني', '</select></label><label>الهدف والجدول الزمني')
    .replace('I agree that James Realty may contact me about this enquiry.', 'I agree that James Realty may contact me about this enquiry. <a href="https://jamesrealty.uk/privacy-policy/" target="_blank" rel="noopener noreferrer">Privacy policy</a>.')
    .replace('أوافق على أن يتواصل معي جيمس ريالتي بخصوص هذا الطلب.', 'أوافق على أن يتواصل معي جيمس ريالتي بخصوص هذا الطلب. <a href="https://jamesrealty.uk/privacy-policy/" target="_blank" rel="noopener noreferrer">سياسة الخصوصية</a>.');
}

function faqV4(page) {
  const sourceLabel=page.arabic?'✓ تم التحقق من الحقائق من المصادر التالية':'✓ Facts verified from these sources';
  const disclaimer=page.arabic?'تمت مراجعة المعلومات في 17 أغسطس 2026. قد تتغير الأسعار وخطط السداد والتوفر ومواعيد الإنجاز والأنظمة وشروط الإقامة. اطلب مستندات حديثة للوحدة قبل الاعتماد عليها. المعلومات عامة وليست استشارة قانونية أو ضريبية أو مالية أو استثمارية.':VERIFIED;
  return `<section class="jr-section jr-faq-section" id="faq"><div class="jr-shell jr-faq"><header data-reveal><p class="jr-kicker">FAQ</p><h2 class="jr-display">${page.arabic?'أسئلة المستثمرين':'Questions to settle before reserving'}</h2></header><div>${page.faq.map(([q,a])=>`<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('')}</div><details class="jr-sources"><summary>${sourceLabel}</summary><ul>${page.sources.map(([a,b])=>`<li><a href="${b}" target="_blank" rel="noopener noreferrer">${escapeHtml(a)} ↗</a></li>`).join('')}</ul><p>${escapeHtml(disclaimer)}</p></details></div></section>`;
}

function footerV4(page) {
  return `<footer class="jr-footer"><div class="jr-shell jr-footer__inner"><a class="jr-brand" href="https://jamesrealty.uk/"><span class="jr-brand__mark">JR</span><span><strong>James Realty</strong><small>${page.arabic?'استشارات عقارية مستقلة':'Independent property advisory'}</small></span></a><p>${page.arabic?'جيمس ريالتي جهة استشارية مستقلة وليست الموقع الرسمي لأي مطور. تستخدم أسماء المشاريع للتعريف فقط.':'James Realty is an independent advisory service, not the official website of any featured developer. Project names are used for identification only.'}</p><div><a href="https://jamesrealty.uk/about-me/">${page.arabic?'عن جيمس رافي':'About James Ravi'}</a><a href="https://jamesrealty.uk/contact/">${page.arabic?'تواصل':'Contact'}</a><a href="https://jamesrealty.uk/blog/property-news/">${page.arabic?'أخبار السوق':'Market insights'}</a></div></div></footer><div class="jr-mobile-cta"><a class="jr-button" data-cta="mobile-form" href="#enquire">${page.arabic?'احفظ طلبك':'Save your request'}</a><a class="jr-button jr-button--ghost" data-phone-action href="tel:+971528420933">${page.arabic?'اتصال':'Call'}</a></div>`;
}

function renderV4(page) {
  const sections={signature:()=>signatureV4(page),projects:()=>projectCardsV4(page),map:()=>mapV4(page),lens:()=>lensV4(page),journey:()=>journeyV4(page),matrix:()=>matrixV4(page),day:()=>dayV4(page),currency:()=>currencyV4(page),underwriting:()=>underwritingV4(page),costs:()=>marketModuleV4(page,'costs'),payment:()=>marketModuleV4(page,'payment'),arabicGuide:()=>marketModuleV4(page,'arabicGuide')};
  const flow=page.flow.map(name=>sections[name]()).join('');
  return `${headV4(page)}<body class="theme-${page.theme}" data-page="${escapeHtml(page.title)}">${navV4(page)}<main id="content">${heroV4(page)}${proofV4(page)}${flow}${formV4(page)}${faqV4(page)}</main>${footerV4(page)}<script src="https://jamesrealty.uk/assets/landing-experience.js?v=5" defer></script></body></html>\n`;
}

for (const page of pages) {
  const target = path.join(ROOT,'landing',page.slug,'index.html');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,renderV4(page),'utf8');
  console.log(`Built ${page.host}`);
}
