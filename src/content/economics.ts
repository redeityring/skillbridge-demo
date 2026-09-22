/**
 * Economics content bank.
 *
 * Content is deliberately separated from logic: adding a subject means adding
 * a file like this one and registering it in `src/content/index.ts`.
 *
 * Authoring rules for application scenarios:
 *  - real context, no outside knowledge required,
 *  - the scenario gives every fact needed to reason,
 *  - exactly one option is defensible; the others are common misconceptions,
 *  - partial credit marks the "almost right" misconception,
 *  - the rubric is the grading contract shared by the AI grader and the local
 *    fallback evaluator.
 */

import type { Topic, TopicId } from "@/lib/types";

/* ========================================================================== */
/* Opportunity Cost                                                           */
/* ========================================================================== */

const opportunityCost: Topic = {
  id: "opportunity-cost",
  subject: "economics",
  subjectLabel: "Economics",
  title: "Opportunity Cost",
  tagline: "The value of what you gave up",
  blurb:
    "The next best alternative you sacrificed when you made a choice. Sounds simple — it is the concept learners most often describe correctly and apply incorrectly.",
  theoryQuestions: [
    {
      id: "oc-t1",
      topicId: "opportunity-cost",
      skill: "Definition",
      prompt: "Which statement best describes opportunity cost?",
      options: [
        {
          id: "a",
          label: "The money you actually spend when you make a choice",
          correct: false,
        },
        {
          id: "b",
          label: "The value of the next best alternative you gave up",
          correct: true,
        },
        {
          id: "c",
          label: "The value of all the alternatives you did not choose, added together",
          correct: false,
        },
        { id: "d", label: "The difference between price and perceived value", correct: false },
      ],
      explanation:
        "Opportunity cost is the value of the single best alternative forgone — not the total cost, and not the sum of everything you skipped.",
    },
    {
      id: "oc-t2",
      topicId: "opportunity-cost",
      skill: "Sunk costs",
      prompt:
        "You paid $25 for a concert ticket. The ticket is non-refundable and the concert is tonight. A workshop you would value more is happening at the same time. Which statement about the $25 is correct?",
      options: [
        { id: "a", label: "It is part of the opportunity cost of skipping the concert", correct: false },
        {
          id: "b",
          label: "It is unrecoverable, so it should not influence the choice",
          correct: true,
        },
        { id: "c", label: "It makes attending the concert the correct decision", correct: false },
        { id: "d", label: "It doubles the cost of choosing the workshop", correct: false },
      ],
      explanation:
        "Money that cannot be recovered is a sunk cost. It is identical whichever option you pick, so it drops out of the comparison. The real cost of the workshop is the concert you give up — not the $25.",
    },
    {
      id: "oc-t3",
      topicId: "opportunity-cost",
      skill: "Implicit costs",
      prompt:
        "A café owner owns the building she operates from and pays no rent. Does using that building have an opportunity cost?",
      options: [
        { id: "a", label: "No — no rent is paid, so there is no cost", correct: false },
        {
          id: "b",
          label: "Yes — the rent she could earn by leasing the space to someone else",
          correct: true,
        },
        { id: "c", label: "Only if the building was bought with a loan", correct: false },
        { id: "d", label: "Only if she could sell the building today", correct: false },
      ],
      explanation:
        "Owning an asset does not make it free. Its opportunity cost is the best alternative use — here, the rent the space could earn.",
    },
    {
      id: "oc-t4",
      topicId: "opportunity-cost",
      skill: "Root cause",
      prompt: "Why does opportunity cost exist at all?",
      options: [
        { id: "a", label: "Because prices rise over time", correct: false },
        {
          id: "b",
          label: "Because resources are scarce and have competing uses",
          correct: true,
        },
        { id: "c", label: "Because alternatives are taxed differently", correct: false },
        { id: "d", label: "Because people make irrational decisions", correct: false },
      ],
      explanation:
        "Scarcity is the source. If resources were unlimited, choosing one option would never mean giving up another.",
    },
  ],
  applicationQuestions: [
    {
      id: "oc-a1",
      topicId: "opportunity-cost",
      skill: "Identifying the sacrificed alternative",
      title: "Three free hours",
      scenario:
        "It is 7pm and you have three free hours. Three things you genuinely want to do compete for them: prepare for an olympiad next month, finish a team project that is due tomorrow morning, and revise English for a test.",
      constraints: [
        "All three matter to you — none of them is a hobby you can drop without loss",
        "The project deadline is a hard commitment to other people",
      ],
      decisionPrompt:
        "You decide to prepare for the olympiad. What is the opportunity cost of that decision?",
      options: [
        { id: "a", label: "Nothing — the three hours were free time", credit: 0 },
        {
          id: "b",
          label: "The single alternative you value most among those you gave up",
          credit: 1,
        },
        {
          id: "c",
          label: "The project, the English revision, and the rest you skipped, added together",
          credit: 0.35,
        },
        { id: "d", label: "The value of the olympiad preparation itself", credit: 0 },
      ],
      reasoningPrompt:
        "Explain why the option you chose is the opportunity cost — and why the sum of all alternatives is not.",
      rubric: {
        concepts: [
          "next best alternative",
          "given up",
          "single highest-valued alternative",
          "not the sum of all alternatives",
        ],
        reasoningSignals: ["because", "instead of", "not all", "next best", "gave up"],
        mustMention: "the value of the single best alternative that was given up",
      },
      exemplar:
        "The opportunity cost is the value of the next best alternative I gave up — the one I would have chosen if the olympiad preparation were unavailable. Adding the project and the English revision together would overstate the cost: I could only ever have done one of them, so the others were never really available.",
    },
    {
      id: "oc-a2",
      topicId: "opportunity-cost",
      skill: "Separating sunk costs from real costs",
      title: "The non-refundable ticket",
      scenario:
        "You bought a $25 concert ticket two weeks ago. It cannot be refunded or resold. Tonight a friend offers you a free place at a small workshop that, honestly, you would value more than the concert.",
      constraints: [
        "The $25 has already left your account",
        "The workshop place costs you nothing and cannot be moved to another date",
      ],
      decisionPrompt:
        "What should you do, and how should the $25 shape the decision?",
      options: [
        { id: "a", label: "Go to the concert — otherwise the $25 is wasted", credit: 0 },
        {
          id: "b",
          label: "Go to the workshop — the $25 is gone either way and changes nothing",
          credit: 1,
        },
        { id: "c", label: "Go to the concert and leave early for the workshop", credit: 0.4 },
        { id: "d", label: "Compare the $25 against the value of the workshop", credit: 0.1 },
      ],
      reasoningPrompt:
        "Justify your decision. Name what you are actually giving up tonight.",
      rubric: {
        concepts: [
          "sunk cost",
          "already spent",
          "cannot be recovered",
          "the concert is what is given up",
        ],
        reasoningSignals: [
          "because",
          "the money is gone either way",
          "what I give up now",
          "forward-looking",
        ],
        mustMention: "the ticket price is unrecoverable and cannot change the comparison",
      },
      exemplar:
        "Go to the workshop. The $25 is spent whether or not I attend the concert, so it is the same on both sides of the comparison and drops out. The real cost of the concert is the workshop I would miss, and since I value the workshop more, that is the option with the higher opportunity cost.",
    },
    {
      id: "oc-a3",
      topicId: "opportunity-cost",
      skill: "Costing an owned resource",
      title: "The café owner's space",
      scenario:
        "A café owner owns her premises outright and pays no rent. She has 20 square metres of unused space and two possible uses: extend the seating area, or build a small kitchen to serve a catering arm that already has orders waiting.",
      constraints: [
        "A neighbouring business has offered to sublet the space for $1,800 a month",
        "The catering arm would add $2,400 a month in contribution",
        "The seating extension is projected to add $1,100 a month",
      ],
      decisionPrompt:
        "She is comparing the two options. Which costs belong in that comparison?",
      options: [
        { id: "a", label: "Only the construction cost of whatever she builds", credit: 0 },
        { id: "b", label: "Only the income from the option she does not pick", credit: 0.5 },
        {
          id: "c",
          label:
            "The income from the better of the two forgone uses, and the forgone sublet rent",
          credit: 1,
        },
        { id: "d", label: "Nothing — she owns the space, so using it is free", credit: 0 },
      ],
      reasoningPrompt:
        "Explain what each option actually costs her, given that she owns the space.",
      rubric: {
        concepts: [
          "implicit cost",
          "forgone rent",
          "forgone catering income",
          "best alternative use of the space",
        ],
        reasoningSignals: ["because", "she gives up", "even though she owns it", "compared to"],
        mustMention: "owning the space does not make it free — its best alternative use is a cost",
      },
      exemplar:
        "Each option has to be charged the value of the space in its next best use. If she extends the seating she gives up the sublet rent of $1,800. If she builds the kitchen she gives up the same $1,800 while gaining $2,400. Comparing the two on construction cost alone would ignore the $1,800 that is forgone either way and mislead her about which option is cheaper.",
    },
    {
      id: "oc-a4",
      topicId: "opportunity-cost",
      skill: "Applying the concept to public spending",
      title: "One budget, three projects",
      scenario:
        "A city council has exactly $2 million of uncommitted budget. Three projects have been costed and are ready to start: a new metro line, refurbishing twelve schools, and flood defences for a riverside district.",
      constraints: [
        "The budget cannot be split across all three without making each unviable",
        "The council votes to build the metro line",
        "Flood defences were ranked second in the independent assessment",
      ],
      decisionPrompt:
        "A journalist asks what the metro line 'really cost'. Which answer uses opportunity cost correctly?",
      options: [
        { id: "a", label: "$2 million — the amount spent", credit: 0 },
        { id: "b", label: "$2 million plus the value of the flood defences that were not built", credit: 0.3 },
        {
          id: "c",
          label: "The value of the best alternative project that was given up",
          credit: 1,
        },
        { id: "d", label: "Nothing long-term, because infrastructure pays for itself", credit: 0 },
      ],
      reasoningPrompt:
        "Explain what the council actually sacrificed, and why the $2 million alone is not the whole cost.",
      rubric: {
        concepts: [
          "forgone project",
          "best alternative use of the budget",
          "flood defences",
          "value sacrificed",
        ],
        reasoningSignals: ["because", "instead of", "gave up", "could have been spent on"],
        mustMention: "the value of the best forgone alternative, not the money spent",
      },
      exemplar:
        "The $2 million is the accounting cost and is the same for all three projects, so it does not distinguish them. What the council actually gave up is the flood defences — the best alternative use of that budget. The economic cost of the metro line is the value of those defences plus the $2 million that could have funded either project.",
    },
    {
      id: "oc-a5",
      topicId: "opportunity-cost",
      skill: "Reasoning about value, not price",
      title: "Summer plans",
      scenario:
        "A student must choose how to spend a free summer. Option one is a paid internship: three months of salary and a reference. Option two is building her own product: no income, uncertain result, but a lot of learning and a small chance of real traction.",
      constraints: [
        "She can only do one of the two",
        "The internship place must be accepted this week",
      ],
      decisionPrompt:
        "Under which condition is the opportunity cost of taking the internship the highest?",
      options: [
        {
          id: "a",
          label: "When her product idea would have turned out to be the most valuable use of the summer",
          credit: 1,
        },
        { id: "b", label: "When the internship pays the most", credit: 0.15 },
        { id: "c", label: "When the product would have failed", credit: 0 },
        { id: "d", label: "When the internship would have been unpaid", credit: 0.25 },
      ],
      reasoningPrompt:
        "Explain the relationship between the value of the option not chosen and the opportunity cost of the one chosen.",
      rubric: {
        concepts: [
          "value of the option not chosen",
          "next best alternative",
          "the sacrificed upside",
        ],
        reasoningSignals: ["because", "the more valuable", "the cost rises with", "depends on"],
        mustMention: "opportunity cost rises with the value of the alternative that is given up",
      },
      exemplar:
        "Opportunity cost is driven entirely by the alternative on the other side of the choice. Taking the internship costs her the product, so that cost is largest exactly when the product would have been worth the most. How well the internship pays is a benefit of the chosen option, not the cost of choosing it.",
    },
  ],
  bridgeBank: [
    {
      id: "oc-b1",
      topicId: "opportunity-cost",
      skill: "Identifying the sacrificed alternative",
      difficulty: "foundation",
      scenario:
        "A student spends Saturday studying instead of working a paid shift that would have earned her $60.",
      decisionPrompt: "What is the opportunity cost of studying?",
      options: [
        { id: "a", label: "The $60 wage she did not earn", credit: 1 },
        { id: "b", label: "The cost of the textbooks she used", credit: 0 },
        { id: "c", label: "The ten hours of time the day contained", credit: 0.15 },
        { id: "d", label: "The value of what she learned", credit: 0 },
      ],
      reasoningPrompt: "State what was given up, in one sentence, and why it is the wage.",
      rubric: {
        concepts: ["wage not earned", "given up", "next best alternative"],
        reasoningSignals: ["because", "instead of", "gave up"],
        mustMention: "the wage she would have earned is the alternative she gave up",
      },
      hint: "Ask: which option disappeared the moment she chose to study?",
    },
    {
      id: "oc-b2",
      topicId: "opportunity-cost",
      skill: "Evaluating trade-offs",
      difficulty: "standard",
      scenario:
        "A small software team can either ship feature X this week, or fix a bug that is currently costing existing users money every day. They decide to ship feature X.",
      decisionPrompt: "What is the opportunity cost of that decision?",
      options: [
        { id: "a", label: "The losses users keep incurring from the unfixed bug", credit: 1 },
        { id: "b", label: "The engineering hours spent building feature X", credit: 0.2 },
        { id: "c", label: "The revenue feature X is expected to bring in", credit: 0 },
        { id: "d", label: "The marketing budget for launching feature X", credit: 0 },
      ],
      reasoningPrompt: "Explain which of these is a genuine cost of the choice, and why.",
      rubric: {
        concepts: ["bug remains unfixed", "ongoing loss to users", "best alternative given up"],
        reasoningSignals: ["because", "instead of", "the thing we did not do"],
        mustMention: "the cost is the unfixed bug, not the resources spent on the chosen work",
      },
      hint: "Spending hours on X is not the cost of choosing X. What did choosing X prevent?",
    },
    {
      id: "oc-b3",
      topicId: "opportunity-cost",
      skill: "Comparing more than two alternatives",
      difficulty: "stretch",
      scenario:
        "One slot is open in an elective. A student rates her options in terms of value to her: Robotics 90, Debate 70, Art 40. She is offered Robotics and accepts it.",
      decisionPrompt: "What is her opportunity cost?",
      options: [
        { id: "a", label: "70 — Debate, the next best alternative she gave up", credit: 1 },
        { id: "b", label: "110 — Debate and Art together", credit: 0.3 },
        { id: "c", label: "90 — the value of Robotics, which she chose", credit: 0 },
        { id: "d", label: "200 — the sum of all three options", credit: 0 },
      ],
      reasoningPrompt:
        "Show how you computed the figure you chose, and why the others are not opportunity cost.",
      rubric: {
        concepts: ["single highest-valued alternative", "next best alternative", "not the sum"],
        reasoningSignals: ["because", "only one slot", "could only take one"],
        mustMention: "only the best alternative is counted, because she could only have taken one",
      },
      hint: "She could only have chosen one of them — so how many of them are actually forgone?",
    },
  ],
};

/* ========================================================================== */
/* Supply & Demand                                                            */
/* ========================================================================== */

const supplyAndDemand: Topic = {
  id: "supply-and-demand",
  subject: "economics",
  subjectLabel: "Economics",
  title: "Supply & Demand",
  tagline: "How markets find a price",
  blurb:
    "Which curve moves, which direction, and what the new equilibrium implies. Learners usually name the curves correctly and then misread the situation.",
  theoryQuestions: [
    {
      id: "sd-t1",
      topicId: "supply-and-demand",
      skill: "Reading shifts",
      prompt:
        "A new tax raises the cost of producing coffee. Everything else stays the same. What happens in the coffee market?",
      options: [
        { id: "a", label: "The supply curve shifts left, price rises and quantity falls", correct: true },
        { id: "b", label: "The demand curve shifts left, price falls and quantity falls", correct: false },
        { id: "c", label: "Both curves shift left, leaving price unchanged", correct: false },
        { id: "d", label: "Nothing — producers absorb the tax", correct: false },
      ],
      explanation:
        "A tax raises the cost of supplying at every price, so supply shifts left. Demand is untouched. The new equilibrium sits at a higher price and a lower quantity.",
    },
    {
      id: "sd-t2",
      topicId: "supply-and-demand",
      skill: "Substitutes",
      prompt:
        "The price of tea rises sharply and stays high. What happens in the market for coffee, a substitute?",
      options: [
        { id: "a", label: "Demand for coffee increases; price and quantity rise", correct: true },
        { id: "b", label: "Demand for coffee decreases; price and quantity fall", correct: false },
        { id: "c", label: "The supply of coffee shifts right", correct: false },
        { id: "d", label: "Nothing — the two markets are independent", correct: false },
      ],
      explanation:
        "When a substitute becomes more expensive, buyers move toward the cheaper alternative. That is a demand shift, not a movement along the curve.",
    },
    {
      id: "sd-t3",
      topicId: "supply-and-demand",
      skill: "Shift vs. movement",
      prompt:
        "What is the difference between a movement along the demand curve and a shift of the demand curve?",
      options: [
        { id: "a", label: "They mean the same thing", correct: false },
        {
          id: "b",
          label:
            "A movement is caused by the good's own price; a shift is caused by something else",
          correct: true,
        },
        { id: "c", label: "A movement is caused by income; a shift is caused by price", correct: false },
        { id: "d", label: "A movement affects quantity; a shift affects only price", correct: false },
      ],
      explanation:
        "This distinction is the hinge of almost every supply-and-demand error: price changes quantity demanded (a movement); anything else that changes willingness to buy shifts the whole curve.",
    },
    {
      id: "sd-t4",
      topicId: "supply-and-demand",
      skill: "Price controls",
      prompt:
        "A government sets a rent ceiling below the market equilibrium rent. What is the predictable result?",
      options: [
        { id: "a", label: "A shortage of rental housing", correct: true },
        { id: "b", label: "A surplus of rental housing", correct: false },
        { id: "c", label: "No change, because the ceiling is a legal limit only", correct: false },
        { id: "d", label: "Demand falls to meet supply", correct: false },
      ],
      explanation:
        "Below equilibrium the quantity demanded exceeds the quantity supplied, so a shortage appears — usually followed by queues, informal side payments, or a decline in maintenance quality.",
    },
  ],
  applicationQuestions: [
    {
      id: "sd-a1",
      topicId: "supply-and-demand",
      skill: "Explaining a surge price",
      title: "2am ride home",
      scenario:
        "At 2am a ride-hailing app raises its prices to three times the normal fare in a district where a concert has just ended. Hundreds of people are looking for a ride and few drivers are willing to work at that hour.",
      constraints: [
        "Drivers can choose freely whether to work at that time",
        "The app raises prices automatically as demand exceeds available cars",
      ],
      decisionPrompt:
        "Someone calls the surge 'pure price gouging'. Which explanation is correct in supply-and-demand terms?",
      options: [
        { id: "a", label: "High price means the app is overcharging and it should be capped", credit: 0 },
        {
          id: "b",
          label:
            "Quantity demanded exceeds quantity supplied, so the price rises toward the level that clears the market and attracts more drivers",
          credit: 1,
        },
        { id: "c", label: "Demand increased, so the demand curve shifted, which is why price rose", credit: 0.4 },
        {
          id: "d",
          label: "Supply fell, so the supply curve shifted left, which is the whole explanation",
          credit: 0.3,
        },
      ],
      reasoningPrompt:
        "Explain what happened on both sides of the market and what the higher price does.",
      rubric: {
        concepts: [
          "shortage",
          "quantity demanded exceeds quantity supplied",
          "price rations demand",
          "price attracts additional supply",
        ],
        reasoningSignals: ["because", "as a result", "which means", "this is why"],
        mustMention: "the price clears the market and brings more cars onto the road",
      },
      exemplar:
        "Demand at 2am is far above the number of cars available, so there is a shortage at the normal fare. Raising the price does two things: it rations the limited seats to the people who value them most, and it makes the shift attractive enough that more drivers start working. The surge is the market clearing, not an arbitrary markup.",
    },
    {
      id: "sd-a2",
      topicId: "supply-and-demand",
      skill: "Predicting the effect of a price cap",
      title: "The rent cap",
      scenario:
        "A city caps monthly rent at 30% below the current market level. The cap applies to all flats, including new ones, and landlords may not charge fees to get around it.",
      constraints: [
        "Renters may not legally pay above the cap",
        "Landlords choose whether to rent out, sell, or leave a flat empty",
      ],
      decisionPrompt:
        "What should the city expect over the next two years?",
      options: [
        { id: "a", label: "Cheaper flats for everyone who wants one", credit: 0 },
        {
          id: "b",
          label:
            "Excess demand for the capped flats, with fewer landlords willing to supply them, and quality or informal conditions absorbing the difference",
          credit: 1,
        },
        { id: "c", label: "A surplus of flats, because the price is now lower", credit: 0 },
        { id: "d", label: "No effect, because demand for housing does not respond to price", credit: 0.1 },
      ],
      reasoningPrompt:
        "Explain what the cap does to the quantity demanded, the quantity supplied, and where the pressure goes.",
      rubric: {
        concepts: [
          "price below equilibrium",
          "shortage",
          "quantity supplied falls",
          "quality or non-price rationing",
        ],
        reasoningSignals: ["because", "as a result", "so the pressure", "which means"],
        mustMention: "a ceiling below equilibrium creates a shortage, and the gap has to show up somewhere",
      },
      exemplar:
        "A legal maximum below equilibrium does not change how many people want a flat — it makes more of them want one at that price. Supply moves the other way, because letting at the capped rent is less attractive than selling or waiting. The result is a shortage, and the gap reappears as queues, informal payments, or landlords cutting maintenance.",
    },
    {
      id: "sd-a3",
      topicId: "supply-and-demand",
      skill: "Distinguishing two simultaneous shifts",
      title: "The coffee shop's two problems",
      scenario:
        "A neighbourhood coffee shop faces two changes at once. A new machine cuts the cost of making each cup in half. In the same month, a large office block opens next door and hundreds of new customers start buying coffee locally every morning.",
      constraints: [
        "The machine replaces labour and reduces the cost per cup",
        "The office workers are new buyers in this market",
      ],
      decisionPrompt:
        "Which change does what to the market diagram?",
      options: [
        { id: "a", label: "Both changes shift demand to the right", credit: 0 },
        {
          id: "b",
          label:
            "The machine shifts supply right and the new customers shift demand right; quantity rises, while the price effect depends on which shift is larger",
          credit: 1,
        },
        { id: "c", label: "The machine shifts demand right and new customers shift supply right", credit: 0 },
        { id: "d", label: "The machine shifts supply right and the customers move along the supply curve", credit: 0.35 },
      ],
      reasoningPrompt:
        "Take the two changes separately, then explain why the price effect is ambiguous while the quantity effect is not.",
      rubric: {
        concepts: [
          "cost reduction shifts supply right",
          "new buyers shift demand right",
          "quantity unambiguously rises",
          "price effect depends on relative size",
        ],
        reasoningSignals: ["because", "on the other hand", "which means", "depends on"],
        mustMention: "both curves move right so quantity rises but the price change is indeterminate",
      },
      exemplar:
        "Lower production costs mean sellers offer more at every price — the supply curve shifts right. New regular customers mean more is bought at every price — the demand curve shifts right. Both shifts raise quantity, so quantity definitely rises. Price is the ambiguous part: supply pushes it down, demand pushes it up, and which wins depends on the relative size of the two shifts.",
    },
    {
      id: "sd-a4",
      topicId: "supply-and-demand",
      skill: "Reasoning about subsidies",
      title: "Student bus fares",
      scenario:
        "A city halves bus fares for students and pays the bus operator the difference for every student journey. Bus use by students rises and total journeys rise. The number of buses on the road is fixed by the operator's licence for the next three years.",
      constraints: [
        "The operator is fully compensated for the discount",
        "The fleet size cannot change during the licence period",
      ],
      decisionPrompt:
        "Two students argue about what happens. Which position is correct?",
      options: [
        { id: "a", label: "The subsidy shifts supply right, so fares fall", credit: 0.25 },
        {
          id: "b",
          label:
            "The subsidy changes the price students face, so more journeys are demanded — and with a fixed fleet that means crowding, not more buses",
          credit: 1,
        },
        { id: "c", label: "Nothing changes economically because the operator is compensated", credit: 0 },
        { id: "d", label: "The whole subsidy is captured by the operator as profit", credit: 0.15 },
      ],
      reasoningPrompt:
        "Explain which curve moves, what happens to quantity, and why the fixed fleet matters.",
      rubric: {
        concepts: [
          "effective price for students falls",
          "quantity demanded rises",
          "capacity is fixed in the short run",
          "rationing by crowding",
        ],
        reasoningSignals: ["because", "in the short run", "so instead", "which means"],
        mustMention: "with supply fixed, extra demand shows up as congestion rather than more buses",
      },
      exemplar:
        "The subsidy lowers the price students pay, so the quantity of journeys they demand rises at every fare they face — they move down their demand curve. The operator's costs are unchanged because it is compensated, so supply does not move. With the fleet fixed, the extra journeys can only be served by fuller buses: the subsidy buys access, and the cost reappears as crowding.",
    },
    {
      id: "sd-a5",
      topicId: "supply-and-demand",
      skill: "Interpreting a shift in behaviour",
      title: "Everyone discovers the same soup",
      scenario:
        "A local restaurant is reviewed by a large account and becomes briefly famous. Queues form. A month later the queues are gone even though the menu, the prices and the neighbourhood are unchanged.",
      constraints: [
        "The review reached a very large audience",
        "Food quality did not change",
      ],
      decisionPrompt:
        "Which explanation fits the evidence best?",
      options: [
        {
          id: "a",
          label:
            "The review shifted demand right, the restaurant could not increase supply quickly, and price did not rise — so the market cleared with queues instead of a price change",
          credit: 1,
        },
        { id: "b", label: "Supply shifted left when the review appeared", credit: 0 },
        { id: "c", label: "Demand moved along the curve because the price rose", credit: 0 },
        { id: "d", label: "The market was not clearing at either point", credit: 0.2 },
      ],
      reasoningPrompt:
        "Explain what absorbed the extra demand, since the price did not move.",
      rubric: {
        concepts: [
          "demand shifted right",
          "supply was inelastic in the short run",
          "price unchanged",
          "non-price rationing through queues",
        ],
        reasoningSignals: ["because", "since the price was fixed", "so the queue", "which means"],
        mustMention: "a fixed price combined with fixed capacity makes waiting time the rationing mechanism",
      },
      exemplar:
        "The review added many new customers at every price, so demand shifted right. The restaurant could not expand its kitchen within days, and it chose not to raise prices, so supply stayed where it was. When the price is fixed and quantity cannot rise, the market clears through something else — here, waiting time. The queues were the adjustment, and they disappeared once the review-driven demand faded.",
    },
  ],
  bridgeBank: [
    {
      id: "sd-b1",
      topicId: "supply-and-demand",
      skill: "Reading shifts",
      difficulty: "foundation",
      scenario:
        "A hard frost destroys a large share of this year's orange harvest. Consumers still want oranges as much as before.",
      decisionPrompt: "What happens in the orange market?",
      options: [
        { id: "a", label: "Supply shifts left; price rises and quantity falls", credit: 1 },
        { id: "b", label: "Demand shifts left; price falls and quantity falls", credit: 0 },
        { id: "c", label: "Demand shifts right because oranges are now scarce", credit: 0.2 },
        { id: "d", label: "Both curves shift; price is unchanged", credit: 0.1 },
      ],
      reasoningPrompt: "Name the curve that moves and say why demand does not.",
      rubric: {
        concepts: ["supply shifts left", "demand unchanged", "higher price", "lower quantity"],
        reasoningSignals: ["because", "everything else equal", "as a result"],
        mustMention: "a supply shock moves supply only, because buyers' preferences did not change",
      },
      hint: "Scarcity is the result of the shift, not a reason for demand to move.",
    },
    {
      id: "sd-b2",
      topicId: "supply-and-demand",
      skill: "Shift vs. movement",
      difficulty: "standard",
      scenario:
        "A gym raises its monthly membership fee by 20%. Enrolments fall by 6%. Nothing else about the gym changes.",
      decisionPrompt: "How do you describe what happened, in supply-and-demand terms?",
      options: [
        {
          id: "a",
          label: "A movement along the demand curve: the higher price reduced the quantity demanded",
          credit: 1,
        },
        { id: "b", label: "The demand curve shifted left, because fewer people want gyms", credit: 0 },
        { id: "c", label: "The supply curve shifted left", credit: 0 },
        { id: "d", label: "Demand fell, which is the same thing as a shift", credit: 0.25 },
      ],
      reasoningPrompt: "Explain the difference between the two descriptions and why only one fits.",
      rubric: {
        concepts: ["own price changed", "movement along the curve", "preferences unchanged"],
        reasoningSignals: ["because", "the only thing that changed was", "so this is"],
        mustMention: "only the good's own price changed, so this is a movement, not a shift",
      },
      hint: "What actually changed in the market? Only one thing did.",
    },
    {
      id: "sd-b3",
      topicId: "supply-and-demand",
      skill: "Price controls",
      difficulty: "stretch",
      scenario:
        "Bread is a staple. A government fixes its price below the market clearing level and forbids resale above that price. Bakeries must honour the price to keep their licences.",
      decisionPrompt: "Which consequence should the government expect?",
      options: [
        {
          id: "a",
          label:
            "Persistent excess demand: bakeries supply less than buyers want, and shortages, queues or black markets appear",
          credit: 1,
        },
        { id: "b", label: "Bread becomes affordable and supply adjusts upward to match demand", credit: 0 },
        { id: "c", label: "A surplus of bread appears, which the government must buy up", credit: 0 },
        { id: "d", label: "Nothing, because bread is a necessity and demand is fixed", credit: 0.1 },
      ],
      reasoningPrompt:
        "Explain what happens to quantity supplied and quantity demanded at the fixed price.",
      rubric: {
        concepts: ["price below equilibrium", "quantity supplied falls", "quantity demanded rises", "shortage"],
        reasoningSignals: ["because", "at that price", "so the gap"],
        mustMention: "at a price below equilibrium, quantity demanded exceeds quantity supplied",
      },
      hint: "Compare the quantity bakeries are willing to make with the quantity people want, at that price.",
    },
  ],
};

/* ========================================================================== */
/* Inflation                                                                  */
/* ========================================================================== */

const inflation: Topic = {
  id: "inflation",
  subject: "economics",
  subjectLabel: "Economics",
  title: "Inflation",
  tagline: "The changing value of money",
  blurb:
    "Learners can define inflation perfectly and still compare a 5% raise with 7% inflation incorrectly. This topic is about the arithmetic of real value.",
  theoryQuestions: [
    {
      id: "in-t1",
      topicId: "inflation",
      skill: "Definition",
      prompt: "Which statement best defines inflation?",
      options: [
        { id: "a", label: "Any increase in the price of a specific good", correct: false },
        { id: "b", label: "A sustained rise in the general price level across the economy", correct: true },
        { id: "c", label: "An increase in the amount of money printed", correct: false },
        { id: "d", label: "A fall in the value of the currency against other currencies", correct: false },
      ],
      explanation:
        "Inflation is about the general price level, not one product. A single price rise is a relative price change; inflation is the broad, sustained movement.",
    },
    {
      id: "in-t2",
      topicId: "inflation",
      skill: "Real vs. nominal",
      prompt:
        "Your wage rises by 5% this year while consumer prices rise by 7%. What happened to your real wage?",
      options: [
        { id: "a", label: "It rose by 5%", correct: false },
        { id: "b", label: "It fell by roughly 2%", correct: true },
        { id: "c", label: "It was unchanged, because both numbers moved", correct: false },
        { id: "d", label: "It rose by 12%, because the two changes add up", correct: false },
      ],
      explanation:
        "Real wage change is approximately the nominal change minus inflation: 5% − 7% ≈ −2%. You have more money, and less buying power.",
    },
    {
      id: "in-t3",
      topicId: "inflation",
      skill: "Causes",
      prompt:
        "Which situation is most likely to produce demand-pull inflation?",
      options: [
        {
          id: "a",
          label: "Aggregate demand grows faster than the economy's capacity to produce",
          correct: true,
        },
        { id: "b", label: "A key imported input becomes much more expensive", correct: false },
        { id: "c", label: "Workers become more productive", correct: false },
        { id: "d", label: "The central bank raises interest rates", correct: false },
      ],
      explanation:
        "Demand-pull means too much spending chasing too few goods. Expensive inputs are cost-push. Higher interest rates are a tool used to reduce inflation, not cause it.",
    },
    {
      id: "in-t4",
      topicId: "inflation",
      skill: "Distributional effects",
      prompt:
        "Inflation turns out to be much higher than anyone expected. Who is most likely to lose?",
      options: [
        {
          id: "a",
          label: "People holding cash savings with fixed nominal interest",
          correct: true,
        },
        { id: "b", label: "Borrowers with fixed-rate loans", correct: false },
        { id: "c", label: "People who own property and physical assets", correct: false },
        { id: "d", label: "Everyone equally, by definition", correct: false },
      ],
      explanation:
        "Unexpected inflation transfers value from lenders and cash holders to borrowers and asset owners. Nominal fixed returns buy less, while fixed debts become cheaper in real terms.",
    },
  ],
  applicationQuestions: [
    {
      id: "in-a1",
      topicId: "inflation",
      skill: "Arithmetic of real value",
      title: "The salary offer",
      scenario:
        "You have a job offer of $3,000 a month. Inflation is running at 6% a year and your salary will not be reviewed for twelve months. A friend in the same role started last year at $2,900.",
      constraints: [
        "Your costs are expected to move broadly in line with inflation",
        "The salary is fixed in nominal terms for the first year",
      ],
      decisionPrompt:
        "What does the offer mean in real terms, and what is the sensible way to think about it?",
      options: [
        { id: "a", label: "You are better off than your friend, because $3,000 > $2,900", credit: 0.2 },
        {
          id: "b",
          label:
            "In a year the salary buys about 6% less; the relevant comparison is your purchasing power, not the number",
          credit: 1,
        },
        { id: "c", label: "Inflation does not matter because your salary does not change", credit: 0 },
        { id: "d", label: "You should focus on tax, which matters more than inflation", credit: 0.1 },
      ],
      reasoningPrompt:
        "Explain what the nominal figure tells you and what it does not, using the numbers given.",
      rubric: {
        concepts: [
          "nominal vs real value",
          "purchasing power falls",
          "6% less in real terms",
          "compare real wages not numbers",
        ],
        reasoningSignals: ["because", "in real terms", "which means", "buys less"],
        mustMention: "a fixed nominal salary loses roughly the rate of inflation in purchasing power",
      },
      exemplar:
        "The $3,000 is a nominal figure, and it is fixed for a year. If prices rise 6%, the same salary buys about 6% less by month twelve — roughly $170 a month of purchasing power. Comparing $3,000 with $2,900 only compares numbers from different price levels. What matters is that the offer is real growth only if it beats inflation, which this one does not.",
    },
    {
      id: "in-a2",
      topicId: "inflation",
      skill: "Evaluating a real return",
      title: "The savings account",
      scenario:
        "A savings account pays 4% interest a year. Inflation over the same year is 6%.",
      constraints: [
        "The interest rate is fixed for the year",
        "The money is not needed until next year",
      ],
      decisionPrompt:
        "What should you conclude about the account, and what is the correct way to describe the outcome?",
      options: [
        { id: "a", label: "You earned 4%, so you gained", credit: 0 },
        {
          id: "b",
          label:
            "The real return is about −2%: the balance grew in nominal terms while purchasing power fell",
          credit: 1,
        },
        { id: "c", label: "You earned 10%, because interest and inflation combine", credit: 0 },
        { id: "d", label: "It is impossible to say without knowing the exchange rate", credit: 0 },
      ],
      reasoningPrompt:
        "Explain why a positive interest rate can still mean a loss, and what that implies for a saver.",
      rubric: {
        concepts: ["real return", "nominal balance grows", "purchasing power falls", "negative real rate"],
        reasoningSignals: ["because", "which means", "in real terms", "so the account loses"],
        mustMention: "real return is the nominal rate minus inflation, which is negative here",
      },
      exemplar:
        "The balance rises by 4% and prices rise by 6%. A real return is the nominal rate minus inflation, so this account returns about −2% in purchasing power. The number in the account is larger next year, but it buys less than it does today. The interest rate only tells you a gain if you compare it against inflation.",
    },
    {
      id: "in-a3",
      topicId: "inflation",
      skill: "Cost-push reasoning",
      title: "The bakery's flour bill",
      scenario:
        "A small bakery's flour costs rise by 18% in one year. The owner raises bread prices by 8% and reduces the number of items on the menu so the kitchen wastes less.",
      constraints: [
        "Customers have alternative bakeries nearby with similar prices",
        "The owner cannot raise prices further without losing significant sales",
      ],
      decisionPrompt:
        "How should this situation be classified, and what is the risk the owner is managing?",
      options: [
        {
          id: "a",
          label:
            "Cost-push pressure: input costs rose, and passing on only part of the rise protects volume — but a wage-price spiral is a risk if workers demand matching pay rises",
          credit: 1,
        },
        { id: "b", label: "Demand-pull inflation, because the bakery raised its prices", credit: 0 },
        { id: "c", label: "This is not inflation, because only one bakery is affected", credit: 0.15 },
        { id: "d", label: "The bakery caused inflation by raising prices", credit: 0 },
      ],
      reasoningPrompt:
        "Explain what pushed the price up, why the owner may not pass on the full rise, and what could happen next.",
      rubric: {
        concepts: [
          "cost-push",
          "input costs rose",
          "incomplete pass-through",
          "risk of a spiral",
        ],
        reasoningSignals: ["because", "otherwise", "which could lead to", "as a result"],
        mustMention: "rising input costs pushed prices up, which is cost-push rather than demand-pull",
      },
      exemplar:
        "The initial cause is a rise in the cost of production, which is cost-push, not demand-pull. Passing on 8% of an 18% cost increase means the owner absorbs the rest as a lower margin, because customers would otherwise walk to a competitor. The risk is the second round: if wage demands follow the price rises, the initial cost shock can turn into a self-reinforcing spiral.",
    },
    {
      id: "in-a4",
      topicId: "inflation",
      skill: "Tracing a transmission channel",
      title: "The stimulus cheque",
      scenario:
        "A government sends every household a one-off payment equivalent to one month's average spending. Shops are operating close to full capacity and unemployment is already low.",
      constraints: [
        "The payments arrive within the same month for all households",
        "Firms cannot expand capacity within a year",
      ],
      decisionPrompt:
        "What is the most likely outcome, and why?",
      options: [
        { id: "a", label: "Prices stay flat, because the payments are only one-off", credit: 0.15 },
        {
          id: "b",
          label:
            "Spending rises faster than output can respond, so more of the stimulus shows up in prices than in real activity",
          credit: 1,
        },
        { id: "c", label: "Cost-push inflation, because firms face higher input prices", credit: 0.3 },
        { id: "d", label: "Deflation, because more money makes goods easier to get", credit: 0 },
      ],
      reasoningPrompt:
        "Explain the mechanism from household spending to prices, given the capacity and employment facts.",
      rubric: {
        concepts: [
          "aggregate demand rises",
          "capacity constrained",
          "low unemployment limits output growth",
          "excess demand spills into prices",
        ],
        reasoningSignals: ["because", "since capacity", "which means", "as a result"],
        mustMention: "demand rises while capacity is fixed, so the pressure appears in prices",
      },
      exemplar:
        "The payments raise household income and therefore spending, so aggregate demand rises. With unemployment already low and firms unable to expand within a year, the extra spending cannot be met by more output. When demand rises against a fixed capacity, the adjustment happens mostly through prices — the stimulus is partly absorbed by inflation instead of activity.",
    },
    {
      id: "in-a5",
      topicId: "inflation",
      skill: "Choosing the right comparison",
      title: "Two offers, one year apart",
      scenario:
        "A student compares two summer job offers. Offer A: $1,200 for six weeks, starting now. Offer B: $1,260 for the same six weeks, starting in a year. Inflation is 8% a year, and prices for what she plans to buy usually rise at about the same rate.",
      constraints: [
        "Both offers are for identical work",
        "She plans to spend most of the money within a few months of earning it",
      ],
      decisionPrompt:
        "Which offer is genuinely better, and on what basis?",
      options: [
        { id: "a", label: "Offer B, because $1,260 is more than $1,200", credit: 0.15 },
        {
          id: "b",
          label:
            "Offer A: the 5% increase is below 8% inflation, so Offer B buys less than Offer A does today",
          credit: 1,
        },
        { id: "c", label: "They are about equal, since the difference is small", credit: 0.3 },
        { id: "d", label: "Offer B, because waiting means prices will be higher anyway", credit: 0 },
      ],
      reasoningPrompt:
        "Show the comparison you made, and explain why it is not a comparison of the two dollar figures.",
      rubric: {
        concepts: [
          "real value",
          "5% nominal rise is below 8% inflation",
          "purchasing power falls",
          "compare like with like",
        ],
        reasoningSignals: ["because", "in real terms", "so it buys", "which is less than"],
        mustMention: "the raise is smaller than inflation, so the later offer buys less",
      },
      exemplar:
        "The two figures are in money from different years, so they cannot be compared directly. The later offer is only 5% higher while prices rise 8%, so in purchasing power it is worth roughly 3% less than the offer available today. Even before any question of preferences, Offer A is the better one: it delivers buying power now, and it delivers more of it.",
    },
  ],
  bridgeBank: [
    {
      id: "in-b1",
      topicId: "inflation",
      skill: "Real vs. nominal",
      difficulty: "foundation",
      scenario: "A worker's pay rises by 6% in a year when inflation is 2%.",
      decisionPrompt: "What happened to the worker's real pay?",
      options: [
        { id: "a", label: "It rose by roughly 4%", credit: 1 },
        { id: "b", label: "It rose by 6%", credit: 0 },
        { id: "c", label: "It rose by 8%", credit: 0 },
        { id: "d", label: "It fell, because prices also rose", credit: 0.15 },
      ],
      reasoningPrompt: "State the calculation you used in one sentence.",
      rubric: {
        concepts: ["nominal minus inflation", "real pay rose", "purchasing power"],
        reasoningSignals: ["because", "roughly", "which is"],
        mustMention: "real change is the nominal change minus inflation",
      },
      hint: "Subtract one rate from the other — do not add them.",
    },
    {
      id: "in-b2",
      topicId: "inflation",
      skill: "Evaluating a real return",
      difficulty: "standard",
      scenario:
        "A fixed-rate savings bond pays 7% a year. Inflation turns out to be 9%.",
      decisionPrompt: "What is the real return on the bond?",
      options: [
        { id: "a", label: "About −2%: the nominal gain is outweighed by price rises", credit: 1 },
        { id: "b", label: "+7%, as stated on the bond", credit: 0 },
        { id: "c", label: "+16%, since both rates apply", credit: 0 },
        { id: "d", label: "+9%, because inflation determines the real rate", credit: 0.15 },
      ],
      reasoningPrompt: "Explain what a negative real return means for the saver.",
      rubric: {
        concepts: ["real return", "nominal minus inflation", "purchasing power falls"],
        reasoningSignals: ["because", "which means", "in real terms"],
        mustMention: "the real return is negative, so the money buys less than before",
      },
      hint: "The bond pays 7%. What is happening to prices at the same time?",
    },
    {
      id: "in-b3",
      topicId: "inflation",
      skill: "Causes",
      difficulty: "stretch",
      scenario:
        "An economy with high unemployment and spare factory capacity receives a large rise in import prices for energy and raw materials. Prices across the economy begin rising.",
      decisionPrompt: "How should this inflation be classified, and what follows from it?",
      options: [
        {
          id: "a",
          label:
            "Cost-push: production costs rose while demand was weak, so prices rise while output may fall",
          credit: 1,
        },
        { id: "b", label: "Demand-pull: prices can only rise if demand is strong", credit: 0 },
        { id: "c", label: "Cost-push, and output will necessarily rise too", credit: 0.3 },
        { id: "d", label: "Neither — inflation requires money supply growth", credit: 0.15 },
      ],
      reasoningPrompt:
        "Justify the classification using the unemployment and capacity facts.",
      rubric: {
        concepts: ["cost-push", "input prices rose", "weak demand and spare capacity", "output may fall"],
        reasoningSignals: ["because", "since", "even with spare capacity"],
        mustMention: "cost-push inflation can coexist with weak demand and falling output",
      },
      hint: "If demand is weak, what else could be pushing prices up?",
    },
  ],
};

/* ========================================================================== */

export const TOPICS: Topic[] = [opportunityCost, supplyAndDemand, inflation];

export const SUBJECTS = [
  {
    id: "economics" as const,
    label: "Economics",
    note: "Three topics available",
  },
];

export function getTopic(topicId: TopicId): Topic {
  const topic = TOPICS.find((candidate) => candidate.id === topicId);
  if (!topic) throw new Error(`Unknown topic: ${topicId}`);
  return topic;
}

export function findTopic(topicId: TopicId | null): Topic | null {
  if (!topicId) return null;
  return TOPICS.find((candidate) => candidate.id === topicId) ?? null;
}
