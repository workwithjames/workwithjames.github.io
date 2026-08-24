import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const domain = 'https://jamesrealty.uk';
const socialImage = `${domain}/images/uae-property-advisory-consultation-social-v5.jpg?v=20260803-5`;

const cluster = [
  {slug:'dubai-property-buying-costs',label:'Buying costs',title:'Dubai Property Buying Costs: Complete 2026 Guide',description:'Calculate the real cost of buying property in Dubai, including DLD registration, trustee, agency, mortgage and practical ownership costs.',short:'Understand DLD, trustee, agency and mortgage costs before setting a usable budget.'},
  {slug:'off-plan-vs-ready-property-dubai',label:'Property status',title:'Off-Plan vs Ready Property in Dubai: Buyer Comparison',description:'Compare off-plan and ready property in Dubai across payment timing, inspection, rental income, finance, project risk, costs and resale flexibility.',short:'Compare payment timing, inspection certainty, income, finance and delivery risk.'},
  {slug:'best-dubai-communities-by-budget',label:'Community shortlist',title:'Best Dubai Communities by Budget: A Practical Buyer Guide',description:'Screen Dubai communities by budget from below AED 1 million to AED 6 million+, then check live prices, transaction activity and rental yields.',short:'Build a research shortlist by budget without treating portal asking prices as evidence.'},
  {slug:'mortgage-vs-cash-dubai-property',label:'Payment route',title:'Mortgage vs Cash for Dubai Property: Cost and Risk Guide',description:'Compare a Dubai property mortgage with a cash purchase, including LTV limits, upfront cash, financing costs, liquidity and decision scenarios.',short:'Compare financing cost with liquidity, leverage, speed and holding-period risk.'},
  {slug:'dubai-property-investment-indian-buyers',label:'Indian buyers',title:'Dubai Property Investment for Indian Buyers: 2026 Guide',description:'A practical Dubai property investment guide for Indian buyers covering ownership, LRS remittance, TCS, tax reporting, costs and due diligence.',short:'Plan ownership, FEMA/LRS remittance, TCS, tax disclosure and Dubai checks.'},
  {slug:'dubai-property-investment-uk-buyers',label:'UK buyers',title:'Dubai Property Investment for UK Buyers: 2026 Guide',description:'A practical guide for UK buyers investing in Dubai property, covering ownership, GBP funding, UK tax reporting, costs, finance and due diligence.',short:'Plan ownership, GBP funding, UK foreign-income reporting and Dubai due diligence.'},
  {slug:'dubai-property-buying-cost-calculator',label:'Free calculator',title:'Dubai Property Buying Cost Calculator | James Realty',description:'Estimate DLD fees, trustee charges, agency costs, mortgage fees and the upfront cash needed to buy a Dubai property. Assumptions are editable.',short:'Estimate acquisition costs and total upfront cash with editable assumptions.'},
  {slug:'dubai-property-buyer-hub',label:'Buyer hub',title:'Dubai Property Buyer Hub: Guides, Data and Calculators',description:'Use one Dubai property buyer hub to compare communities, buying costs, ready versus off-plan, mortgage versus cash, rental yield and buyer routes.',short:'Start with the purpose, then connect every major Dubai buying decision.'},
  {slug:'jebel-ali-village-property-investment',label:'Jebel Ali Village',title:'Jebel Ali Village Property Investment and Handover Guide',description:'Assess Jebel Ali Village property after the 892-home handover signal, including inspections, community readiness, rental yield inputs and resale competition.',short:'Turn the 892-home handover into property-level leasing, resale and inspection checks.'}
];

const sharedSources = {
  dldSale:['Dubai Land Department, Property Sale Registration','https://dubailand.gov.ae/en/eservices/property-sale-registration/'],
  dldMortgage:['Dubai Land Department, Registering the Sale of a Mortgaged Property','https://dubailand.gov.ae/en/eservices/registering-the-sale-of-a-mortgaged-property/'],
  ownership:['Dubai legislation, Law No. 7 of 2006 concerning real property registration','https://dlp.dubai.gov.ae/Legislation%20Reference/2006/Law%20No.%20%287%29%20of%202006.html'],
  escrow:['Dubai legislation, Law No. 8 of 2007 concerning escrow accounts','https://dlp.dubai.gov.ae/Legislation%20Reference/2007/Law%20No.%20%288%29%20of%202007.html'],
  cbuae:['Central Bank of the UAE, Financial Stability Report and mortgage borrower controls','https://www.centralbank.ae/media/kaqlwo0h/cbuae-fsr-report_2025_en.pdf'],
  uaeTax:['UAE Government, Taxation in the UAE','https://u.ae/en/information-and-services/finance-and-investment/taxation'],
  rbi:['Reserve Bank of India, Liberalised Remittance Scheme FAQ','https://www.rbi.org.in/commonperson/english/scripts/FAQs.aspx?Id=1834'],
  indiaTax:['Income Tax Department of India, foreign assets and income disclosure guide','https://www.incometax.gov.in/iec/foportal/sites/default/files/2024-11/Enhancing%20Tax%20Transparency%20on%20Foreign%20Assets%20and%20Income.pdf'],
  indiaTcs:['Income Tax Department of India, TCS rates','https://www.incometaxindia.gov.in/w/tcs-rates'],
  ukIncome:['GOV.UK, Tax on foreign income','https://www.gov.uk/tax-foreign-income'],
  ukCgt:['GOV.UK, Selling overseas property','https://www.gov.uk/tax-sell-property/selling-overseas-property'],
  jebelAli:['Gulf News, Nakheel begins Jebel Ali Village handover','https://gulfnews.com/business/property/nakheel-begins-handover-of-892-homes-at-jebel-ali-village-1.500643237']
};

const pages = [
  {
    ...cluster[0],
    eyebrow:'Dubai buyer cost guide',
    answerTitle:'How much should you budget above the Dubai property price?',
    summary:'For a ready resale purchase, the headline price is not the usable budget. Buyers should model the agreed DLD registration share, trustee and title charges, agency fees, mortgage costs, inspections and a reserve for post-completion work. A planning buffer of roughly 6% to 8% above the price can be sensible for many cash resales when the buyer funds the full 4% DLD registration fee and pays a 2% agency fee, but the correct figure depends on the contract and finance route.',
    points:['DLD lists the sale-registration charge as 2% for the buyer and 2% for the seller.','Contracts often reallocate costs, so calculate from the signed agreement, not a rule of thumb.','Mortgage and post-handover costs can materially increase the cash needed.'],
    snapshotTitle:'Model the usable budget, not only the price.',
    snapshotText:'A property advertised at AED 2 million can require substantially more cash once registration, professional and finance costs are included.',
    snapshot:[['Core official fee','4% total DLD registration'],['Trustee fee','AED 2,100 or AED 4,200 incl. VAT'],['Best next step','Use the cost calculator']],
    sections:[
      {id:'official-fees',title:'Which Dubai property costs are official?',html:`
        <p>The Dubai Land Department's completed-property sale service separates the registration fee into <strong>2% of the sale value for the buyer and 2% for the seller</strong>. It also lists the title-deed certificate, map, knowledge and innovation fees, plus a registration trustee service-partner fee. The parties' sale agreement may allocate the 4% total differently, which is why buyer calculations commonly show either a 2% or 4% buyer-funded assumption.</p>
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Cost</th><th>Official or variable basis</th><th>Planning treatment</th></tr></thead><tbody>
        <tr><td><strong>DLD sale registration</strong></td><td>2% buyer + 2% seller on DLD's service page</td><td>Use the allocation written into the sale agreement. Model 4% only when the buyer will fund the full total.</td></tr>
        <tr><td><strong>Registration trustee</strong></td><td>AED 4,000 + VAT at AED 500,000 or above; AED 2,000 + VAT below AED 500,000</td><td>AED 4,200 or AED 2,100 including 5% VAT.</td></tr>
        <tr><td><strong>Title deed and map</strong></td><td>AED 250 title deed; apartment/villa map AED 250; AED 10 knowledge + AED 10 innovation</td><td>A common apartment/villa estimate is AED 520. Land-map treatment differs.</td></tr>
        <tr><td><strong>Mortgage registration</strong></td><td>0.25% of the mortgage value</td><td>Apply to the loan amount, not the property price.</td></tr>
        </tbody></table></div>
        <div class="guide-callout"><strong>Why two DLD percentages appear online</strong><p>The official completed-sale service page allocates 2% to each party. Many transaction agreements place the whole 4% economic cost on the buyer. The calculator therefore keeps the buyer-funded percentage editable.</p></div>`},
      {id:'variable-costs',title:'Which buying costs depend on the transaction?',html:`
        <p>Professional and commercial charges are not one universal government tariff. Ask for written quotations and confirm whether VAT is included.</p>
        <div class="guide-card-grid"><article class="guide-card"><span>Ready resale</span><h3>Agency and conveyancing</h3><p>A resale buyer may pay an agency fee, usually quoted as a percentage, plus VAT. Conveyancing, legal review or power-of-attorney work is separate where used.</p></article><article class="guide-card"><span>Mortgage</span><h3>Bank arrangement and valuation</h3><p>Compare the bank's arrangement, valuation, processing, early-settlement and insurance costs. A lower headline rate can still produce a higher total cost.</p></article><article class="guide-card"><span>Property condition</span><h3>Inspection and repairs</h3><p>Ready properties may require a technical inspection, snagging, AC servicing, appliance replacement, painting or immediate maintenance.</p></article><article class="guide-card"><span>Off-plan</span><h3>Developer administration</h3><p>Confirm reservation, Oqood or registration handling, payment-plan and assignment charges in the reservation form and sale-and-purchase agreement.</p></article></div>
        <p>Also separate <strong>acquisition costs</strong> from <strong>ownership costs</strong>. Service charges, insurance, property management, vacancy, maintenance and furnishing affect the investment after purchase and should be tested in the <a href="/dubai-rental-yield-calculator/">rental-yield calculator</a>.</p>`},
      {id:'worked-examples',title:'Worked examples: cash and mortgage purchases',html:`
        <div class="guide-example"><span>Illustrative cash resale</span><h3>AED 1.5 million apartment</h3><dl><div><dt>Property price</dt><dd>AED 1,500,000</dd></div><div><dt>DLD assumption at 4%</dt><dd>AED 60,000</dd></div><div><dt>Trustee + common title/map fees</dt><dd>AED 4,720</dd></div><div><dt>Agency at 2% + VAT</dt><dd>AED 31,500</dd></div><div><dt>Indicative acquisition costs before inspection/other items</dt><dd>AED 96,220</dd></div></dl><p>This equals about 6.4% of the property price. If the agreement allocates only 2% DLD to the buyer, the estimate falls by AED 30,000.</p></div>
        <div class="guide-example"><span>Illustrative 80% mortgage</span><h3>AED 2.5 million apartment</h3><dl><div><dt>20% down payment</dt><dd>AED 500,000</dd></div><div><dt>DLD assumption at 4%</dt><dd>AED 100,000</dd></div><div><dt>Trustee + common title/map fees</dt><dd>AED 4,720</dd></div><div><dt>Mortgage registration at 0.25% of AED 2m</dt><dd>AED 5,000</dd></div><div><dt>Agency at 2% + VAT</dt><dd>AED 52,500</dd></div><div><dt>Cash before bank, valuation, inspection and other costs</dt><dd>AED 662,220</dd></div></dl><p>The down payment is not the full cash requirement. The lender may also value the property below the agreed price, increasing the buyer's cash contribution.</p></div>`},
      {id:'budget-checklist',title:'How to set a safe Dubai property budget',html:`
        <ol><li>Fix the maximum total cash you can deploy without exhausting your emergency reserve.</li><li>Decide whether the buyer will fund 2% or 4% DLD registration under the intended contract.</li><li>Add trustee, title/map, agency, mortgage and professional costs.</li><li>Keep furnishing, repairs and the first year of ownership costs outside the purchase-price figure.</li><li>For a mortgage, stress-test the payment at a higher rate and a lower bank valuation.</li><li>Compare the result with recent area medians on <a href="/dubai-data/">Dubai Data</a>.</li></ol>
        <p><a class="button button-primary" href="/dubai-property-buying-cost-calculator/">Calculate my buying costs <span aria-hidden="true">→</span></a></p>`}
    ],
    faqs:[
      ['How much are the fees for buying property in Dubai?','The amount depends on the contract and finance route. DLD lists a 4% total sale-registration fee, allocated 2% to the buyer and 2% to the seller on its service page, plus trustee and title/map charges. Agency, mortgage, valuation, inspection and other costs can apply.'],
      ['Does the buyer always pay the full 4% DLD fee?','Not automatically. The DLD service page separates the fee into 2% buyer and 2% seller, while transaction agreements may allocate the total differently. Use the signed contract.'],
      ['Are off-plan buying costs the same as ready-property costs?','No. Off-plan purchases can involve developer-specific reservation, registration handling and assignment terms, while ready resales may involve trustee, agency, mortgage, inspection and NOC-related costs.'],
      ['How much cash do I need for a Dubai mortgage purchase?','Add the down payment to all acquisition costs. Also allow for a possible valuation shortfall, because a lender may calculate its loan against the lower of the valuation or purchase price.']
    ],
    sources:[sharedSources.dldSale,sharedSources.dldMortgage,sharedSources.cbuae]
  },
  {
    ...cluster[1],
    eyebrow:'Dubai property comparison',
    answerTitle:'Is off-plan or ready property better in Dubai?',
    summary:'Ready property gives the buyer an inspectable asset, an established building and the possibility of immediate use or rent. Off-plan property can spread payments and provide newer stock, but adds construction, handover and future-supply risk. The better route depends on when the property is needed, how payments affect liquidity and what evidence is available for the exact project.',
    points:['Ready property improves inspection and income visibility.','Off-plan can stage cash flow but delays use and rent.','Compare both on total cash timing, not only advertised price.'],
    snapshotTitle:'Choose the risk you can measure and carry.',
    snapshotText:'A payment plan is not automatically a discount, and a completed unit is not automatically low-risk. Property-level evidence decides.',
    snapshot:[['Ready strength','Inspection and immediate use'],['Off-plan strength','Staged payment timing'],['Key comparison','Price versus evidence']],
    sections:[
      {id:'comparison',title:'Off-plan versus ready property at a glance',html:`
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Decision factor</th><th>Off-plan</th><th>Ready</th></tr></thead><tbody>
        <tr><td><strong>Asset inspection</strong></td><td>Plans, specifications, model unit and construction progress; final unit not yet inspectable</td><td>Physical unit, view, condition, noise and building operation can be checked</td></tr>
        <tr><td><strong>Payment timing</strong></td><td>Deposit and staged instalments; some plans extend after handover</td><td>Price and transfer costs are normally due around completion, or financed</td></tr>
        <tr><td><strong>Use or rental income</strong></td><td>Begins after completion, handover and any fit-out</td><td>Can begin after transfer, subject to vacancy, tenancy and condition</td></tr>
        <tr><td><strong>Market evidence</strong></td><td>Launch pricing, nearby comparables and expected future supply</td><td>Building-level transactions, rents, service charges and management history</td></tr>
        <tr><td><strong>Primary risks</strong></td><td>Construction, delay, specification, market at handover and assignment restrictions</td><td>Condition, hidden defects, tenant/occupancy, ageing systems and overpayment</td></tr>
        <tr><td><strong>Finance</strong></td><td>Developer plans or limited construction-stage finance; CBUAE caps off-plan LTV at 50%</td><td>Broader mortgage availability, subject to bank approval and valuation</td></tr>
        </tbody></table></div>`},
      {id:'off-plan-checks',title:'What should an off-plan buyer verify?',html:`
        <p>Dubai's escrow law requires an off-plan developer receiving purchaser payments to use a project escrow account and to be registered and licensed. This regulatory framework is important, but it does not remove the need to check the transaction.</p>
        <div class="guide-card-grid"><article class="guide-card"><span>Registration</span><h3>Project, developer and escrow</h3><p>Verify the developer, project registration, escrow details, permit and broker credentials through official DLD channels.</p></article><article class="guide-card"><span>Contract</span><h3>SPA and payment triggers</h3><p>Read the completion definition, grace periods, specification, area variance, default provisions, assignment conditions and handover-payment obligations.</p></article><article class="guide-card"><span>Delivery</span><h3>Construction evidence</h3><p>Review official progress, contractor and consultant information, not only sales-centre visuals or marketing updates.</p></article><article class="guide-card"><span>Exit</span><h3>Future supply and resale</h3><p>Estimate how many similar units may complete at the same time and whether the contract permits assignment before handover.</p></article></div>
        <div class="guide-callout"><strong>Payment plan versus economic value</strong><p>Discount every future instalment back to today's value and compare the result with similar ready stock. A longer plan helps cash flow, but it may be embedded in a higher price.</p></div>`},
      {id:'ready-checks',title:'What should a ready-property buyer verify?',html:`
        <ul><li>Inspect the actual unit, parking, view, light, noise, common areas and building systems.</li><li>Review the title deed, seller identity, existing mortgage, tenancy, NOC process and outstanding charges.</li><li>Check recent building-level sale evidence rather than relying only on portal asking prices.</li><li>Obtain service-charge information and understand upcoming major works.</li><li>For a mortgage, get approval early and allow for a bank valuation below the agreed price.</li><li>Use a technical inspection where the age, condition or value justifies it.</li></ul>
        <p>Area-level activity and yield are an initial screen. Use <a href="/dubai-data/">Dubai Data</a>, then move to building and unit comparables.</p>`},
      {id:'worked-comparison',title:'A practical AED 2 million comparison',html:`
        <div class="guide-example"><span>Same headline price, different cash timing</span><h3>AED 2 million off-plan versus ready</h3><dl><div><dt>Off-plan example</dt><dd>20% now, 40% during construction, 40% at handover</dd></div><div><dt>Ready cash example</dt><dd>Price and acquisition costs at transfer</dd></div><div><dt>Ready mortgage example</dt><dd>Down payment + costs now, instalments from completion</dd></div><div><dt>Income timing</dt><dd>Off-plan after handover; ready after transfer/preparation</dd></div></dl><p>The right comparison includes the time value of every payment, rent forgone before handover, mortgage interest, service charges, expected vacancy and exit costs. It does not assume that both properties will have the same value at the end of the holding period.</p></div>`},
      {id:'decision',title:'Which option fits which buyer?',html:`
        <div class="guide-card-grid"><article class="guide-card"><span>Ready may fit</span><h3>Immediate residence or income</h3><p>The buyer needs a home soon, wants to inspect the exact unit or needs current rent and service-charge evidence.</p></article><article class="guide-card"><span>Off-plan may fit</span><h3>Staged liquidity</h3><p>The buyer can wait, understands construction and market risk, and values a payment schedule more than immediate use.</p></article><article class="guide-card"><span>Compare both</span><h3>Long holding period</h3><p>Run the same total-return and cash-flow test against strong ready and off-plan candidates in the same demand corridor.</p></article><article class="guide-card"><span>Pause</span><h3>Unclear purpose</h3><p>If the objective, budget or exit route is not defined, creating a buyer brief is more useful than collecting project brochures.</p></article></div>`}
    ],
    faqs:[
      ['Is off-plan property cheaper than ready property in Dubai?','Not necessarily. Compare the present value of the payment plan, unit specification, location, completion risk and nearby ready transactions. A low initial payment is not the same as a low total price.'],
      ['Can I get a mortgage for an off-plan property?','Finance can be available for eligible projects and buyers, but product availability varies. CBUAE borrower controls cap off-plan loan-to-value at 50%, and banks apply their own credit and project criteria.'],
      ['Which has better rental yield, ready or off-plan?','A ready property has observable rent and cost evidence. Off-plan yield is a forecast until the unit is handed over and leased. Compare net yield after service charges, vacancy, management and furnishing.'],
      ['How do I reduce off-plan risk?','Verify the project and developer through DLD, confirm the escrow account, read the SPA, review official construction progress, understand assignment and delay terms, and compare future competing supply.']
    ],
    sources:[sharedSources.escrow,sharedSources.cbuae,sharedSources.dldSale]
  },
  {
    ...cluster[2],
    eyebrow:'Dubai communities by budget',
    answerTitle:'Which Dubai communities should you shortlist at your budget?',
    summary:'There is no single best Dubai community at every budget. Use a budget band to create a shortlist, then compare the property type, transport, schools, service charges, rental demand, future supply and recent transactions. The communities below are research starting points, not claims of live inventory or guaranteed prices.',
    points:['Budget bands are screens, not live availability promises.','Compare DLD area names with familiar community names.','The right unit can be stronger than the fashionable postcode.'],
    snapshotTitle:'Shortlist communities, then verify individual units.',
    snapshotText:'Asking prices move quickly and two buildings in the same community can have very different service charges, quality and liquidity.',
    snapshot:[['Budget bands','Below AED 1m to AED 6m+'],['Evidence','Transactions, yield and supply'],['Live tool','Dubai Data affordability']],
    sections:[
      {id:'budget-bands',title:'Dubai community starting points by budget',html:`
        <p>These bands indicate where buyers can begin research in August 2026. Unit size, age, building quality, view, payment plan and exact sub-community can move a property materially above or below the band.</p>
        <div class="budget-bands">
        <article class="budget-band"><div><span>Entry band</span><strong>Below AED 1m</strong></div><div><h3>Affordable apartment-led areas</h3><p>Start with International City, Dubai Residence Complex, Dubai South, Dubai Production City and selected older or smaller units in Discovery Gardens or Dubai Sports City.</p><ul><li>Prioritise completed-building condition and service charges.</li><li>Check transport and future competing supply.</li><li>Studios can show high headline yield but may have more investor competition.</li></ul></div></article>
        <article class="budget-band"><div><span>Core apartment band</span><strong>AED 1m–2m</strong></div><div><h3>Broader apartment choice</h3><p>Research Jumeirah Village Circle, Arjan, Dubai Hills Estate entry apartments, Business Bay smaller units, Jumeirah Lake Towers, Dubai Marina older stock and Dubai Creek Harbour smaller layouts.</p><ul><li>Building quality matters more than the community label alone.</li><li>Compare metro access, parking and service charges.</li><li>Test ready units against off-plan payment-plan premiums.</li></ul></div></article>
        <article class="budget-band"><div><span>Premium apartment / entry family</span><strong>AED 2m–3.5m</strong></div><div><h3>Stronger location or larger space</h3><p>Explore larger Dubai Hills and Creek Harbour apartments, established Marina/JLT options, Downtown fringe locations, Town Square or Villanova family stock, and selected townhouses where available.</p><ul><li>Decide between central apartment liquidity and suburban space.</li><li>Model school and commute costs for end use.</li><li>For investment, compare net yield rather than price growth stories.</li></ul></div></article>
        <article class="budget-band"><div><span>Family and premium band</span><strong>AED 3.5m–6m</strong></div><div><h3>Townhouses, villas and premium apartments</h3><p>Research Dubai Hills Estate, Arabian Ranches corridors, Tilal Al Ghaf, The Valley, Damac Hills, premium Creek Harbour and selected Downtown or waterfront apartments.</p><ul><li>Compare plot, built-up area and community maturity.</li><li>Check maintenance exposure and major systems.</li><li>Review current and future villa/townhouse supply.</li></ul></div></article>
        <article class="budget-band"><div><span>Prime band</span><strong>AED 6m+</strong></div><div><h3>Prime homes and limited-supply assets</h3><p>Consider Palm Jumeirah, Emirates Hills, Jumeirah Bay, prime Downtown, Dubai Hills villas, waterfront communities and branded residences only after property-level comparables and service-cost review.</p><ul><li>Prime does not remove liquidity or overpricing risk.</li><li>Separate brand premium from underlying real estate value.</li><li>Use specialist technical, legal and valuation checks.</li></ul></div></article>
        </div>`},
      {id:'scorecard',title:'How to score a Dubai community before buying',html:`
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Dimension</th><th>What to measure</th><th>Why it changes the decision</th></tr></thead><tbody>
        <tr><td><strong>Entry price</strong></td><td>Recent median and comparable price per square metre</td><td>Prevents a single asking price from setting the benchmark.</td></tr>
        <tr><td><strong>Transaction depth</strong></td><td>Number and recency of comparable sales</td><td>Deeper markets can support price discovery and resale liquidity.</td></tr>
        <tr><td><strong>Rental demand</strong></td><td>Achieved rents, vacancy, tenant profile and leasing time</td><td>Headline gross yield can hide vacancy and operating costs.</td></tr>
        <tr><td><strong>Supply</strong></td><td>Completions, launches and similar units under construction</td><td>Competing stock can affect rent, resale and negotiation power.</td></tr>
        <tr><td><strong>Ownership cost</strong></td><td>Service charges, district cooling, maintenance and insurance</td><td>Two similarly priced units can produce different net returns.</td></tr>
        <tr><td><strong>Daily utility</strong></td><td>Commute, schools, retail, public realm and transport</td><td>Supports end-user demand and long-term tenant retention.</td></tr>
        </tbody></table></div>`},
      {id:'buyer-types',title:'Match the community to the buyer, not the trend',html:`
        <div class="guide-card-grid"><article class="guide-card"><span>Yield investor</span><h3>Demand before prestige</h3><p>Prioritise sustainable rent, realistic vacancy, service charges and a broad tenant pool. Do not use the highest gross-yield table as the only screen.</p></article><article class="guide-card"><span>Capital-growth buyer</span><h3>Catalyst and supply</h3><p>Test the infrastructure or placemaking thesis against delivery timing, launch pipeline and the premium already priced in.</p></article><article class="guide-card"><span>Owner-occupier</span><h3>Ten-year utility</h3><p>Commute, schools, layout, storage, noise, sunlight and community management can matter more than a short-term yield difference.</p></article><article class="guide-card"><span>International buyer</span><h3>Manageability</h3><p>Consider building management, remote maintenance, leasing depth, property management and how easily the asset can be inspected or resold.</p></article></div>`},
      {id:'live-data',title:'Turn the budget band into a current shortlist',html:`
        <ol><li>Enter the budget and property type in the <a href="/dubai-data/#affordability">Dubai Data affordability screen</a>.</li><li>Note the official DLD area names and recent medians.</li><li>Check transaction sample size and area-level gross yield.</li><li>Compare three communities using the same criteria.</li><li>Move from area data to building-level sales, rents and service charges.</li><li>Use the <a href="/dubai-property-buying-cost-calculator/">buying-cost calculator</a> before setting the maximum offer.</li></ol>
        <div class="guide-callout"><strong>Do not treat a median as an available property</strong><p>A median is a market screen. It does not confirm current inventory, view, floor, unit condition, tenancy, handover date or developer payment terms.</p></div>`}
    ],
    faqs:[
      ['What are the best Dubai communities below AED 1 million?','Research can begin with apartment-led areas such as International City, Dubai Residence Complex, Dubai South, Dubai Production City and selected units in Discovery Gardens or Dubai Sports City. Verify current transactions and building quality before relying on the band.'],
      ['Where should I look with AED 1 million to AED 2 million?','This range can open a broader apartment search across JVC, Arjan, JLT, selected Dubai Marina and Business Bay stock, and entry options in Dubai Hills or Creek Harbour. Availability and unit quality vary.'],
      ['Which Dubai community gives the best rental yield?','There is no permanent winner. Yield changes with price, achieved rent, unit type, service charges, vacancy and supply. Use current area data, then calculate net yield for the exact unit.'],
      ['Are portal asking prices reliable for setting a budget?','They show seller expectations, not necessarily completed transaction values. Compare them with recent DLD-derived data and suitable building-level transactions.']
    ],
    sources:[['Dubai Land Department, Real Estate Data','https://dubailand.gov.ae/en/open-data/real-estate-data/'],['James Realty, Dubai Data methodology and live screen',`${domain}/dubai-data/`],sharedSources.dldSale]
  },
  {
    ...cluster[3],
    eyebrow:'Dubai property finance decision',
    answerTitle:'Should you use a mortgage or buy with cash?',
    summary:'Cash reduces financing friction and interest expense, while a mortgage preserves liquidity and can increase exposure to property returns. The right answer comes from comparing total financing cost, cash reserves, alternative uses for capital, holding period and downside resilience. Approval limits are maximums, not a target for borrowing.',
    points:['Expat first-home LTV is capped at 80% up to AED 5m and 70% above AED 5m.','Expat total debt payments are capped at 50% of gross monthly income.','Model rate, valuation and income shocks before choosing leverage.'],
    snapshotTitle:'Use leverage only when the liquidity has a job.',
    snapshotText:'Keeping cash invested elsewhere can be rational, but only after comparing after-tax, risk-adjusted returns with mortgage cost.',
    snapshot:[['Cash strength','Speed and no interest'],['Mortgage strength','Liquidity preservation'],['Maximum tenor','25 years under CBUAE controls']],
    sections:[
      {id:'rules',title:'What mortgage limits apply to expatriate buyers?',html:`
        <p>CBUAE borrower controls set maximum loan-to-value ratios. For expatriates, a first house or owner-occupied property is capped at <strong>80% LTV when the value is AED 5 million or less</strong> and <strong>70% above AED 5 million</strong>. A subsequent property is capped at 60%, and off-plan schemes at 50%.</p>
        <p>CBUAE also reports a maximum debt-burden ratio of 50% of gross monthly income for expatriates, a financing cap of up to seven years of annual income and a maximum mortgage tenor of 25 years. Banks can lend less after applying credit, age, income, employment, residency and property criteria.</p>
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Expatriate borrower category</th><th>Maximum LTV</th><th>Minimum equity before costs</th></tr></thead><tbody><tr><td><strong>First home ≤ AED 5m</strong></td><td>80%</td><td>20%</td></tr><tr><td><strong>First home &gt; AED 5m</strong></td><td>70%</td><td>30%</td></tr><tr><td><strong>Subsequent property</strong></td><td>60%</td><td>40%</td></tr><tr><td><strong>Off-plan scheme</strong></td><td>50%</td><td>50%</td></tr></tbody></table></div>`},
      {id:'comparison',title:'Mortgage versus cash: the real trade-offs',html:`
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Factor</th><th>Mortgage</th><th>Cash</th></tr></thead><tbody>
        <tr><td><strong>Upfront liquidity</strong></td><td>Lower property equity contribution, but costs still paid upfront</td><td>Full price plus costs deployed</td></tr>
        <tr><td><strong>Total cost</strong></td><td>Interest/profit, arrangement, valuation, registration, insurance and possible early-settlement costs</td><td>No finance cost; opportunity cost of deployed capital remains</td></tr>
        <tr><td><strong>Execution</strong></td><td>Credit approval, valuation and bank process add conditions and time</td><td>Potentially simpler and stronger negotiating position</td></tr>
        <tr><td><strong>Risk</strong></td><td>Rate, income and refinancing risk; leverage amplifies gains and losses on equity</td><td>Property concentration and lower liquid reserves if most cash is deployed</td></tr>
        <tr><td><strong>Flexibility</strong></td><td>Cash remains available for other investments or obligations</td><td>No monthly debt service; refinancing remains a future option</td></tr>
        </tbody></table></div>`},
      {id:'math',title:'The calculation that matters',html:`
        <p>Do not compare the mortgage rate with zero. Compare the <strong>all-in financing cost</strong> with the realistic after-tax, risk-adjusted return on the cash you keep. Also value liquidity: money reserved for vacancies, repairs, business needs or market opportunities may be useful even if its direct return is lower.</p>
        <div class="guide-example"><span>Illustrative decision</span><h3>AED 2.5m property with 80% finance</h3><dl><div><dt>Property price</dt><dd>AED 2,500,000</dd></div><div><dt>Maximum example loan</dt><dd>AED 2,000,000</dd></div><div><dt>Minimum equity before costs</dt><dd>AED 500,000</dd></div><div><dt>Mortgage registration at 0.25%</dt><dd>AED 5,000</dd></div><div><dt>Additional cash requirement</dt><dd>DLD, trustee, agency, bank, valuation and other costs</dd></div></dl><p>Then compare monthly payments under the offered rate, a higher-rate stress case and a temporary vacancy or income interruption. Use the <a href="/dubai-property-buying-cost-calculator/">buying-cost calculator</a> for the upfront estimate.</p></div>`},
      {id:'stress-test',title:'Five tests before choosing a mortgage',html:`
        <ol><li><strong>Valuation test:</strong> can you fund the gap if the bank values the unit below the agreed price?</li><li><strong>Rate test:</strong> can the cash flow carry a meaningfully higher rate after the fixed period?</li><li><strong>Income test:</strong> can you cover payments during job change, vacancy or lower business income?</li><li><strong>Exit test:</strong> what are the early-settlement, transfer and sale costs if the holding period shortens?</li><li><strong>Currency test:</strong> if income is in GBP, INR or another currency, can adverse exchange movements affect payment capacity?</li></ol>
        <div class="guide-callout"><strong>Pre-approval is not property approval</strong><p>A borrower can be approved while the selected property fails the bank's valuation or eligibility review. Keep the finance and property workstreams separate until both are confirmed.</p></div>`},
      {id:'decision',title:'When cash or mortgage may fit better',html:`
        <div class="guide-card-grid"><article class="guide-card"><span>Cash may fit</span><h3>Short execution and low debt appetite</h3><p>The buyer values simplicity, has ample reserves after purchase and does not have a compelling alternative use for the capital.</p></article><article class="guide-card"><span>Mortgage may fit</span><h3>Deliberate liquidity preservation</h3><p>The buyer has stable income, sufficient reserves and a clear use for retained capital that justifies the all-in financing cost and risk.</p></article><article class="guide-card"><span>Lower leverage may fit</span><h3>Balance cost and reserves</h3><p>A larger down payment can reduce payment risk without placing all investable cash into one illiquid asset.</p></article><article class="guide-card"><span>Pause</span><h3>Approval depends on stretching</h3><p>If the transaction only works at maximum LTV, minimum reserves and optimistic rent, the margin of safety is too thin.</p></article></div>`}
    ],
    faqs:[
      ['Is it better to buy Dubai property with cash or a mortgage?','Cash can reduce cost and execution risk; a mortgage can preserve liquidity. Compare all-in finance cost, cash reserves, alternative investment returns, holding period and downside scenarios.'],
      ['What is the maximum mortgage LTV for an expatriate in the UAE?','CBUAE controls cap a first owner-occupied home at 80% when the property is AED 5 million or less and 70% above AED 5 million. Subsequent property is capped at 60% and off-plan schemes at 50%.'],
      ['Does mortgage pre-approval guarantee the property loan?','No. The lender still reviews the selected property, valuation and transaction documents, and may lend against a lower value than the agreed price.'],
      ['What costs apply only to a mortgaged Dubai purchase?','Mortgage registration is 0.25% of the loan value. Banks can also charge arrangement, valuation, insurance and other product-specific costs.']
    ],
    sources:[sharedSources.cbuae,sharedSources.dldMortgage,sharedSources.dldSale]
  },
  {
    ...cluster[4],
    eyebrow:'Indian buyer guide',
    answerTitle:'Can Indian buyers invest in Dubai property?',
    summary:'Indian citizens can buy eligible Dubai property, but the funding and Indian tax position depend on whether the buyer is resident in India, not ordinarily resident or non-resident under the relevant rules. A resident individual can use RBI’s Liberalised Remittance Scheme for overseas immovable property within the annual limit and must plan TCS and foreign-asset reporting before sending funds.',
    points:['Dubai permits non-UAE nationals to own in designated areas.','Resident individuals can remit under LRS within USD 250,000 per financial year.','Indian residents may need Schedule FA and FSI reporting.'],
    snapshotTitle:'Resolve residency and remittance before reserving.',
    snapshotText:'Nationality alone does not determine FEMA or Indian tax treatment. Funding route, residency and beneficial ownership must align.',
    snapshot:[['Dubai ownership','Designated freehold areas'],['India resident funding','LRS up to USD 250,000 p.a.'],['TCS planning','20% above ₹10 lakh for other LRS purposes']],
    sections:[
      {id:'ownership',title:'Can an Indian citizen buy property in Dubai?',html:`
        <p>Yes, subject to the property being in an area where non-UAE nationals can own. Dubai Law No. 7 of 2006 allows non-UAE nationals to hold freehold ownership without a time limit, or usufruct/leasehold up to 99 years, in areas designated by the Ruler.</p>
        <p>Ownership does not by itself settle Indian remittance, tax or reporting obligations. First classify the buyer's status for FEMA and Indian income-tax purposes, then document the source and route of funds.</p>`},
      {id:'lrs',title:'How can an Indian resident send money for the purchase?',html:`
        <p>RBI's Liberalised Remittance Scheme allows resident individuals, including minors, to remit up to <strong>USD 250,000 per financial year from April to March</strong> for permitted current or capital-account transactions. RBI confirms that acquiring immovable property outside India is a permitted use.</p>
        <ul><li>PAN is mandatory for LRS transactions.</li><li>The USD 250,000 limit is cumulative across all LRS remittances in the financial year.</li><li>Family members' remittances may be consolidated for an overseas property when each complies and is a co-owner for the capital-account transaction.</li><li>The authorised dealer bank reviews the declared purpose and compliance documentation.</li></ul>
        <div class="guide-callout"><strong>Do not assume an NRI uses LRS</strong><p>FEMA residency is fact-specific. A non-resident Indian funding from overseas income or NRE/FCNR arrangements may follow a different route. Confirm it with the authorised dealer bank.</p></div>`},
      {id:'tcs-tax',title:'What TCS and Indian reporting should be planned?',html:`
        <p>India's Income Tax Department states that no TCS applies when total LRS remittance does not exceed ₹10 lakh. For a purpose other than education or medical treatment, the published rate is <strong>20% on the amount remitted above ₹10 lakh</strong>. TCS is a tax collection and can affect cash flow even where it is later available as credit, subject to the taxpayer's position.</p>
        <p>For Indian residents, the Income Tax Department's foreign-asset guide says Schedule FA is used to report foreign assets and Schedule FSI for foreign-source income. Its Table C covers immovable property outside India. The guide also says ITR-1 and ITR-4 do not contain Schedule FA, and that Schedule FA is not required for a non-resident or not ordinarily resident taxpayer.</p>
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Stage</th><th>Question</th><th>Document/control</th></tr></thead><tbody><tr><td><strong>Before reservation</strong></td><td>What is the buyer's FEMA and tax residency?</td><td>Residency analysis and bank discussion</td></tr><tr><td><strong>Before remittance</strong></td><td>How much LRS capacity remains this financial year?</td><td>PAN, Form A2/bank documents and prior remittance record</td></tr><tr><td><strong>During payment</strong></td><td>What TCS cash flow will the bank collect?</td><td>Written bank calculation and tax-credit planning</td></tr><tr><td><strong>After purchase</strong></td><td>What foreign asset and income must be reported?</td><td>Correct ITR, Schedule FA/FSI and professional advice</td></tr></tbody></table></div>`},
      {id:'dubai-costs',title:'What Dubai costs should an Indian buyer budget?',html:`
        <p>Dubai costs do not change because the buyer is Indian. For a ready sale, model the agreed DLD registration share, trustee and title/map fees, agency, mortgage and professional charges. If funds are remitted from India, add exchange-rate spread, bank charges and TCS cash-flow effects.</p>
        <p>Use the <a href="/dubai-property-buying-costs/">complete Dubai buying-cost guide</a> and the <a href="/dubai-property-buying-cost-calculator/">editable calculator</a>. For rental property, calculate net rather than gross return and consider how Indian tax residency affects foreign rental income.</p>`},
      {id:'due-diligence',title:'Indian buyer checklist before paying a deposit',html:`
        <ol><li>Confirm the property is eligible for non-UAE national ownership.</li><li>Verify developer, project, broker and escrow information through official DLD channels.</li><li>Resolve FEMA and Indian tax residency with the authorised dealer bank/adviser.</li><li>Calculate LRS capacity, family co-ownership and TCS before signing a short payment deadline.</li><li>Ensure buyer names, ownership shares and sources of funds match every document.</li><li>Review the SPA or resale contract, costs, cancellation/default clauses and handover/transfer process.</li><li>Plan Schedule FA/FSI reporting and keep purchase, bank and rental records.</li></ol>
        <p><a class="button button-primary" href="/contact/?goal=buy">Build an Indian buyer brief <span aria-hidden="true">→</span></a></p>`}
    ],
    faqs:[
      ['Can an Indian citizen own freehold property in Dubai?','Yes, non-UAE nationals can own freehold property in areas designated for foreign ownership. Verify the exact property and title route.'],
      ['What is the LRS limit for buying Dubai property?','RBI permits a resident individual to remit up to USD 250,000 per financial year across all permitted LRS transactions. Overseas immovable property is a permitted use.'],
      ['Can family members combine LRS limits for one Dubai property?','RBI permits consolidation for relatives when each person complies with LRS and, for a capital-account investment, the contributing family members are co-owners or co-partners as applicable.'],
      ['Does an Indian resident need to report Dubai property in the ITR?','The Income Tax Department says Indian residents must report foreign assets in Schedule FA, with foreign-source income in Schedule FSI as applicable. Non-resident and not ordinarily resident treatment differs; obtain tax advice for the specific status.'],
      ['Is TCS an extra property tax?','TCS is collected by the authorised dealer on qualifying LRS remittance and can be available as tax credit subject to the taxpayer’s return and liability. It still increases the cash needed at remittance.']
    ],
    sources:[sharedSources.ownership,sharedSources.rbi,sharedSources.indiaTcs,sharedSources.indiaTax,sharedSources.dldSale]
  },
  {
    ...cluster[5],
    eyebrow:'UK buyer guide',
    answerTitle:'What should UK buyers check before buying in Dubai?',
    summary:'A UK buyer can own eligible Dubai property, but UK tax residence remains central. UK residents normally report foreign rental income and can be liable to Capital Gains Tax when disposing of overseas property. Build the decision in both AED and GBP, allow for currency movement and keep complete purchase, income and sale records.',
    points:['Dubai allows foreign ownership in designated areas.','UK residents normally report foreign rental income.','UK residents can owe CGT on overseas-property disposal.'],
    snapshotTitle:'Treat GBP/AED and UK tax as part of the property return.',
    snapshotText:'A tax-free personal-income environment in the UAE does not automatically make the investment tax-free for a UK resident.',
    snapshot:[['Currency link','AED is pegged to USD, not GBP'],['UK rental income','Normally report if UK resident'],['UK disposal','Overseas gains can be taxable']],
    sections:[
      {id:'ownership',title:'Can a UK citizen buy freehold property in Dubai?',html:`
        <p>Yes, subject to the property being in an area designated for non-UAE national ownership. Dubai's real-property registration law permits freehold title without a time limit, and usufruct or leasehold up to 99 years, in designated areas.</p>
        <p>A valid passport can be used for a non-resident foreign buyer in the DLD completed-sale process. Mortgage availability, bank documentation and remote transaction requirements depend on the lender and transaction.</p>`},
      {id:'uk-tax',title:'How does UK tax residence change the return?',html:`
        <p>GOV.UK states that UK residents normally pay UK tax on foreign income, including rent from overseas property, unless a specific relief applies. Foreign income is generally reported through Self Assessment.</p>
        <p>GOV.UK also states that a UK resident can pay Capital Gains Tax when disposing of overseas property. Residence, allowable costs, ownership structure and any available relief affect the result, so model after-tax return before purchase and obtain personal advice.</p>
        <div class="guide-callout"><strong>UAE and UK tax are different layers</strong><p>The UAE Government states that the UAE does not levy income tax on individuals. A UK resident's UK obligations can still apply to Dubai rental income and gains.</p></div>`},
      {id:'currency',title:'How should a UK buyer manage GBP/AED currency risk?',html:`
        <p>The dirham is pegged to the US dollar, not sterling. A Dubai property's AED price can therefore rise or fall in GBP terms even when its AED value is unchanged. The same applies to rent and sale proceeds.</p>
        <div class="guide-card-grid"><article class="guide-card"><span>Before reservation</span><h3>Match payment dates</h3><p>Map every deposit and instalment in AED, then test the GBP cost under weaker-sterling scenarios.</p></article><article class="guide-card"><span>Funding</span><h3>Compare the full FX spread</h3><p>Compare bank and specialist-provider exchange rates, transfer charges, beneficiary checks and payment cut-off times.</p></article><article class="guide-card"><span>Income</span><h3>Choose a rent-conversion policy</h3><p>Decide whether AED rent stays in the UAE for costs or is converted to GBP, and record exchange rates for tax reporting.</p></article><article class="guide-card"><span>Exit</span><h3>Model GBP proceeds</h3><p>Run sale outcomes at different AED prices and GBP/USD rates, after selling costs and UK tax.</p></article></div>`},
      {id:'costs-finance',title:'What costs and finance issues should UK buyers check?',html:`
        <p>For a ready resale, model the agreed buyer share of the 4% total DLD sale-registration fee, trustee, title/map, agency, mortgage, valuation and professional costs. For off-plan, read the developer's reservation and SPA charges.</p>
        <p>Non-resident mortgage products can require larger down payments or different income evidence than a resident first-home loan. CBUAE LTV ratios are regulatory ceilings; the lender may apply stricter limits. A UK credit profile does not replace the UAE bank's affordability and property assessment.</p>
        <p>Use the <a href="/dubai-property-buying-costs/">buying-cost guide</a>, compare <a href="/mortgage-vs-cash-dubai-property/">mortgage versus cash</a>, then check the target area through <a href="/dubai-data/">Dubai Data</a>.</p>`},
      {id:'checklist',title:'UK buyer checklist before committing',html:`
        <ol><li>Confirm UK tax residence and obtain advice on foreign rent, gains and ownership structure.</li><li>Verify the exact property's foreign-ownership eligibility and DLD registration route.</li><li>Prepare source-of-funds and source-of-wealth documents before the payment deadline.</li><li>Model the full price and costs in both AED and GBP.</li><li>Compare ready and off-plan using cash timing, evidence and exit restrictions.</li><li>For finance, obtain approval and allow for a lower bank valuation.</li><li>Keep contracts, transfer receipts, exchange-rate records, invoices, rental statements and sale documents.</li></ol>
        <p><a class="button button-primary" href="/contact/?goal=buy">Build a UK buyer brief <span aria-hidden="true">→</span></a></p>`}
    ],
    faqs:[
      ['Can a UK citizen buy property in Dubai without UAE residence?','Yes, non-UAE nationals can buy eligible property in designated ownership areas. DLD’s completed-sale process accepts a valid passport for non-resident foreign buyers.'],
      ['Do UK residents pay tax on Dubai rental income?','GOV.UK says UK residents normally pay UK tax on foreign income, including rent from overseas property, unless a relevant relief applies.'],
      ['Do UK residents pay Capital Gains Tax when selling Dubai property?','GOV.UK says UK residents can pay Capital Gains Tax on disposal of overseas property. The calculation depends on the individual facts and allowable costs.'],
      ['Is Dubai property free of all tax for a UK buyer?','No. The UAE does not levy personal income tax on individuals, but UK tax obligations can apply to a UK resident, and Dubai transaction and ownership costs still apply.'],
      ['Should I calculate the investment in GBP or AED?','Use both. The property operates in AED, while a UK buyer may measure wealth and tax in GBP. Currency movement can change the GBP return.']
    ],
    sources:[sharedSources.ownership,sharedSources.dldSale,sharedSources.ukIncome,sharedSources.ukCgt,sharedSources.uaeTax,sharedSources.cbuae]
  },
  {
    ...cluster[6],
    eyebrow:'Free Dubai buying-cost tool',
    answerTitle:'What does this Dubai buying-cost calculator estimate?',
    summary:'This calculator estimates the acquisition costs and upfront cash for a Dubai property purchase. It uses current published DLD figures for sale registration, trustee charges and mortgage registration, while keeping commercial assumptions such as the buyer-funded DLD share, agency and bank fees editable.',
    points:['Choose 2% or 4% buyer-funded DLD registration.','Add mortgage and commercial assumptions separately.','Use the estimate for planning, then replace it with written quotations.'],
    snapshotTitle:'A transparent estimate you can challenge.',
    snapshotText:'Each input is visible. No data is sent or stored, and developer-specific or legal costs can be added manually.',
    snapshot:[['Default price','AED 1.5m'],['Official trustee logic','AED 2,100 / AED 4,200'],['Privacy','Runs in your browser']],
    isCalculator:true,
    sections:[
      {id:'calculator',title:'Estimate Dubai property buying costs',html:`
        <p>Change the assumptions to match the quotation or contract. For completed property, DLD's service page lists a 2% buyer and 2% seller registration allocation. Select 4% only when your agreement places the full total on the buyer.</p>
        <div class="cost-calculator-shell">
        <form id="buying-cost-calculator" class="cost-calculator-form" novalidate>
          <label class="full">Property price (AED)<input name="price" type="number" min="100000" step="50000" value="1500000" inputmode="numeric"/></label>
          <label>Property status<select name="property_status"><option value="ready">Ready / resale</option><option value="off_plan">Off-plan</option></select></label>
          <label>Buyer-funded DLD share<select name="dld_share"><option value="4" selected>4% total</option><option value="2">2% buyer allocation</option><option value="0">0% / developer or seller covers</option></select></label>
          <label>Agency fee (%)<input name="agency" type="number" min="0" max="5" step="0.1" value="2" inputmode="decimal"/></label>
          <label>Title, map and govt. fees (AED)<input name="title_map" type="number" min="0" step="10" value="520" inputmode="numeric"/></label>
          <label>Finance route<select name="mortgage"><option value="no">Cash</option><option value="yes">Mortgage</option></select></label>
          <label>Other costs (AED)<input name="additional" type="number" min="0" step="500" value="0" inputmode="numeric"/></label>
          <label data-mortgage-field hidden>Down payment (%)<input name="down_payment" type="number" min="20" max="100" step="1" value="20" inputmode="decimal"/></label>
          <label data-mortgage-field hidden>Bank arrangement fee (%)<input name="bank_fee" type="number" min="0" max="2" step="0.1" value="0.5" inputmode="decimal"/></label>
          <label data-mortgage-field hidden>Valuation estimate (AED)<input name="valuation" type="number" min="0" step="100" value="3000" inputmode="numeric"/></label>
          <div class="calculator-actions"><button id="recalculate-buying-costs" class="button button-primary" type="button">Recalculate</button><button id="copy-buying-costs" class="button button-outline" type="button">Copy estimate</button></div>
          <p class="cost-calculator-note">Agency VAT is calculated at 5%. Trustee fee includes 5% VAT. Mortgage registration is 0.25% of the estimated loan. Developer, NOC, conveyancing, inspection, insurance, furnishing and ownership costs are excluded unless entered under Other costs.</p>
        </form>
        <section class="cost-calculator-results" aria-live="polite" aria-labelledby="calculator-result-title"><div class="calculator-result-hero"><span id="calculator-result-title">Estimated acquisition costs</span><strong id="calculator-total-costs">AED 0</strong><small id="calculator-cost-ratio">0.00% of the property price</small></div><dl id="calculator-breakdown" class="calculator-breakdown"></dl><div class="guide-example"><span>Estimated cash needed at purchase</span><h3 id="calculator-upfront-cash">AED 0</h3><p>Purchase equity or full cash price plus the estimated acquisition costs above.</p></div><p id="calculator-status" class="calculator-status" role="status"></p></section>
        </div>`},
      {id:'assumptions',title:'What the calculator includes',html:`
        <div class="guide-table-wrap"><table class="guide-table"><thead><tr><th>Item</th><th>Default</th><th>How to use it</th></tr></thead><tbody><tr><td><strong>DLD sale registration</strong></td><td>4% buyer-funded assumption</td><td>Change to 2% if the contract follows the DLD buyer/seller split.</td></tr><tr><td><strong>Trustee service fee</strong></td><td>AED 4,200 at AED 500k+; AED 2,100 below</td><td>Automatically selected from the entered price, including VAT.</td></tr><tr><td><strong>Title/map/government</strong></td><td>AED 520</td><td>Common apartment/villa estimate; edit for the transaction.</td></tr><tr><td><strong>Agency</strong></td><td>2% + 5% VAT</td><td>Set to the written agency agreement or zero where not buyer-paid.</td></tr><tr><td><strong>Mortgage</strong></td><td>Optional</td><td>Adds 0.25% registration, bank-fee estimate, VAT and valuation.</td></tr></tbody></table></div>`},
      {id:'excluded',title:'What still needs a written quotation',html:`
        <p>The estimate deliberately excludes costs that cannot be reliable from the property price alone:</p><ul><li>Developer reservation, Oqood handling, assignment or payment-plan charges.</li><li>Developer NOC, mortgage release or blocking arrangements on a resale.</li><li>Legal, conveyancing, power-of-attorney or translation work.</li><li>Technical inspection, snagging, valuation beyond the entered mortgage estimate and surveys.</li><li>Insurance, furnishing, repairs, utility deposits and moving costs.</li><li>Service charges, management, vacancy and other ongoing ownership costs.</li></ul>
        <p>Read the <a href="/dubai-property-buying-costs/">full cost guide</a> for worked examples.</p>`},
      {id:'next-step',title:'Turn the estimate into a purchase budget',html:`
        <ol><li>Save the maximum total cash available.</li><li>Subtract a reserve for emergencies, vacancy and repairs.</li><li>Enter the remaining purchase budget and realistic contract costs.</li><li>For a mortgage, include a valuation-shortfall buffer.</li><li>Check communities within the resulting price on <a href="/dubai-data/#affordability">Dubai Data</a>.</li><li>Send a <a href="/buy-invest-dubai/#buyer-enquiry">structured buyer brief</a> using the usable budget, not the headline price.</li></ol>`}
    ],
    faqs:[
      ['Is the Dubai buying-cost calculator exact?','No. It is a planning estimate using visible assumptions. Replace commercial estimates with the signed contract, DLD statement, lender offer and written professional quotations.'],
      ['Why is the DLD percentage editable?','DLD lists a 4% total fee as 2% buyer and 2% seller on its completed-sale service page. Contracts can allocate the economic cost differently, so the buyer-funded assumption may be 2% or 4%.'],
      ['Does it calculate monthly mortgage payments?','No. It estimates upfront acquisition and mortgage-registration costs. Compare monthly payments using the lender’s rate, term and insurance quotation.'],
      ['Does the website store my figures?','No. The calculator runs locally in the browser and does not submit the entered figures.']
    ],
    sources:[sharedSources.dldSale,sharedSources.dldMortgage,sharedSources.cbuae]
  },
  {
    ...cluster[7],
    eyebrow:'Dubai property buyer hub',
    answerTitle:'Where should a Dubai property buyer start?',
    summary:'Start with the purpose of the purchase, a usable all-in budget and the time horizon. Then compare communities, ready and off-plan status, payment route, acquisition costs and rental evidence in that order. This hub connects each decision to one focused guide, calculator or data page before a buyer brief is submitted.',
    points:['Define home, relocation, income or long-term investment first.','Use total cash and ownership cost, not only the advertised price.','Move from area data to project, building and unit evidence.'],
    snapshotTitle:'One path from broad search to a defensible shortlist.',
    snapshotText:'Use the hub to answer each decision once, then carry the result into the structured buyer brief.',
    snapshot:[['Step 1','Purpose and usable budget'],['Step 2','Area, status and payment'],['Step 3','Property evidence and brief']],
    heroImage:'/images/visuals/buyer-consultation-1200.webp',
    heroAlt:'Property adviser and buyers comparing a Dubai apartment and investment brief',
    sections:[
      {id:'decision-path',title:'The Dubai property buyer decision path',html:`
        <div class="guide-card-grid"><article class="guide-card"><span>1 · Purpose</span><h3>Home, relocation or investment?</h3><p>Define how the property will be used, when it is needed and how long it may be held.</p></article><article class="guide-card"><span>2 · Budget</span><h3>What is the usable total?</h3><p>Keep acquisition costs, finance, furnishing and a liquidity reserve outside the headline price.</p></article><article class="guide-card"><span>3 · Market</span><h3>Which communities fit?</h3><p>Screen area activity, budget, property type, supply and resident demand before shortlisting projects.</p></article><article class="guide-card"><span>4 · Evidence</span><h3>Which exact property holds up?</h3><p>Compare title or project status, contract, condition, costs, rent and directly competing stock.</p></article></div>`},
      {id:'budget-tools',title:'Build a usable acquisition budget',html:`
        <p>Read the <a href="/dubai-property-buying-costs/">Dubai buying-cost guide</a>, then enter the actual price and payment assumptions into the <a href="/dubai-property-buying-cost-calculator/">buying-cost calculator</a>. Keep estimates editable until the contract, DLD statement, lender offer and written quotations are available.</p>
        <div class="guide-callout"><strong>Budget rule</strong><p>The property price is one line in the cash plan. Preserve a reserve for valuation shortfall, repairs, vacancy and changing personal circumstances.</p></div>`},
      {id:'community-property',title:'Move from community to property',html:`
        <p>Use <a href="/best-dubai-communities-by-budget/">Dubai communities by budget</a> for the first research shortlist and <a href="/dubai-data/">Dubai Data</a> for area-level evidence. Then narrow the comparison to the same property type, size, status and micro-location.</p>
        <p>A popular community does not make every building, project or unit suitable. Access, layout, view, condition, management, service charges and future supply remain property-specific.</p>`},
      {id:'status-finance',title:'Compare property status and payment route',html:`
        <p>The <a href="/off-plan-vs-ready-property-dubai/">off-plan versus ready guide</a> compares inspection, payment timing, income and delivery risk. The <a href="/mortgage-vs-cash-dubai-property/">mortgage versus cash guide</a> tests finance cost, liquidity, valuation and downside scenarios.</p>
        <p>Use the same purpose, holding period and usable cash assumptions across both comparisons so a payment plan or mortgage offer does not conceal a higher total commitment.</p>`},
      {id:'income-evidence',title:'Test rental income and local evidence',html:`
        <p>For an investment purchase, use the <a href="/dubai-rental-yield-calculator/">rental-yield calculator</a> to compare gross and net performance. Enter achievable rent, vacancy, service charges, maintenance and management rather than a marketing yield.</p>
        <p>Area data is a screen. Building-level leases, unit condition and competing listings are needed before setting a property-level expectation.</p>`},
      {id:'international-buyers',title:'Use the right international-buyer route',html:`
        <p>Buyers funding from India can use the <a href="/dubai-property-investment-indian-buyers/">Indian buyer guide</a> for ownership, remittance and reporting questions. UK buyers can use the <a href="/dubai-property-investment-uk-buyers/">UK buyer guide</a> for ownership, GBP funding and foreign-income or gain considerations.</p>
        <p>These pages are planning frameworks, not personal legal, tax or investment advice. Confirm the current position for the buyer and transaction before signing or remitting funds.</p>`},
      {id:'buyer-brief',title:'Turn the research into a buyer brief',html:`
        <ol><li>State the purchase purpose and likely holding period.</li><li>Use the all-in budget and payment route.</li><li>List property type, ready or off-plan preference and non-negotiable requirements.</li><li>Name the researched areas and explain why they fit.</li><li>Record the required rent, move-in or completion timeline.</li><li>Send the <a href="/buy-invest-dubai/#buyer-enquiry">structured buyer brief</a> before requesting current property options.</li></ol>`}
    ],
    faqs:[
      ['What is the first step when buying property in Dubai?','Define the purpose, usable all-in budget, payment route and timeline before comparing communities or projects.'],
      ['Which Dubai property calculator should an investor use?','Use the buying-cost calculator for upfront acquisition cash and the rental-yield calculator for gross and net income scenarios.'],
      ['Should I choose a community before a project?','Start with communities that fit the budget and use case, then compare the projects, buildings and individual units within those areas.'],
      ['Does the buyer hub show live property availability?','No. It prepares the decision and buyer brief before current availability and property-level evidence are reviewed.']
    ],
    sources:[sharedSources.dldSale,sharedSources.ownership,sharedSources.escrow,sharedSources.cbuae]
  },
  {
    ...cluster[8],
    eyebrow:'Jebel Ali Village property guide',
    answerTitle:'How should buyers assess Jebel Ali Village after handover begins?',
    summary:'The reported start of handover for 892 homes moves Jebel Ali Village from a construction-led story toward observable property and community evidence. Buyers and investors can now place more weight on snagging, finished quality, access, amenity readiness, service costs, actual listings and leasing or resale competition. The handover total itself is not a yield or price forecast.',
    points:['Separate handed-over homes from occupied homes and operating amenities.','Inspect the exact property and community before using launch material.','Calculate net yield with achievable rent, vacancy and ownership costs.'],
    snapshotTitle:'Handover creates evidence—and simultaneous competition.',
    snapshotText:'The strongest decision compares the exact home with completed alternatives and allows for multiple owners listing at the same time.',
    snapshot:[['Reported milestone','892 homes entering handover'],['Primary check','Unit and community inspection'],['Investor tool','Net yield on total cost']],
    heroImage:'/images/jebel-ali-village-property-investment-guide.webp',
    heroAlt:'Property analyst reviewing a community plan above landscaped homes in Jebel Ali Village',
    sections:[
      {id:'handover-signal',title:'What the 892-home handover signal means',html:`
        <p>The source report says Nakheel has begun handover of 892 homes at Jebel Ali Village. That is a project-specific delivery milestone. It does not mean every home is occupied, every amenity is operating or every resale and rental listing has the same evidence.</p>
        <p>A concentrated handover can improve transparency because buyers can inspect completed homes and owners can observe management, access, service processes and early leasing demand. It can also bring several similar units to market together.</p>`},
      {id:'property-inspection',title:'Jebel Ali Village handover and inspection checklist',html:`
        <ol><li>Match the handover notice and property identifiers to the purchase documents.</li><li>Inspect finishes, building systems, external areas, boundaries and any included fixtures.</li><li>Record defects, response deadlines, warranty and rectification procedures.</li><li>Confirm access roads, utilities, waste, security and the amenities operating now.</li><li>Obtain the current service or community charge basis and initial payment dates.</li><li>Check occupancy, title, mortgage and developer requirements for the intended transfer or lease.</li></ol>`},
      {id:'rental-yield',title:'How to estimate Jebel Ali Village rental yield',html:`
        <p>Do not apply a citywide or marketing yield to a newly handed-over home. Start with achievable rent for the closest matching property type and position, then allow for vacancy while the community and listing market settle.</p>
        <p>Enter purchase price, buying costs, service charges, maintenance, management and vacancy in the <a href="/dubai-rental-yield-calculator/">Dubai rental-yield calculator</a>. Compare gross yield, net yield and net yield on total acquisition cost.</p>
        <div class="guide-callout"><strong>Avoid the highest-listing bias</strong><p>Asking rent is evidence of owner expectation, not a completed lease. Use verified or registered evidence where available and run a conservative case.</p></div>`},
      {id:'resale',title:'How to assess resale competition',html:`
        <p>Map homes that are handed over, advertised, tenanted and owner-occupied separately. Several owners may list similar properties after receiving keys, so condition, plot or position, landscaping, view, upgrades and asking strategy can affect the sale period.</p>
        <p>Compare the exact property with completed nearby alternatives on usable space, access, finished quality, recurring cost and resident demand. The <a href="/dubai-property-buyer-hub/">Dubai Property Buyer Hub</a> connects this community work to costs, payment and ready-versus-off-plan decisions.</p>`},
      {id:'buyer-checklist',title:'Buyer questions before reserving or offering',html:`
        <ul><li>Is the home complete, handed over, vacant, occupied or tenanted?</li><li>Which roads, facilities and community services are operating today?</li><li>What defects, warranties, service costs and initial capital work are documented?</li><li>How many closely comparable homes are for rent or resale?</li><li>What rent or transaction evidence matches the property type and condition?</li><li>Does the all-in budget preserve a reserve after transfer and preparation?</li></ul>
        <p>Use the <a href="/dubai-property-buying-cost-calculator/">buying-cost calculator</a>, then submit the <a href="/buy-invest-dubai/#buyer-enquiry">buyer brief</a> with the exact property status and objective.</p>`}
    ],
    faqs:[
      ['Is Jebel Ali Village completed?','The cited report says handover has begun for 892 homes. Completion, owner handover, occupancy and amenity operation should be confirmed for the exact property and date.'],
      ['What rental yield can Jebel Ali Village produce?','There is no defensible universal yield. Calculate it from the specific price, achievable rent, vacancy, service charges, maintenance, management and buying costs.'],
      ['What should I inspect at Jebel Ali Village handover?','Inspect the home, external areas, systems, boundaries and included fixtures, then document defects and confirm warranties, access, utilities, amenities and service costs.'],
      ['Can several handovers affect resale or rent?','Yes. Multiple similar owner listings can increase short-term competition, although the effect varies by property position, condition, asking strategy and tenant or buyer demand.']
    ],
    sources:[sharedSources.jebelAli,sharedSources.dldSale,sharedSources.ownership]
  }
];

function escapeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c');}

function header(){return `<header class="site-header"><nav class="nav-shell" aria-label="Main navigation"><a class="brand" href="/" aria-label="James Realty">James Realty</a><div class="nav-links global-links"><a href="/">Home</a><details class="goal-nav is-current"><summary>Your Goal <span class="goal-nav-caret" aria-hidden="true">⌄</span></summary><div class="goal-nav-menu"><a href="/buy-invest-dubai/" aria-current="page">Buy / Invest</a><a href="/sell-dubai-property/">Sell</a><a href="/real-estate-marketing/">Marketing</a></div></details><a href="/dubai-data/">Dubai Data</a><a href="/abu-dhabi-data/">Abu Dhabi Data</a><a href="/ajman-data/">Ajman Data</a><a href="/about-me/">About Me</a><a href="/blog/">News</a><a href="/contact/">Contact Me</a></div><a class="button nav-cta nav-whatsapp" href="/contact/?goal=buy">Start enquiry <span aria-hidden="true">→</span></a></nav></header><nav class="mobile-page-tabs section-shell" aria-label="Page navigation"><a href="/">Home</a><details class="goal-nav is-current"><summary>Your Goal <span class="goal-nav-caret" aria-hidden="true">⌄</span></summary><div class="goal-nav-menu"><a href="/buy-invest-dubai/" aria-current="page">Buy / Invest</a><a href="/sell-dubai-property/">Sell</a><a href="/real-estate-marketing/">Marketing</a></div></details><a href="/dubai-data/">Dubai Data</a><a href="/abu-dhabi-data/">Abu Dhabi Data</a><a href="/ajman-data/">Ajman Data</a><a href="/about-me/">About Me</a><a href="/blog/">News</a><a href="/contact/">Contact Me</a></nav>`;}

function footer(){return `<footer><div class="section-shell footer-shell footer-shell-rich"><div class="footer-identity"><a class="brand" href="/">James Realty</a><p>© 2026 James. Built in Dubai.</p></div><nav class="footer-links" aria-label="Footer navigation"><a href="/">Home</a><a href="/buy-invest-dubai/">Buy / Invest</a><a href="/sell-dubai-property/">Sell</a><a href="/real-estate-marketing/">Marketing</a><a href="/dubai-data/">Dubai Data</a><a href="/abu-dhabi-data/">Abu Dhabi Data</a><a href="/ajman-data/">Ajman Data</a><a href="/blog/">News</a><a href="/about-me/">About Me</a><a href="/contact/">Contact Me</a><a href="/cite/">Cite this site</a></nav><a class="footer-linkedin" href="https://ae.linkedin.com/in/james-ravi-dubai" target="_blank" rel="me noreferrer">LinkedIn <span aria-hidden="true">↗</span></a></div></footer>`;}

function schema(page){
  const url=`${domain}/${page.slug}/`;
  const graph=[
    {'@type':'WebPage','@id':`${url}#webpage`,url,name:page.title,description:page.description,inLanguage:'en-AE',datePublished:'2026-08-03',dateModified:'2026-08-03',isPartOf:{'@id':`${domain}/#website`},about:[{'@type':'Thing',name:'Dubai property buying'},{'@type':'Thing',name:page.label}],breadcrumb:{'@id':`${url}#breadcrumb`},speakable:{'@type':'SpeakableSpecification',cssSelector:['#guide-title','#direct-answer','#guide-faq-title']}},
    {'@type':'BreadcrumbList','@id':`${url}#breadcrumb`,itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${domain}/`},{'@type':'ListItem',position:2,name:'Buy / Invest',item:`${domain}/buy-invest-dubai/`},{'@type':'ListItem',position:3,name:page.label,item:url}]},
    {'@type':'FAQPage','@id':`${url}#faq`,mainEntity:page.faqs.map(([name,text])=>({'@type':'Question',name,acceptedAnswer:{'@type':'Answer',text}}))}
  ];
  if(page.isCalculator){graph.push({'@type':'WebApplication','@id':`${url}#calculator`,name:'Dubai Property Buying Cost Calculator',url,applicationCategory:'FinanceApplication',operatingSystem:'Any',browserRequirements:'JavaScript enabled',offers:{'@type':'Offer',price:'0',priceCurrency:'AED'},description:page.description,featureList:['DLD registration estimate','Trustee fee logic','Agency and VAT estimate','Mortgage registration estimate','Upfront cash estimate']});}
  else{graph.push({'@type':'Article','@id':`${url}#article`,headline:page.title,description:page.description,datePublished:'2026-08-03',dateModified:'2026-08-24',mainEntityOfPage:url,author:{'@type':'Person',name:'James Ravi',url:`${domain}/about-me/`},publisher:{'@type':'Organization',name:'James Realty',url:`${domain}/`},image:page.heroImage?domain+page.heroImage:socialImage,citation:page.sources.map(source=>source[1])});}
  return {'@context':'https://schema.org','@graph':graph};
}

function related(page){
  const hub=cluster.find(item=>item.slug==='dubai-property-buyer-hub');
  const other=cluster.filter(item=>item.slug!==page.slug&&item.slug!=='dubai-property-buyer-hub');
  const jebel=cluster.find(item=>item.slug==='jebel-ali-village-property-investment');
  const hubItems=[jebel,...other.filter(item=>item.slug!=='jebel-ali-village-property-investment')].filter(Boolean).slice(0,6);
  const items=page.slug==='dubai-property-buyer-hub'?hubItems:[hub,...other].filter(Boolean).slice(0,6);
  return `<section class="cluster-related-section"><div class="section-shell"><div class="cluster-related-heading"><div><p class="section-kicker">Buy / Invest cluster</p><h2>Continue the Dubai buying decision.</h2></div><p>Use the related guide that answers the next financial, property or due-diligence question.</p></div><div class="cluster-related">${items.map(item=>`<a class="buyer-cluster-card" href="/${item.slug}/"><span>${item.label}</span><h3>${item.title.replace(' | James Realty','')}</h3><p>${item.short}</p><strong>Open guide →</strong></a>`).join('')}</div></div></section>`;
}

function render(page){
  const url=`${domain}/${page.slug}/`;
  const toc=page.sections.map(section=>`<a href="#${section.id}">${section.title}</a>`).join('');
  const sections=page.sections.map(section=>`<section id="${section.id}" class="guide-section"><h2>${section.title}</h2>${section.html}</section>`).join('');
  const sources=page.sources.map(([label,href])=>`<li><a href="${href}" target="_blank" rel="external noopener noreferrer">${label}</a></li>`).join('');
  const faqs=page.faqs.map(([question,answer])=>`<details><summary>${question}</summary><p>${answer}</p></details>`).join('');
  return `<!DOCTYPE html>
<html lang="en-AE"><head><!-- Google Tag Manager --><script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-M74SL57L');</script>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${page.title}</title><meta name="description" content="${page.description}"/><meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1"/><link rel="canonical" href="${url}"/><link rel="alternate" hreflang="en-AE" href="${url}"/><link rel="alternate" hreflang="x-default" href="${url}"/><link rel="icon" href="/favicon.svg"/><link rel="apple-touch-icon" href="/favicon-192.png"/><link rel="manifest" href="/site.webmanifest"/><meta name="author" content="James Ravi"/><meta name="theme-color" content="#0a0a1a"/><meta property="og:type" content="${page.isCalculator?'website':'article'}"/><meta property="og:locale" content="en_AE"/><meta property="og:site_name" content="James Realty"/><meta property="og:title" content="${page.title}"/><meta property="og:description" content="${page.description}"/><meta property="og:url" content="${url}"/><meta property="og:image" content="${socialImage}"/><meta property="og:image:secure_url" content="${socialImage}"/><meta property="og:image:type" content="image/jpeg"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta property="og:image:alt" content="Property adviser presenting a UAE residential development to two buyers in a naturally lit sales gallery"/><meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${page.title}"/><meta name="twitter:description" content="${page.description}"/><meta name="twitter:image" content="${socialImage}"/><meta name="twitter:image:alt" content="UAE property consultation with a residential development model and skyline view"/><link rel="stylesheet" href="/_next/static/css/5576f66c8ff02a6a.css?v=12"/><link rel="stylesheet" href="/assets/conversion.css?v=2"/><link rel="stylesheet" href="/assets/seo-answer.css?v=1"/><link rel="stylesheet" href="/assets/header-goal-nav.css?v=2"/><link rel="stylesheet" href="/assets/buyer-cluster.css?v=1"/><script type="application/ld+json">${escapeJson(schema(page))}</script><script defer src="/assets/site.js?v=10"></script>${page.isCalculator?'<script defer src="/assets/buying-cost-calculator.js?v=1"></script>':''}</head>
<body><noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M74SL57L" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript><a class="skip-link" href="#main-content">Skip to main content</a>${header()}<main id="main-content" class="buyer-guide-page"><nav class="section-shell guide-breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/buy-invest-dubai/">Buy / Invest</a><span aria-hidden="true">/</span><span aria-current="page">${page.label}</span></nav><section class="section-shell guide-hero" aria-labelledby="guide-title"><div class="guide-hero-copy"><span class="eyebrow">${page.eyebrow}</span><h1 id="guide-title">${page.title.replace(' | James Realty','')}</h1><p>${page.description}</p><div class="guide-hero-actions"><a class="button button-primary" href="/contact/?goal=buy">Start a buyer enquiry <span aria-hidden="true">→</span></a><a class="button button-outline" href="/dubai-data/">Open Dubai Data</a></div></div><aside class="guide-snapshot">${page.heroImage?`<img class="guide-snapshot-image" src="${page.heroImage}" alt="${page.heroAlt||page.title}" width="1200" height="750" loading="eager" decoding="async"/>`:''}<span>Decision snapshot</span><strong>${page.snapshotTitle}</strong><p>${page.snapshotText}</p><dl>${page.snapshot.map(([term,value])=>`<div><dt>${term}</dt><dd>${value}</dd></div>`).join('')}</dl></aside></section><section class="section-shell guide-answer" aria-labelledby="direct-answer"><div class="guide-answer-card"><p class="section-kicker">Direct answer</p><h2 id="direct-answer">${page.answerTitle}</h2><p>${page.summary}</p><ul class="guide-answer-points">${page.points.map(point=>`<li>${point}</li>`).join('')}</ul></div></section><div class="section-shell guide-layout"><aside class="guide-toc" aria-label="On this page"><strong>On this page</strong>${toc}<a href="#guide-sources">Official sources</a><a href="#guide-faq-title">FAQs</a></aside><article class="guide-content">${sections}<section id="guide-sources" class="guide-section guide-sources"><h2>Official sources and review basis</h2><ol>${sources}</ol><p class="guide-updated">Reviewed 3 August 2026. Government fees, finance rules and tax treatment can change; confirm the transaction-specific position before signing or remitting funds.</p></section></article></div>${related(page)}<section class="section-shell cluster-cta" aria-labelledby="cluster-cta-title"><div><p class="section-kicker">From research to a buyer brief</p><h2 id="cluster-cta-title">Apply the guide to your budget and timeline.</h2><p>Share the purpose, budget, payment route, property type and timing so the first conversation can start with a focused brief.</p></div><div class="cluster-cta-actions"><a class="button button-primary" href="/buy-invest-dubai/#buyer-enquiry">Build a buyer brief</a><a class="button button-outline" href="/contact/?goal=buy">Contact Me</a></div></section><section class="section-shell guide-faq article-faq" aria-labelledby="guide-faq-title"><p class="section-kicker">Buyer questions</p><h2 id="guide-faq-title">Frequently asked questions</h2>${faqs}</section></main><a class="mobile-conversion nav-whatsapp" href="/contact/?goal=buy">Start buyer enquiry</a>${footer()}</body></html>`;
}

for(const page of pages){
  const dir=path.join(root,page.slug);
  fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'index.html'),render(page));
}

const buyInvestPath=path.join(root,'buy-invest-dubai','index.html');
if(fs.existsSync(buyInvestPath)){
  let html=fs.readFileSync(buyInvestPath,'utf8');
  if(!html.includes('href="/dubai-property-buyer-hub/"')){
    const hubCard='<a class="buyer-cluster-card" href="/dubai-property-buyer-hub/"><span>Buyer hub</span><h3>Dubai property buyer hub</h3><p>Connect purpose, budget, community, status, finance, yield and due diligence.</p><strong>Start with the hub →</strong></a>';
    html=html.replace('<div class="cluster-related">','<div class="cluster-related">'+hubCard);
  }
  if(!html.includes('href="/jebel-ali-village-property-investment/"')){
    const jebelCard='<a class="buyer-cluster-card" href="/jebel-ali-village-property-investment/"><span>Jebel Ali Village</span><h3>Investment and handover guide</h3><p>Inspect the community, model net yield and assess simultaneous resale supply.</p><strong>Open Jebel Ali guide →</strong></a>';
    html=html.replace('<div class="cluster-related">','<div class="cluster-related">'+jebelCard);
  }
  fs.writeFileSync(buyInvestPath,html);
}

const sitemapPath=path.join(root,'sitemap.xml');
if(fs.existsSync(sitemapPath)){
  let xml=fs.readFileSync(sitemapPath,'utf8');
  const growthUrls=[`${domain}/dubai-property-buyer-hub/`,`${domain}/jebel-ali-village-property-investment/`];
  for(const growthUrl of growthUrls){
    if(!xml.includes(`<loc>${growthUrl}</loc>`)){
      xml=xml.replace('</urlset>',`  <url>\n    <loc>${growthUrl}</loc>\n    <lastmod>2026-08-24</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n</urlset>`);
    }
  }
  fs.writeFileSync(sitemapPath,xml);
}

console.log(`Generated ${pages.length} Buy / Invest cluster pages.`);
