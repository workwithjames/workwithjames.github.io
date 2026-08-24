#!/usr/bin/env python3
"""One-time repair for misclassified automated property-news briefs."""

from __future__ import annotations

import importlib.util
import json
import re
import sys
import types
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / "data/property-news-state.json"
SITE = "https://jamesrealty.uk"

REMOVE = {
    "property-news-2026-08-03-reading-the-latest-dubai-luxury-property-signal-c8cec",  # duplicates curated AED110m analysis
    "property-news-2026-08-04-uae-housing-supply-what-buyers-and-owners-should-check-nex-32dea",  # London project
    "property-news-2026-08-12-how-to-read-the-latest-sharjah-property-market-signal-34fcf",  # UK construction story
    "property-news-2026-08-12-reading-the-latest-uae-luxury-property-signal-2c263",  # non-property finance story
}

UPDATES = {
    "property-news-2026-08-17-reading-the-latest-dubai-luxury-property-signal-9428c": {
        "title": "Nakheel begins handover of 892 homes at Jebel Ali Village",
        "description": "What Nakheel's 892-home Jebel Ali Village handover means for buyers, owners and Dubai's delivery pipeline.",
        "category": "Dubai handovers", "image": "/images/property-news/jebel-ali-village-892-home-handover.webp",
        "quick": "Nakheel has begun handing over 892 homes at Jebel Ali Village. This is a project-specific delivery milestone—not evidence that every nearby villa has the same value, completion quality or rental outlook.",
        "reported": "The source reports the start of handovers for 892 homes at Jebel Ali Village. Buyers and owners should distinguish the number of delivered homes from occupied homes, completed amenities and future phases.",
        "analysis": [("What a large handover changes", "A concentrated handover expands usable housing stock and starts the transition from construction site to lived community. Leasing, resale and service performance become easier to observe.", "It can also create near-term competition when multiple owners list similar homes. Unit position, condition, landscaping and asking strategy matter."), ("Inspect the property and community", "Handover notices are not substitutes for snagging. Check finishes, systems, boundaries, warranties, access, common areas and the process for defects.", "Confirm which amenities and roads are operating now, which remain under construction and how service or community charges are calculated."), ("Questions for buyers and landlords", "Compare the exact home with completed and recently handed-over alternatives using plot, built-up area, location, specification and verified rent or sale evidence.", "Ask whether the unit is vacant, owner-occupied or tenanted and model initial maintenance, furnishing, vacancy and management costs.")],
    },
    "property-news-2026-08-15-how-to-read-the-latest-dubai-property-market-signal-3e09d": {
        "title": "Dubai attracts 186 new property developers in seven months",
        "description": "Dubai added 186 property developers in the first seven months of 2026; what more competition means for project due diligence.",
        "category": "Dubai developers", "image": "/images/property-news/dubai-186-new-property-developers-2026.webp",
        "quick": "The reported arrival of 186 developers broadens buyer choice and competition. It also makes developer, escrow, project registration, delivery evidence and contract review more important—not less.",
        "reported": "The source reports that Dubai attracted 186 new property developers during the first seven months of 2026. The count signals market participation; it does not measure the quality, funding or delivery readiness of every project.",
        "analysis": [("More developers means more comparison", "Greater competition can increase choice in location, format, design and payment schedules. Buyers should compare the same unit type and total cost rather than headline incentives.", "A new market entrant may have experienced management or funding, but the local project and legal entity still need verification."), ("Verify before reserving", "Check the developer and project through official Dubai channels, confirm the escrow account, request the dated price sheet and review the SPA and cancellation terms.", "Marketing scale, launch-event demand and social-media visibility are not construction or completion evidence."), ("Watch supply at district level", "Citywide developer growth does not affect every community equally. Map announced units, construction progress and completed alternatives within the project's real catchment.", "A defensible decision includes slower delivery, softer rent and resale competition in its downside case.")],
    },
    "property-news-2026-08-14-how-to-read-the-latest-dubai-property-market-signal-96e5c": {
        "title": "Zoya says Elinor sold out in under two weeks",
        "description": "How buyers should interpret Zoya Developments' reported Elinor sell-out without treating launch velocity as guaranteed resale demand.",
        "category": "Dubai launches", "image": "/images/property-news/zoya-elinor-dubai-project-launch-sellout.webp",
        "quick": "A reported sell-out in under two weeks indicates strong launch absorption for that release. It does not guarantee construction delivery, rental performance, assignment liquidity or price growth for an individual unit.",
        "reported": "The source reports that Zoya Developments sold out its Elinor project in under two weeks. Confirm whether this refers to all units, a release tranche or signed sales, and separate reservations from completed registrations where possible.",
        "analysis": [("What sell-out speed can show", "Fast absorption may reflect launch pricing, limited release size, broker distribution, incentives or genuine buyer demand. The cause matters when assessing whether momentum can persist.", "Compare the project with ready and off-plan alternatives in the same location and bedroom range."), ("What it does not prove", "Sell-out language does not establish future rent, completion, service charges, resale price or the availability of an assignment market.", "Review the developer entity, project registration, escrow, construction plan and contract before paying."), ("Questions for an early buyer", "Ask for the exact unit, floor plan, view, price, payment dates and all fees. Check how many similar units could return to market before completion.", "Model a hold-to-completion case rather than depending on an early resale.")],
    },
    "property-news-2026-08-13-how-to-read-the-latest-abu-dhabi-property-market-signal-abda4": {
        "title": "UAE's top 10 developers record AED 113.7bn in six-month sales",
        "description": "What AED 113.7 billion in reported first-half sales says about UAE developer demand—and what it cannot tell a buyer.",
        "category": "UAE developer sales", "image": "/images/property-news/uae-top-developers-six-month-sales.webp",
        "quick": "AED 113.7 billion in reported sales by the UAE's top 10 developers is a market-scale demand signal. It does not validate the price, quality or return case of every project sold by those companies.",
        "reported": "The source reports AED 113.7 billion of property sales across the UAE's top 10 developers over six months. The aggregate combines different emirates, project stages, property types and price bands.",
        "analysis": [("Read an aggregate carefully", "Developer sales can reflect new launches, price levels, instalment structures and geographic expansion as well as underlying unit demand.", "Compare sales with backlog, construction progress, cash collection and delivered stock where reliable disclosure exists."), ("Developer strength is project context", "A large developer can bring execution experience and buyer recognition, but the legal seller, escrow, contract and project economics remain specific.", "Ask how the selected unit compares with the developer's own future releases and nearby ready supply."), ("Use property-level evidence", "Test the unit price, usable layout, view, service-cost estimate, payment schedule, tenant profile and resale competition.", "Portfolio-wide sales are not a substitute for registered transactions and rents in the property's micro-market.")],
    },
    "property-news-2026-08-13-uae-rental-update-what-tenants-and-landlords-should-verify-cbf17": {
        "title": "Monthly rent expands across UAE apartments: checks for tenants",
        "description": "Monthly rent can improve payment flexibility; tenants and landlords should still compare total rent, fees, renewal and contract terms.",
        "category": "UAE rental market", "image": "/images/property-news/uae-monthly-apartment-rent-options.webp",
        "quick": "Monthly payment options can reduce the size of each rent payment, but flexibility may carry a higher total price or separate service fee. Compare the annualised cost and registered tenancy terms.",
        "reported": "The source examines the growth of monthly apartment rent options in the UAE. Product availability varies by building, landlord and payment provider and should not be treated as a market-wide standard.",
        "analysis": [("Compare the full annual cost", "Convert monthly payments, fees, deposit, utilities and renewal charges into one annual figure and compare it with one-, two- or four-cheque alternatives.", "A smaller payment is not automatically a lower rent."), ("Check the legal relationship", "Establish who is the landlord, who collects payments, what contract is registered and what happens if the payment service fails or a debit is missed.", "Read cancellation, late-payment, renewal and data-sharing terms before signing."), ("Landlord and tenant questions", "Tenants should check affordability across the full term. Landlords should assess counterparty, settlement timing, default handling and effect on the tenancy contract.", "Keep receipts and ensure agreed terms are reflected in the signed and registered documents.")],
    },
    "property-news-2026-08-13-dubai-housing-supply-what-buyers-and-owners-should-check-n-8ca93": {
        "title": "Dubai plans zero-interest Rent Now, Pay Later service",
        "description": "How a reported zero-interest Rent Now, Pay Later service could change cash flow—and which fees and tenancy terms to verify.",
        "category": "Dubai rental payments", "image": "/images/property-news/dubai-rent-now-pay-later-service.webp",
        "quick": "A zero-interest rent instalment service could improve tenant cash flow, but 'zero interest' does not necessarily mean zero total cost. Verify eligibility, fees, payment dates and the registered tenancy terms.",
        "reported": "The source reports plans for a Dubai Rent Now, Pay Later service using zero-interest instalments. Launch timing, providers, eligibility and complete commercial terms should be confirmed before relying on the option.",
        "analysis": [("Separate interest from total cost", "Ask about setup, platform, late-payment, card, settlement and cancellation charges and compare the annualised amount with conventional rent payment terms.", "A promotional rate may be conditional or time-limited."), ("Keep the tenancy documents aligned", "Confirm the landlord, registered contract amount, payment recipient and what happens to the lease if an instalment is late or disputed.", "Tenants should not transfer funds through an unverified link or account."), ("Use flexibility responsibly", "More frequent payments can help match salary cash flow, while creating more payment events and possible default triggers.", "Landlords should understand settlement timing and counterparty risk before accepting a new structure.")],
    },
    "property-news-2026-08-12-how-to-read-the-latest-dubai-property-market-signal-21f76": {
        "title": "Moody's reviews Binghatti ratings amid regional risk",
        "description": "What a reported Moody's Binghatti rating review means for property buyers, and why project escrow and contracts remain separate checks.",
        "category": "Developer credit", "image": "/images/property-news/binghatti-credit-rating-review.webp",
        "quick": "A rating review is a corporate credit signal, not a direct ruling on every Binghatti project or buyer contract. Buyers should read the rating rationale and separately verify the project, escrow, construction and SPA.",
        "reported": "The source reports that Moody's was considering a ratings downgrade for Dubai-based Binghatti amid regional risk. Use the rating agency's own release for the precise instruments, status and rationale.",
        "analysis": [("Understand what is rated", "A corporate or debt rating addresses credit risk for specified obligations. It does not value an apartment, guarantee delivery or replace legal project protections.", "Check whether the reported action is a review, outlook change or completed downgrade."), ("Connect corporate and project evidence", "Review audited or official disclosure where available, then verify project registration, escrow, construction progress and the legal seller for the selected unit.", "Payment-plan attractiveness should not override contract or funding questions."), ("Avoid binary conclusions", "A review is neither proof of failure nor irrelevant. It is one input alongside liquidity, backlog, delivery record and the project's ring-fenced processes.", "Buyers should maintain a downside plan for delay, assignment limits and completion funding.")],
    },
    "property-news-2026-08-10-dubai-housing-supply-what-buyers-and-owners-should-check-n-5f565": {
        "title": "Former Dubai Zoo site moves toward a 90-home community",
        "description": "A construction contract for 90 homes at the former Dubai Zoo site highlights a small, central-community supply story.",
        "category": "Dubai construction", "image": "/images/property-news/former-dubai-zoo-residential-construction.webp",
        "quick": "A reported construction contract for a 90-home community at the former Dubai Zoo site advances a distinctive central project. Buyers should wait for official project, unit and sales documentation before assuming timing or availability.",
        "reported": "The source reports a construction contract covering 90 homes at the former Dubai Zoo site. A contract award is a delivery milestone, not a completed handover or a statement that units remain for sale.",
        "analysis": [("Why a small central scheme differs", "A limited number of homes and an established urban location can create a different supply profile from a large peripheral master community.", "Access, privacy, plot or unit design and surrounding development still determine individual appeal."), ("Follow construction evidence", "Track mobilisation, contractor and consultant disclosures, regulator records and official progress rather than an indicative launch timeline.", "Review the SPA's completion and delay provisions for any offered unit."), ("Compare the location premium", "Test the advertised price against completed homes with similar access, space, quality and scarcity.", "A historic site narrative may aid marketing but does not replace usable-area, condition, fee and resale evidence.")],
    },
    "property-news-2026-08-07-dubai-housing-supply-what-buyers-and-owners-should-check-n-76b75": {
        "title": "Emaar Development reports AED 22.4bn sales and 43% profit growth",
        "description": "What Emaar Development's reported first-half sales and profit growth says about demand, backlog and project-level buying checks.",
        "category": "Developer results", "image": "/images/property-news/emaar-development-sales-profit-2026.webp",
        "quick": "AED 22.4 billion of reported home sales and 43% profit growth show strong corporate performance for the period. They do not determine whether a specific launch, community or unit is fairly priced.",
        "reported": "The source reports AED 22.4 billion of Emaar Development home sales and a 43% increase in first-half profit. Use the company's official results for definitions, period comparison and complete financial context.",
        "analysis": [("Sales and profit answer different questions", "Sales show contracted demand; profit reflects recognised revenue, costs and accounting timing. Neither is the same as cash collected or homes delivered in the period.", "Backlog can support future revenue while also representing execution obligations."), ("Corporate strength versus unit value", "A developer's scale and performance can reduce some execution concerns, but entry price, payment plan, location and competing stock still drive the buyer case.", "Compare current launch pricing with ready and resale alternatives."), ("Check the exact project", "Request dated inventory, floor plan, view, service-cost estimate, construction progress, escrow and SPA for the unit.", "Do not convert corporate profit growth into an assumed property return.")],
    },
    "property-news-2026-08-07-how-to-read-the-latest-dubai-property-market-signal-ff568": {
        "title": "Emaar reports AED 26.6bn sales as backlog reaches AED 164.9bn",
        "description": "How to interpret Emaar's reported AED 26.6 billion sales and AED 164.9 billion backlog without overstating project demand.",
        "category": "Developer backlog", "image": "/images/property-news/emaar-sales-backlog-delivery-pipeline.webp",
        "quick": "Large reported sales and backlog indicate contracted demand and future delivery obligations. They are useful developer context, not a valuation or return forecast for an individual property.",
        "reported": "The source reports AED 26.6 billion in property sales and an AED 164.9 billion backlog for Emaar. Confirm the reporting period, group perimeter and revenue-recognition definitions in official company disclosure.",
        "analysis": [("What backlog represents", "A sales backlog generally reflects contracted future revenue not yet fully recognised. Its timing depends on construction and accounting progress.", "A larger backlog can support visibility while increasing the importance of delivery execution."), ("Use it as one developer check", "Corporate sales, liquidity and delivery record belong in due diligence, alongside the project entity, escrow and current construction.", "They do not answer whether one unit has the right price, layout or view."), ("Compare the property", "Use price per usable area, payment schedule, service costs, local supply, rent evidence and resale liquidity.", "Model completion and holding rather than relying on launch momentum alone.")],
    },
    "property-news-2026-08-07-uae-housing-supply-what-buyers-and-owners-should-check-nex-6f2f1": {
        "title": "DAMAC mortgage event brings UAE banks into buyer discussions",
        "description": "A reported DAMAC mortgage event may help buyers compare lenders; approvals, rates, valuation and total costs remain individual.",
        "category": "Dubai mortgages", "image": "/images/property-news/damac-mortgage-event-uae-banks.webp",
        "quick": "Meeting multiple banks can help a buyer compare indicative mortgage options. It is not a loan approval, a guarantee that a property will value at the purchase price or proof that financing is the best route.",
        "reported": "The source reports a two-day DAMAC mortgage event involving UAE banks. Product availability, eligibility, rates and fees depend on the lender, applicant, property and date.",
        "analysis": [("Compare like with like", "Request the same loan amount, term, rate period and property status from each lender. Separate fixed, variable and promotional pricing.", "Include arrangement, valuation, insurance, registration, early-settlement and account costs."), ("Approval has stages", "An initial conversation or pre-approval is not final credit approval. The lender may still assess income, liabilities, valuation, property and developer eligibility.", "Do not pay a non-refundable amount based only on assumed finance."), ("Test affordability", "Model a higher rate, lower valuation and slower resale as well as the advertised case.", "Compare the mortgage with cash and developer payments while preserving an adequate liquidity reserve.")],
    },
    "property-news-2026-08-06-sharjah-homebuyer-update-a-practical-decision-checklist-d84dc": {
        "title": "Sharjah property deals reach AED 7bn in July",
        "description": "Sharjah's reported AED 7 billion July property activity shows demand; buyers still need area, title and unit-level evidence.",
        "category": "Sharjah property market", "image": "/images/property-news/sharjah-property-deals-july-2026.webp",
        "quick": "AED 7 billion of reported July deals is a strong activity signal for Sharjah. A monthly aggregate combines different locations, land, residential and commercial transactions and cannot price an individual home.",
        "reported": "The source reports AED 7 billion in Sharjah property deals during July and identifies areas receiving buyer spending. Use regulator data for transaction definitions, volumes and geographic detail.",
        "analysis": [("Value is not transaction count", "A high total can reflect a small number of large land or commercial deals as well as many homes. Review volume, property type and median values.", "One active month should be compared with prior periods and seasonality."), ("Ownership and location matter", "Confirm the title and foreign-ownership eligibility for the specific Sharjah project or area.", "Compare commute, amenities, completion, service costs and nearby supply for the target resident."), ("Use micro-market evidence", "Match the property with transactions or rents of the same type, size, condition and community phase.", "Avoid applying an emirate-wide percentage or value total to a single apartment or villa.")],
    },
    "property-news-2026-08-06-how-to-read-the-latest-dubai-property-market-signal-5cfed": {
        "title": "Dubai's 350-metre Trump Tower enters its next construction phase",
        "description": "A reported construction milestone at the 350-metre Trump Tower Dubai: what buyers should verify beyond tower height and brand.",
        "category": "Dubai construction", "image": "/images/property-news/dubai-supertall-tower-construction-phase.webp",
        "quick": "Movement into a new construction phase is relevant progress for a branded tower, but it is not completion. Buyers should verify official progress, contract dates, brand and operator terms, view and recurring costs.",
        "reported": "The source reports that the 350-metre Trump Tower Dubai has moved into its next construction phase. Confirm the precise milestone and current programme through official project updates.",
        "analysis": [("Construction phases need context", "A phase label may describe enabling works, foundations, structure or another milestone. Ask for dated site evidence and the next critical steps.", "The contractual completion provisions matter more than an isolated progress headline."), ("Review the branded premium", "Establish what the brand controls, the duration of agreements, operator responsibilities and service or management charges.", "Compare price and rent with both branded and non-branded completed towers."), ("Verify the exact unit", "Tower height does not determine view quality, lift experience, layout efficiency or sunlight. Check floor, orientation and future surrounding buildings.", "Model completion cash, furnishing, service fees, vacancy and resale competition.")],
    },
    "property-news-2026-08-04-abu-dhabi-housing-supply-what-buyers-and-owners-should-che-1ddff": {
        "title": "Early Abu Dhabi housing completion sets a new delivery benchmark",
        "description": "An early Abu Dhabi housing completion is a positive execution signal; buyers should verify the exact project, quality and contract position.",
        "category": "Abu Dhabi handovers", "image": "/images/property-news/abu-dhabi-early-home-handover.webp",
        "quick": "Early completion can reduce waiting time and demonstrate execution, but buyers still need the contractual date, snagging result, amenity readiness, service costs and unit-level handover documents.",
        "reported": "The source reports an Abu Dhabi housing project completing ahead of its expected schedule. The full article should be used for the named project, timing and developer context.",
        "analysis": [("Define 'early' precisely", "Compare the actual completion or handover notice with the date in the SPA, not only an indicative launch date.", "Completion certification, buyer handover and community readiness may occur at different times."), ("Quality accompanies timing", "Commission professional snagging where appropriate and document finishes, systems, waterproofing, common areas and defects before acceptance.", "Confirm warranty, rectification and utility activation processes."), ("Rework the cash and use plan", "Earlier handover may bring forward final payment, mortgage, service charges, furnishing and leasing activity.", "Buyers should update liquidity and compare the completed unit with current ready-market evidence.")],
    },
    "property-news-2026-08-18-ajman-rental-contracts-reach-dh2-91-billion-in-first-half-06d3d": {
        "title": "Ajman rental contracts reach AED 2.91bn in H1 2026",
        "description": "Ajman's reported AED 2.91 billion of first-half rental contracts is an activity signal; tenants and landlords still need property-level terms.",
        "category": "Ajman rental market", "image": "/images/property-news/ajman-rental-contracts-2026.webp",
        "quick": "AED 2.91 billion of reported rental contracts shows substantial leasing activity in Ajman during the first half. It does not describe the rent, renewal position or condition of every apartment or villa.",
        "reported": "The source reports Ajman rental-contract value reaching AED 2.91 billion in the first half of 2026. Review the source and official Ajman data for the transaction definition, period comparison and property-type breakdown.",
        "analysis": [("Value and contract count are different", "A rise in total contract value can reflect more leases, higher rents, a different property mix or some combination of the three.", "Compare new and renewed contracts separately where the data allows."), ("Move from emirate to building", "Tenants should compare the exact building, unit size, condition, amenities, parking and payment structure.", "Landlords should use relevant registered evidence rather than applying an emirate-wide total to one property."), ("Calculate the complete rental position", "Include deposits, commissions, utility activation, maintenance responsibilities and any payment-plan fees.", "For an investment property, test vacancy, service charges, management and repair costs before relying on gross rent.")],
    },
    "property-news-2026-08-18-two-day-uae-property-showcase-in-hyderabad-targets-indian-b21c8": {
        "title": "Hyderabad UAE property showcase targets Indian investors",
        "description": "How Indian buyers can use a Hyderabad UAE-property showcase without skipping project, payment, remittance and acquisition-cost checks.",
        "category": "India investor events", "image": "/images/property-news/hyderabad-uae-property-showcase.webp",
        "quick": "A local showcase can make projects and advisers easier to compare, but an event is a marketing and information channel—not independent verification of availability, returns, legal terms or remittance treatment.",
        "reported": "The source reports a two-day UAE property showcase in Hyderabad aimed at Indian investors. Confirm participating developers, projects, event dates and any offers directly through official project documentation.",
        "analysis": [("Prepare before the event", "Define purpose, usable budget, payment route, property status and preferred holding period before viewing inventory.", "Use the same written questions for every project so incentives do not replace comparison."), ("Verify the UAE property", "Check developer and project registration, escrow, SPA, construction progress, complete price and all acquisition costs.", "Request a dated unit reference and do not treat a verbal reservation as confirmed availability."), ("Plan the India-to-UAE payment route", "Discuss remittance, banking documentation, exchange-rate exposure and reporting with appropriately qualified advisers.", "Keep source-of-funds records and separate property marketing from personal tax or legal advice.")],
    },
    "property-news-2026-08-19-abu-dhabi-to-add-71-000-homes-by-2030-with-biggest-deliver-29357": {
        "title": "Abu Dhabi plans 71,000 homes by 2030, with 2028 delivery peak",
        "description": "What Abu Dhabi's reported 71,000-home pipeline could mean for buyer choice, rental competition and project-level delivery risk.",
        "category": "Abu Dhabi housing supply", "image": "/images/property-news/abu-dhabi-71000-home-pipeline.webp",
        "quick": "A reported 71,000-home pipeline points to wider future choice, but scheduled supply is not the same as completed, occupied housing. The effect will depend on location, property type, timing and absorption.",
        "reported": "The source reports 71,000 Abu Dhabi homes planned through 2030, with the largest delivery wave expected in 2028. Use the full report for its stated pipeline method, geography and timing assumptions.",
        "analysis": [("Separate schedule from handover", "Track construction progress and historic delivery rather than counting every planned home as completed on the announced date.", "Completion certificates, owner handover and lived community readiness can occur at different times."), ("Map direct competition", "A citywide pipeline does not affect every island, suburb, apartment or villa equally.", "Compare the target property with units of the same type, price band and handover window."), ("Model the absorption period", "Investors should allow for leasing time, initial maintenance, service costs and competing landlord listings.", "End users should compare finished community access and amenities with projects still dependent on future phases.")],
    },
    "property-news-2026-08-19-golden-visa-first-time-buyer-support-flexi-rent-how-dubai-99a12": {
        "title": "Dubai initiatives widen property access for first-time buyers and renters",
        "description": "Golden Visa, first-time-buyer support and flexible rent can widen access, but eligibility, total cost and contract terms remain individual.",
        "category": "Dubai buyer access", "image": "/images/property-news/dubai-property-access-first-time-buyers.webp",
        "quick": "Access initiatives can reduce information or cash-flow barriers for some residents. They do not make every applicant eligible, remove acquisition costs or turn a property into a suitable purchase automatically.",
        "reported": "The source discusses Golden Visa routes, first-time-buyer support and flexible rent as ways Dubai is widening access for buyers and renters. Confirm current eligibility and terms with the relevant official body or provider.",
        "analysis": [("Match the initiative to the objective", "Residency, purchase support and rent-payment flexibility solve different problems and should not be grouped into one financial benefit.", "Start with whether the household is buying, renting or preserving flexibility."), ("Verify current eligibility", "Check official thresholds, dates, qualifying property or applicant criteria and documentary requirements before relying on an initiative.", "Marketing summaries may omit exclusions or later process steps."), ("Calculate the complete commitment", "Buyers should include acquisition, finance and ownership costs; tenants should annualise rent and payment fees.", "Keep a reserve and compare the initiative-supported route with a conventional alternative.")],
    },
    "property-news-2026-08-20-dubai-s-iconic-toyota-building-to-be-demolished-in-2027-0f424": {
        "title": "Dubai's Toyota Building scheduled for demolition in 2027",
        "description": "The reported 2027 demolition raises practical questions for tenants, owners and the next phase of this established Dubai site.",
        "category": "Dubai redevelopment", "image": "/images/property-news/dubai-older-building-demolition-planning.webp",
        "quick": "A named demolition timetable is material for occupiers and surrounding stakeholders, but the news report should not be used to infer a replacement project, future value or individual tenancy outcome.",
        "reported": "The source reports that Dubai's well-known Toyota Building is scheduled to be demolished in 2027. Use notices from the owner, management and relevant authorities for property-specific dates and obligations.",
        "analysis": [("Occupiers need written timelines", "Tenants and businesses should confirm notices, access, utilities, move-out procedures and responsibility for reinstatement or deposits.", "Keep dated records and seek qualified advice on individual contract rights where needed."), ("Do not invent the replacement scheme", "A demolition announcement does not establish the design, use, timing or economics of any future development.", "Wait for official planning, developer and project information."), ("Read the neighbourhood effect carefully", "Redevelopment can change access, construction activity and future land use around a site.", "Nearby owners should assess actual plans and timeframes rather than assuming an automatic price outcome.")],
    },
    "property-news-2026-08-20-uae-developer-arada-unveils-dh5-billion-broadbeach-project-6cad2": {
        "title": "Arada unveils AED 5bn Broadbeach project with 952 homes",
        "description": "Arada's reported Broadbeach project marks UAE developer expansion into Australia; it should be assessed under its local project and market rules.",
        "category": "Developer expansion", "image": "/images/property-news/arada-broadbeach-australia-development.webp",
        "quick": "A UAE developer's expansion into Australia is a corporate and project signal. It does not transfer Dubai market evidence, buyer protections, costs or expected returns to a Gold Coast property.",
        "reported": "The source reports an AED 5 billion Arada project at Broadbeach in Australia containing 952 homes. Use official project and local planning sources for phasing, approvals, sales and delivery information.",
        "analysis": [("Treat it as an Australian project", "Planning, contracts, taxes, ownership costs and buyer protections follow the relevant Australian jurisdiction.", "Do not apply UAE transaction processes or assumptions to the purchase."), ("Test developer and project evidence", "Review the local project entity, approvals, funding, construction team, contract and delivery programme.", "Corporate experience provides context but does not remove site-specific execution risk."), ("Compare the local market", "Assess competing Broadbeach stock, resident and investor demand, recurring costs and resale liquidity.", "Use locally registered evidence and appropriately qualified Australian advice.")],
    },
    "property-news-2026-08-20-dubai-adds-more-than-24-000-property-units-in-six-months-5fb5c": {
        "title": "Dubai adds more than 24,000 property units in six months",
        "description": "Dubai's first-half completion volume gives buyers more finished stock to compare and investors more local supply to model.",
        "category": "Dubai completions", "image": "/images/property-news/dubai-24000-new-property-units.webp",
        "quick": "More than 24,000 reported first-half units is a delivery signal, not a citywide price forecast. The practical effect depends on where, what and how well the homes completed.",
        "reported": "The source reports that Dubai added more than 24,000 property units over six months. Review the report for the exact period, unit definition and location or property-type breakdown.",
        "analysis": [("Completed stock improves comparison", "Ready homes can be inspected for layout, finish, access, common areas and building management.", "Compare registered ready transactions rather than relying only on off-plan launch pricing."), ("Supply pressure is local", "Several similar apartments completing together can increase leasing and resale competition.", "A villa community or established prime building may face a different supply position."), ("Rework the investment case", "Test achievable rent, vacancy, service charges, furnishing, maintenance and leasing time.", "Use the yield calculator with conservative figures and a slower absorption scenario.")],
    },
    "property-news-2026-08-20-investments-in-completed-dubai-property-projects-top-30bn-6a4fc": {
        "title": "Completed Dubai property investment tops $30bn in H1 2026",
        "description": "Reported investment in completed Dubai projects highlights ready-property demand while leaving valuation and net return property-specific.",
        "category": "Dubai ready property", "image": "/images/property-news/completed-dubai-property-investment.webp",
        "quick": "More than $30 billion of reported investment in completed projects is evidence of meaningful ready-property activity. It does not mean every completed building is liquid, well managed or fairly priced.",
        "reported": "The source reports investment in completed Dubai property projects exceeding $30 billion in the first half of 2026. Use the full report for currency, transaction and project-status definitions.",
        "analysis": [("Why ready property attracts buyers", "A completed home can be inspected, valued and potentially occupied or leased sooner than an off-plan unit.", "Established costs and rental evidence may be clearer, but condition and management vary."), ("Inspect beyond the apartment", "Review common areas, service-charge history, reserve position, maintenance, access and the building's competing listings.", "Check title, occupancy and any material alterations for the exact unit."), ("Calculate net performance", "Start with achievable rent rather than the highest asking listing.", "Deduct vacancy, service charges, maintenance, management, finance and transaction costs before comparing investments.")],
    },
    "property-news-2026-08-21-70-of-dubai-s-toyota-building-tenants-have-left-after-powe-f5a2e": {
        "title": "Toyota Building management says 70% of tenants have left",
        "description": "Reported tenant departures after power disruption underline the need for clear notices, records and move-out planning ahead of demolition.",
        "category": "Dubai tenant transition", "image": "/images/property-news/dubai-building-tenants-power-disruption.webp",
        "quick": "A reported 70% tenant departure rate describes one building's transition, not Dubai's wider rental market. Remaining occupiers need property-specific information from management and relevant authorities.",
        "reported": "The source reports management saying 70% of tenants had left Dubai's Toyota Building after power cuts. Refer to the publisher report and direct building notices for sequence, attribution and current arrangements.",
        "analysis": [("Prioritise documented communication", "Occupiers should keep notices, utility messages, tenancy documents, payment records and move-out correspondence together.", "Confirm access, collection of belongings, deposit handling and contact points in writing."), ("Separate reporting from individual rights", "A management statement does not determine every residential or commercial tenant's contract position.", "Use qualified local advice where rights, notice or compensation are disputed."), ("Plan the practical move", "Check alternative premises, moving lead time, utility closures, insurance and business-continuity needs.", "Avoid relying on an informal timetable when a written deadline is available.")],
    },
    "property-news-2026-08-21-dubai-has-96-585-homes-entering-the-market-in-2026-83-are-9eab9": {
        "title": "Dubai has 96,585 homes in its 2026 pipeline; 83% reportedly sold",
        "description": "How to read Dubai's reported 96,585-home pipeline and 83% sold figure without confusing contracts, completion and occupancy.",
        "category": "Dubai housing pipeline", "image": "/images/property-news/dubai-96585-home-supply-pipeline.webp",
        "quick": "A large pipeline and high reported sold share show contracted demand and delivery obligations. They do not mean every unit will complete in 2026, become occupied immediately or avoid resale and rental competition.",
        "reported": "The source reports 96,585 Dubai homes entering the market in 2026 and says 83% are already sold. Review its definitions of pipeline, sold status, geography and expected completion.",
        "analysis": [("Sold, completed and occupied are separate", "A contracted off-plan unit may still be under construction, awaiting handover or held vacant after completion.", "Track actual delivery and occupancy alongside sales status."), ("Map the pipeline by micro-market", "Apartment-heavy districts can experience different leasing pressure from villa communities or limited prime stock.", "Compare the target property's unit type, handover timing and direct competitors."), ("Plan for owner listings", "A high sold share can still create many simultaneous rental or resale listings when investors receive keys.", "Model vacancy, incentives, service charges and a longer marketing period before relying on projected yield.")],
    },
}


def replace_section(text: str, section_id: str, heading: str, paragraphs: tuple[str, str]) -> str:
    block = f'<section id="{section_id}"><h2>{heading}</h2><p>{paragraphs[0]}</p><p>{paragraphs[1]}</p></section>'
    return re.sub(rf'<section id="{re.escape(section_id)}">.*?</section>', block, text, count=1, flags=re.S)


def clean_xml(path: Path, urls: set[str], namespace: str | None = None) -> None:
    if not path.exists():
        return
    tree = ET.parse(path)
    root = tree.getroot()
    if root.tag.endswith("rss"):
        channel = root.find("channel")
        if channel is not None:
            for item in list(channel.findall("item")):
                if item.findtext("link") in urls:
                    channel.remove(item)
    else:
        ns = namespace or "http://www.sitemaps.org/schemas/sitemap/0.9"
        for node in list(root.findall(f"{{{ns}}}url")):
            if node.findtext(f"{{{ns}}}loc") in urls:
                root.remove(node)
    ET.indent(tree, space="  ")
    path.write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(root, encoding="unicode") + "\n", encoding="utf-8")


def purge_removed_blog_schema(path: Path, removed_urls: set[str]) -> None:
    """Remove retired automated URLs from the Blog and ItemList JSON-LD."""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)

    def points_to_removed(value: object) -> bool:
        if not isinstance(value, dict):
            return False
        for key in ("@id", "url", "item"):
            candidate = value.get(key)
            if isinstance(candidate, str) and any(candidate.startswith(url) for url in removed_urls):
                return True
        return False

    def prune(value: object) -> object:
        if isinstance(value, list):
            result = [prune(item) for item in value if not points_to_removed(item)]
            if result and all(isinstance(item, dict) and item.get("@type") == "ListItem" for item in result):
                for position, item in enumerate(result, 1):
                    item["position"] = position
            return result
        if isinstance(value, dict):
            cleaned = {key: prune(item) for key, item in value.items()}
            main = cleaned.get("mainEntity")
            if isinstance(main, dict) and isinstance(main.get("itemListElement"), list):
                main["numberOfItems"] = len(main["itemListElement"])
            return cleaned
        return value

    replacements: list[tuple[int, int, str]] = []
    for match in pattern.finditer(text):
        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            continue
        cleaned = prune(data)
        replacements.append((match.start(), match.end(), '<script type="application/ld+json">' + json.dumps(cleaned, ensure_ascii=False, separators=(",", ":")) + '</script>'))
    for start, end, replacement in reversed(replacements):
        text = text[:start] + replacement + text[end:]
    path.write_text(text, encoding="utf-8")


def load_publisher():
    # The repair uses only the publisher's local rendering/index helpers. Keep
    # it runnable in lightweight build environments where crawler dependencies
    # are installed only in the scheduled-news workflow.
    if "requests" not in sys.modules:
        try:
            __import__("requests")
        except ModuleNotFoundError:
            requests_stub = types.ModuleType("requests")
            requests_stub.Response = object
            sys.modules["requests"] = requests_stub
    if "bs4" not in sys.modules:
        try:
            __import__("bs4")
        except ModuleNotFoundError:
            bs4_stub = types.ModuleType("bs4")
            bs4_stub.BeautifulSoup = object
            sys.modules["bs4"] = bs4_stub
    spec = importlib.util.spec_from_file_location("property_news_autopublish", ROOT / "scripts/property_news_autopublish.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> None:
    publisher = load_publisher()
    state = json.loads(STATE.read_text(encoding="utf-8"))
    old = {post["slug"]: post for post in state["posts"] if post.get("slug")}
    auto_urls = {f'{SITE}/blog/{slug}/' for slug in old if old[slug].get("auto")}

    for slug in REMOVE:
        page = ROOT / "blog" / slug / "index.html"
        if page.exists():
            page.unlink()
        svg = ROOT / "images" / "property-news" / f"{slug}.svg"
        if svg.exists():
            svg.unlink()

    for slug, update in UPDATES.items():
        post = old[slug]
        page = ROOT / "blog" / slug / "index.html"
        text = page.read_text(encoding="utf-8")
        old_title, old_description, old_image = post["title"], post["description"], post["image"]
        text = text.replace(old_title, update["title"]).replace(old_description, update["description"])
        text = text.replace(old_image, update["image"])
        alt = publisher.CURATED_AUTO_IMAGE_ALTS.get(slug, update["description"])
        text = re.sub(r'(<meta property="og:image:alt" content=")[^"]*', rf'\1{alt}', text, count=1)
        text = re.sub(r'(<figure class="article-hero-image news-brief-visual"><img[^>]+alt=")[^"]*', rf'\1{alt}', text, count=1)
        text = text.replace("Automated source brief", "Source-linked property brief")
        text = text.replace("<strong>Automated monitoring:</strong> This original brief was generated after a new property article appeared on a monitored publisher page. It uses the title, summary and factual figures as signals, then adds an independent due-diligence framework.", "<strong>Source monitoring:</strong> This original brief was triggered by a new report on a monitored publisher page. It uses the source's named subject and factual signals, then adds an independent decision framework.")
        text = re.sub(r'(<section class="answer-box" id="quick-answer">.*?<p><strong>).*?(</strong></p></section>)', rf'\1{update["quick"]}\2', text, count=1, flags=re.S)
        text = re.sub(r'<section id="reported">.*?</section>', f'<section id="reported"><h2>What the source reports</h2><p>{update["reported"]}</p><p>The complete publisher report remains linked below for its full context, named sources and methodology.</p></section>', text, count=1, flags=re.S)
        for index, (heading, first, second) in enumerate(update["analysis"], 1):
            text = replace_section(text, f"analysis-{index}", heading, (first, second))
            text = re.sub(rf'(<a href="#analysis-{index}">).*?(</a>)', rf'\1{heading}\2', text, count=1)
        post.update({key: update[key] for key in ("title", "description", "category", "image")})
        current = publisher.Post(**post)
        text = re.sub(r'<section class="news-commercial-route">.*?</section>|<section><h2>Useful internal resources</h2>.*?</section>', publisher.commercial_resources_html(current), text, count=1, flags=re.S)
        text = re.sub(r'<section class="section-shell contact-card">.*?</section>', publisher.commercial_cta_html(current), text, count=1, flags=re.S)
        page.write_text(text, encoding="utf-8")

    state["posts"] = [post for slug, post in old.items() if slug not in REMOVE]
    state["seen_title_signatures"] = []
    STATE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    clean_xml(ROOT / "feed.xml", auto_urls)
    clean_xml(ROOT / "sitemap.xml", auto_urls)
    clean_xml(ROOT / "image-sitemap.xml", auto_urls)

    refreshed = publisher.load_state()
    posts = publisher.ordered_posts(refreshed)
    for post in posts:
        page = ROOT / "blog" / post.slug / "index.html"
        if not page.exists():
            continue
        text = page.read_text(encoding="utf-8")
        text = re.sub(
            r'<section><h2>Related property analysis</h2>.*?</section>',
            publisher.related_links(post.slug, posts),
            text,
            count=1,
            flags=re.S,
        )
        page.write_text(text, encoding="utf-8")
    publisher.update_blog_index(posts)
    purge_removed_blog_schema(publisher.BLOG_INDEX, {f'{SITE}/blog/{slug}/' for slug in REMOVE})
    publisher.write_if_changed(publisher.HUB_PATH, publisher.render_hub(posts))
    publisher.update_feed(posts)
    publisher.update_sitemap(posts)
    publisher.update_image_sitemap(posts)
    publisher.add_internal_links(posts)
    refreshed["seen_title_signatures"] = sorted({publisher.title_signature(post.title) for post in posts})
    publisher.save_state(refreshed)
    print(f"Repaired {len(UPDATES)} briefs; removed {len(REMOVE)} irrelevant or duplicate briefs; retained {len(posts)} total source-led articles.")


if __name__ == "__main__":
    main()
