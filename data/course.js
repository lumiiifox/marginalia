// The first option is the answer. Display order is randomized for each attempt.
const COURSE = [
  {
    "id": "foundations",
    "period": "Unit 0",
    "title": "What is philosophy?",
    "tags": [
      "Metaphysics",
      "Epistemology",
      "Ethics",
      "Politics",
      "Aesthetics",
      "Logic",
      "Mind",
      "Language"
    ],
    "book": "classic-russell-problems",
    "sec": 2,
    "anchor": "let us concentrate attention on the table",
    "citation": "Bertrand Russell, The Problems of Philosophy, chapter I",
    "read": "Read the table example and the next paragraph about colour. Stop when Russell turns to texture. Find one observation two people can agree on even while the table looks different to them.",
    "sources": [
      [
        "OpenStax · An Overview of Contemporary Philosophy",
        "https://openstax.org/books/introduction-philosophy/pages/1-4-an-overview-of-contemporary-philosophy"
      ],
      [
        "forall x: Calgary · Arguments and validity",
        "https://forallx.openlogicproject.org/"
      ]
    ],
    "terms": [
      "validity",
      "soundness",
      "deduction"
    ],
    "sections": [
      [
        "What makes a question philosophical?",
        "At the desk of a public library, a librarian holds two requests for the last rehearsal room. One group filed first. The other has just lost its only place to play. Whatever she decides, someone will have to go home. She checks the timestamps and reads the policy. Then one of the musicians asks why getting there first should give anyone the better claim. The librarian knows exactly what happened and still owes the musician an answer.",
        "Philosophy asks us to examine what we mean and what reasons support what we believe. Both groups can accept every fact in the booking register. Their disagreement concerns the principle by which a fact about arrival becomes a reason for awarding a room. A principle is a general consideration that can guide judgments across cases. If the librarian appeals to fairness, the musician can ask which feature makes this arrangement fair.",
        "Begin by saying exactly what is at issue. Is the disagreement about when the applications arrived, what the rule says, or which rule the library ought to adopt? Checking a timestamp settles one question. Reading the policy may settle another. The last question invites you to defend a principle and consider whose interests it serves."
      ],
      [
        "Metaphysics and epistemology",
        "Metaphysics asks what exists and what makes something the thing it is. Epistemology asks what knowledge is and what justifies belief.",
        "Suppose the room holds an old violin. One string breaks and gets replaced. It seems easy to say the same violin is still there. Now imagine a restorer replacing one piece each year until every original piece is gone. What would make it the same violin throughout? That question about identity belongs to metaphysics. It can remain open even if the restorer gives you a perfect record of every repair.",
        "Now suppose someone tells you a famous violinist played this instrument. You ask how they know. An inscription might be forged, a witness might be mistaken, and two witnesses might both have copied one unreliable source. You are asking what entitles you to believe the story. That is an epistemological question. The instrument stays the subject of both conversations while the kind of answer you need changes."
      ],
      [
        "Ethics and political philosophy",
        "Ethics examines how we ought to act and live. Political philosophy examines public power, justice, and the terms on which people live together.",
        "You promised a friend you would attend their rehearsal. On the way there you meet someone who needs your help. An ethical question concerns what you should do and why: the force of a promise, the urgency of the need, or what a dependable friend owes another person. A tally of how many people usually keep such promises leaves the reason for keeping yours unsettled.",
        "Return to the library. Who has authority to decide the booking rule? Should a majority vote settle it if a small group will predictably lose every vote? These questions concern institutions and the limits of legitimate power. An ethical argument about equal consideration might support a political argument about how the vote should work. The branches overlap wherever the reasons for an individual decision bear on the rules everyone must follow."
      ],
      [
        "Aesthetics and logic",
        "Aesthetics examines art, beauty and aesthetic judgment. Logic examines which conclusions follow from which premises.",
        "A performer plays the violin part slowly. One listener says the delay builds suspense. Another hears the phrase falling apart. Each might point to the timing of the following note and invite the other to listen again. They are giving reasons for an aesthetic judgment. Counting how many listeners applauded would answer a question about popularity. It would take another premise to make popularity evidence of the performance’s artistic merit.",
        "Logic can enter any of the other branches. Suppose someone argues that every moving performance receives applause, that this performance received applause, and therefore that it was moving. The audience might have applauded out of courtesy. That possible case shows a defect in the reasoning even before you listen to the performance. Logic helps you identify which step needs repair while leaving the musical judgment itself open."
      ],
      [
        "Claims, premises and conclusions",
        "A conclusion is what an argument asks you to accept. Its premises are the reasons offered for accepting it.",
        "Take this argument: the room should go to the youth orchestra because it has nowhere else to rehearse. The booking decision is the conclusion. The lack of another rehearsal space is the stated premise. One further idea connects them: when other relevant claims are equal, the group without an alternative deserves priority. A reader can accept the factual premise while disputing that connecting principle. Giving the missing step words makes the disagreement easier to locate.",
        "To reconstruct a passage, write its conclusion on a line of its own. Under it, put each reason in words you would use with a friend. Mark any reason you supplied yourself. Then reread the source. A sentence can explain why a person came to hold a belief without offering anyone else grounds to accept it. Ask which job that sentence performs before counting it as a premise."
      ],
      [
        "Validity, truth and soundness",
        "A deduction is valid when its premises cannot all be true while its conclusion is false. A sound deduction is valid and has true premises.",
        "Try this argument: every object in the room is wooden. The lamp is in the room. Therefore the lamp is wooden. Imagine the first two sentences are true and try to make the third false. You cannot do it without changing what the sentences mean. Now look at the actual lamp and suppose it is steel. You have discovered a false premise in a valid deduction. Checking the inference and checking the world have different jobs.",
        "To show invalidity, give a counterexample to the inference: a possible situation with true premises and a false conclusion. One such case is enough. When a claim is supported by repeated observations, its author may intend only a probable conclusion. A forecast based on yesterday’s weather does not promise certainty. First establish the strength the author claims, then ask whether the evidence supplies it."
      ],
      [
        "Your first close reading",
        "Separate what the observer experiences from what the observer infers about the object.",
        "Russell begins with a table because you already know how to use one. His question is what you know when you say what colour it is. Imagine walking round a polished surface while another person stays seated. A bright patch travels across your view; your companion sees a different pattern. You can agree about what each position affords. The next move, from those reports to a claim about the surface itself, calls for an account of how appearances relate to an object.",
        "As you read, keep two sentences in mind. One should report something a person can see from a particular place. The other should say what you take the table to be like across those changes of place. Identify the extra reason you need to get from the first to the second. That small gap is enough material for a first philosophical argument."
      ],
      [
        "Mind and language",
        "Philosophy of mind asks what it is to experience, perceive or think. Philosophy of language asks how words acquire meaning and how speakers use them to do things.",
        "Suppose a deaf listener rests a hand on the violin case while the group rehearses. The player hears the low note and the listener feels a vibration. Each can identify when the playing stops. Agreement about the moment of silence leaves open what either experience is like for the person having it. A philosopher of mind can ask whether knowing everything about the vibrating string would suffice for knowing what hearing it feels like.",
        "After the rehearsal the librarian tells the musicians they have the room next Tuesday. Is she predicting where they will gather or giving them permission to use a public space? Her authority, the booking arrangements and what the listeners reasonably take her to be doing all bear on the answer. You have moved from experience to the meaning and force of an utterance. You can now follow a philosophical question even when nobody has given you its branch name in advance.",
        "In the Ancient period you will meet thinkers working with very different vocabularies from ours. Start with three people in the city of Miletus who proposed that the astonishing variety of the world could be explained from a common beginning. Keep two questions apart as you read. What did each thinker propose, and how could anyone today know that the proposal was theirs?"
      ]
    ],
    "refs": [
      [
        [
          "OpenStax · An Overview of Contemporary Philosophy",
          "https://openstax.org/books/introduction-philosophy/pages/1-4-an-overview-of-contemporary-philosophy"
        ]
      ],
      [
        [
          "OpenStax · An Overview of Contemporary Philosophy",
          "https://openstax.org/books/introduction-philosophy/pages/1-4-an-overview-of-contemporary-philosophy"
        ]
      ],
      [
        [
          "OpenStax · An Overview of Contemporary Philosophy",
          "https://openstax.org/books/introduction-philosophy/pages/1-4-an-overview-of-contemporary-philosophy"
        ]
      ],
      [
        [
          "OpenStax · An Overview of Contemporary Philosophy",
          "https://openstax.org/books/introduction-philosophy/pages/1-4-an-overview-of-contemporary-philosophy"
        ],
        [
          "forall x: Calgary · Arguments and validity",
          "https://forallx.openlogicproject.org/"
        ]
      ],
      [
        [
          "forall x: Calgary · Arguments and validity",
          "https://forallx.openlogicproject.org/"
        ]
      ],
      [
        [
          "forall x: Calgary · Arguments and validity",
          "https://forallx.openlogicproject.org/"
        ]
      ],
      [
        [
          "Bertrand Russell · The Problems of Philosophy, chapter I",
          "https://standardebooks.org/ebooks/bertrand-russell/the-problems-of-philosophy/text/chapter-1"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Consciousness",
          "https://plato.stanford.edu/entries/consciousness/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Speech Acts",
          "https://plato.stanford.edu/entries/speech-acts/"
        ]
      ]
    ]
  },
  {
    "id": "milesians",
    "title": "Where philosophy began",
    "tags": [
      "Greek",
      "Metaphysics",
      "Epistemology"
    ],
    "period": "Ancient",
    "book": "classic-aristotle-metaphysics",
    "sec": 1,
    "anchor": "Thales, the founder of this type",
    "citation": "Aristotle · Metaphysics I.3",
    "read": "Read Aristotle’s report about water. Watch where he shifts from attributing a position to Thales to imagining how Thales might have arrived at it.",
    "terms": [
      "metaphysics",
      "substance"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Presocratics",
        "https://plato.stanford.edu/entries/presocratics/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
        "https://plato.stanford.edu/entries/aristotle-metaphysics/"
      ]
    ],
    "sections": [
      [
        "A city beside the water",
        "At Miletus, a Greek city on the coast of what is now Turkey, Thales faced a question with an awkward consequence. Suppose you say that water lies at the beginning of everything. Someone can point to a flame and ask you to explain how your answer covers that too. In the sixth century BCE, other thinkers from the same city proposed different beginnings. Their disagreement gives us an unusually good entrance into philosophy. You can understand what is at stake before you know which answer to defend.",
        "Imagine standing at the edge of the harbour. Water carries a ship, disappears from wet wood in the sun and falls again as rain. An observer could reasonably wonder how far such changes reach. This harbour scene is ours. No record places Thales there making that argument. What survives is a later report that he made water the principle. The difference between the scene we can picture and the claim we can document matters throughout this lesson.",
        "The title names a beginning in a Greek line of inquiry. It leaves open how differently people elsewhere framed questions about order, knowledge and a good life. Within Greece itself the Milesians inherited problems to which poets had already given serious answers. To understand what changed at Miletus, we first need to see what an older explanation could accomplish."
      ],
      [
        "Hesiod explains an order",
        "In the Theogony, Hesiod tells of the coming to be of gods and of the struggles through which Zeus secures his rule. A genealogy traces descent: who came from whom. It can explain a relationship in the present by telling how it began. If two powers belong to the same family, or if one defeated another, their relation now makes sense in light of that history. Birth and succession connect the parts of the world into an intelligible order.",
        "Consider two questions about a kingdom. Who has the right to rule now? What keeps the city walls standing? A story about a predecessor, a battle and a recognized heir might answer the first question extraordinarily well. For the second you would want to hear about the construction and supports. Each kind of explanation directs your attention toward different evidence. The difference becomes philosophically interesting when thinkers use different kinds of explanation for the same thing: the order of the world as a whole.",
        "The Greek word archē can mean a beginning or an originating principle. A principle, in this context, does explanatory work across many cases. Identifying an archē requires saying what helps explain the variety visible now as well as what came first. Treating the Milesians as people who simply exchanged religion for science would flatten a complicated record. Ancient writers could describe a natural principle as divine.",
        "Hesiod traces the ordering of the world through descent and divine succession. A Milesian asks what underlies the different things that arise."
      ],
      [
        "Water and the difference between testimony and inference",
        "Aristotle says that Thales made water the principle. Aristotle then offers possible reasons for the choice, including the connection between moisture and nourishment. He wrote roughly two centuries after Thales. The water thesis comes to us as testimony, a later person’s report of another’s claim. The suggestions about seeds and nourishment have a different standing: Aristotle signals that he is reconstructing a possible line of thought. We have no surviving text in which Thales gives those reasons himself.",
        "We can test the reconstructed reasoning on its own merits. A seed dries out and fails to grow. A healthy plant withers without water. Those observations support the claim that living organisms depend on water. To reach the conclusion that water is the underlying principle of everything requires further premises. For example, why should a condition of life also be what stones are made of? Even if every plant needs sunlight, its dependence on light does not settle what constitutes a plant. The two relations need to be distinguished.",
        "This is where Unit 0 pays off. If you reject the conclusion, specify which step you reject. The dependence of living things on moisture can survive criticism of the larger thesis. Keeping that narrower result gives the next thinker something to explain. It also prevents a modern reader from dismissing a fertile problem simply because the proposed chemistry is wrong.",
        "Aristotle attributes the water principle to Thales. Aristotle suggests that moisture in nourishment may have prompted Thales’ choice."
      ],
      [
        "Anaximander and the boundless",
        "Anaximander’s candidate is called the apeiron, often translated as the boundless or indefinite. The translations emphasize different aspects of the term. One draws attention to limits of extent; the other makes you ask whether the source has the fixed character of a familiar thing like water. Avoid imagining a precisely described modern substance. The testimonies give us an explanatory role to investigate and much less certainty about what it would look like.",
        "Here is one reconstruction of the difficulty he faced. If one familiar opposite had unlimited power, what would leave room for its rival? Fire dries wet things; water puts out fire. Making one side the source of both creates a burden of explanation. A source from which opposing powers emerge might avoid giving the victory to one familiar side at the outset. This is a philosophical reason to take the proposal seriously. Evidence for a personal debate in which Anaximander stood up and delivered that objection to Thales is another matter.",
        "A famous passage preserved by the later commentator Simplicius uses the language of justice, recompense and time. Scholars differ about exactly where Anaximander’s own words begin and end. One interpretation hears in the legal imagery an order in which opposed powers take turns prevailing. Summer heat gives way to winter cold; no season possesses the field permanently. A reader can use the example to clarify the interpretation while remembering that the example and the surviving words have different authors.",
        "Water already has qualities that distinguish it from fire. Anaximander’s apeiron supplies a source from which opposed qualities can emerge."
      ],
      [
        "Anaximenes gives change a mechanism",
        "Anaximenes proposes air and distinguishes changes according to how dense or diffuse it becomes. Rarefaction means becoming less dense; condensation means becoming denser. On the transmitted account, air becomes fire through rarefaction, while increasing condensation yields wind, cloud, water, earth and stone. The sequence gives a critic several precise points at which to object. That precision matters even where the resulting natural theory fails.",
        "Imagine you are comparing two accounts of a cloud. Both agree that the cloud changes and that something continuous underlies the change. Only one tells you what difference in the underlying material makes it a cloud in particular. A mechanism is a proposed process connecting a starting condition to a result. Naming a mechanism creates a new demand for evidence. Do changes in density account for the differences the thinker needs to explain? Which transition would count as evidence against the proposal?",
        "There is a genuine trade-off among these accounts. A familiar starting material helps an audience understand how to investigate it. A less determinate starting principle may leave more room for things with opposed properties. A specified mechanism may improve an explanation while committing its author to claims that observation will challenge. Anaximenes gives us a way to see all three pressures at work.",
        "In Anaximenes’ account air becomes fire as it grows thinner. Air growing denser accounts for wind, cloud and ultimately stone."
      ],
      [
        "What can change and still be one thing?",
        "Set the three proposals beside a cup of water. A question about origin asks where the water came from. A question about constitution asks what it is made of now. A question about change asks what happens when steam appears above the cup. An account that answers one of these questions has earned no automatic victory over the others. Aristotle’s own interest in kinds of cause helps explain why he presents the early thinkers as he does. His classification is part of the history we are trying to understand.",
        "The Milesian proposals share a demand for an account with broad reach. Their disagreements concern the nature of the source and the work required to get from one source to many things. The surviving evidence supports those contrasts more securely than a tidy story of teachers staging formal debates with pupils. Read the optional paragraph from Aristotle with that difference in view. Its cautious wording is itself part of the evidence.",
        "Naming the principle identifies what diverse things come from. Describing successive changes in density gives a proposed mechanism.",
        "Now picture a river running through a city. The water passing the bridge at noon will have gone downstream by evening. Yet people promise to meet beside the same river tomorrow. Perhaps the changing water helps explain how the river endures. Or perhaps our easy talk of coming and going conceals a deeper difficulty about what can be. Those possibilities bring Heraclitus and Parmenides into the story."
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Metaphysics",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ]
    ]
  },
  {
    "id": "change",
    "title": "Can change hold a world together?",
    "tags": [
      "Greek",
      "Metaphysics",
      "Logic"
    ],
    "period": "Ancient",
    "book": "classic-burnet-early",
    "sec": 7,
    "anchor": "fresh waters are ever flowing",
    "citation": "Heraclitus · River passage, Burnet § fragments",
    "read": "Read the river fragment. Compare Burnet’s wording with the discussion of fragment B12 in the scholarship linked below.",
    "terms": [
      "necessity",
      "ontology"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Heraclitus",
        "https://plato.stanford.edu/entries/heraclitus/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Parmenides",
        "https://plato.stanford.edu/entries/parmenides/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Presocratics",
        "https://plato.stanford.edu/entries/presocratics/"
      ]
    ],
    "sections": [
      [
        "A crossing at Ephesus",
        "Imagine a ferryman near Ephesus promising to meet a passenger at the same river tomorrow. Fresh water will have replaced the water under the boat long before they meet. Does that make his promise senseless? Heraclitus, an early Greek thinker from Ephesus, used the image of rivers in a way that presses on both words in that promise: the water changes and the river remains identifiable. The ferry is an example for us to think with. The surviving fragments are our evidence about Heraclitus.",
        "Think of two ways a thing might endure. A gold ingot could remain in a vault because practically none of its material leaves. A flame could burn all evening because fuel continually enters and products of combustion continually leave. Trying to keep every bit of material in a flame fixed would interfere with the very process that keeps it burning. Persistence through turnover is an intelligible possibility before we decide how widely Heraclitus means to apply it. The common slogan that everything flows leaves out the hard question of the pattern that holds through the flow."
      ],
      [
        "What the river fragments establish",
        "Readers encounter several ancient versions of the river saying. In his Stanford Encyclopedia account, Daniel Graham distinguishes the wording usually treated as fragment B12 from later formulations. B12 puts the identity of rivers alongside the arrival of different waters. Burnet’s older collection gives you an opportunity to notice how a familiar translation can guide you toward one interpretation before you have considered the alternatives. When you encounter an arresting slogan, check who reports it, in which words and in what context.",
        "Try replacing the river with a pile of stones. Remove one stone and add a new one each day. You can now ask whether having the same stones is necessary for this pile to persist. The river makes a stronger point available. Flow seems to belong to what the river is. Change of contents might be a condition of its identity. If an interpretation only says that material objects eventually wear out, it misses what this example contributes.",
        "Heraclitus also uses opposed descriptions. A road can be a road uphill and a road downhill because the direction of travel matters. This leaves room for a single road and two true claims. A contradiction requires claiming and denying the same thing in the same respect. On the road it is possible to specify the respect in which each description holds. Whether this solution covers every Heraclitean opposition needs an argument for each case.",
        "The waters entering a river differ from those flowing out. The ordered passage of waters helps constitute one continuing river.",
        "Words attributed to Heraclitus survive embedded in later works. A later author can summarize a view in the author’s own vocabulary."
      ],
      [
        "A goddess sets terms of inquiry",
        "Travel west in thought to Elea, in southern Italy. The reader of Parmenides’ poem follows a young traveller toward a goddess who promises instruction. The change of literary setting matters. A narrator can give an argument to a goddess, and a reader can still ask whether the inference works. Read the journey as a device inside the poem. It gives no grounds for a biographical claim that Parmenides made this trip in a chariot.",
        "The central difficulty is both ordinary and strange. If you say something came to be, did it come from what is or from what is not? If from what is, in what sense did it genuinely begin? If from what is not, what are you talking about when you name its origin? Parmenides forces a reader to make good on language that usually passes without scrutiny. The hard part is to decide exactly how far those alternatives reach and which sense of being they concern.",
        "The goddess invites inquiry along the route of what is. Parmenides presents sheer nonbeing as an unavailable object of inquiry."
      ],
      [
        "What survives of the poem",
        "Parmenides came from Elea, a Greek colony on the Tyrrhenian coast of southern Italy, and was active early in the fifth century BCE. Plato's dialogue Parmenides has him visit Athens with Zeno at about sixty-five and meet a very young Socrates, which would place his birth around 515. Speusippus reported that he gave Elea its laws, and a portrait head of the first century CE found there names him a natural philosopher and links him with the cult of Apollo the Healer. He wrote a single poem in hexameter verse, perhaps 800 lines long, of which about 160 survive in quotations; the title On Nature was probably added later. Sextus Empiricus preserves most of its opening, and Simplicius copied out the central argument (fragment 8) because the book had become rare.",
        "The proem describes a journey. Mares draw the narrator's chariot, guided by the daughters of the Sun, to the gates of the paths of Night and Day; Justice opens them, and a goddess welcomes him. She promises he will learn both “the unshaken heart of well-rounded truth” and the opinions of mortals, in which there is no true reliability.",
        "She sets out the ways of inquiry (fragment 2). One is that it is and cannot not be; the other, that it is not and must not be, is a path from which no report comes, since what is not can be neither known nor pointed out. Fragment 6 scorns mortals who “wander two-headed”, taking being and not-being as the same and not the same. Fragment 7 warns against letting habit force one to rely on an aimless eye and an echoing ear, and tells the listener to judge by reason. Fragment 8 then lists the signs on the true road: what is is ungenerated and imperishable, whole, of a single kind, unmoved and complete. It cannot come to be from what is not, cannot be divided, and is held within limits, compared by the goddess to a sphere equally extended from its centre.",
        "The second part of the poem, the Doxa, gives the cosmology of mortals, built on two forms, light and night. It describes the heavens, sun, moon and Milky Way, says the moon shines with light borrowed from the sun, and, according to later reports, identifies the morning and evening star as one body; it also gave an account of human reproduction. How the two parts fit is the central puzzle. Readers have taken Parmenides as a strict monist for whom only one unchanging thing exists (Guthrie); as an analyst of what can be thought or said (Russell, Owen); as setting the conditions any fundamental entity must meet (Mourelatos, Curd); as describing one reality in its intelligible and its perceptible aspects, the dominant ancient view; or as distinguishing necessary being from the contingent world of the cosmology (John Palmer).",
        "His influence shaped the rest of Greek philosophy. Zeno's paradoxes defended him, and Melissus restated his monism. Empedocles, Anaxagoras and the atomists accepted that nothing comes into being from nothing and built pluralist physics to meet his demands. Plato portrayed him with reverence in the Parmenides and had the Eleatic Visitor of the Sophist test his teaching, and Aristotle discussed him among the first inquirers into being.",
        "Coming into being from sheer nonbeing would require treating nonbeing as a source. The poem also presents an ordered account of the world as mortals understand it."
      ],
      [
        "A distinction to take into Athens",
        "A modern reader may object by pointing to the ferry. Its journey obviously begins, and both passengers know where it began. That reply establishes that an ordinary change can be described. It leaves the goddess’s demand for a coherent account of coming to be unanswered. Conversely, a reconstruction that makes it impossible to tell why so much of the poem discusses the visible world owes the reader an account of the second part. The evidence constrains an interpretation in both directions.",
        "A continuing pattern may require changes in its constituents. An explanation of becoming must say what it means for something to come to be.",
        "Compare the river and the poem by choosing one exact question: can something undergoing change remain an object of intelligible inquiry? Heraclitus supplies examples in which order and change appear together. Parmenides asks what could qualify as an object of a secure inquiry in the first place. Their arguments can illuminate each other without a claim that a surviving text records a face-to-face debate. In Athens Socrates turns that demand for an exact object toward a practical decision. A man is about to prosecute his father. What does he need to understand before he can confidently call that action pious?"
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Heraclitus",
          "https://plato.stanford.edu/entries/heraclitus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Parmenides",
          "https://plato.stanford.edu/entries/parmenides/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Heraclitus",
          "https://plato.stanford.edu/entries/heraclitus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Parmenides",
          "https://plato.stanford.edu/entries/parmenides/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Heraclitus",
          "https://plato.stanford.edu/entries/heraclitus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Parmenides",
          "https://plato.stanford.edu/entries/parmenides/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy",
          "https://plato.stanford.edu/entries/parmenides/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Heraclitus",
          "https://plato.stanford.edu/entries/heraclitus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Parmenides",
          "https://plato.stanford.edu/entries/parmenides/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Presocratics",
          "https://plato.stanford.edu/entries/presocratics/"
        ]
      ]
    ]
  },
  {
    "id": "socrates",
    "title": "Socrates at the courthouse",
    "tags": [
      "Greek",
      "Ethics",
      "Language",
      "Logic"
    ],
    "period": "Ancient",
    "book": "classic-plato-socrates",
    "sec": 1,
    "anchor": "Piety is doing as I am doing",
    "citation": "Plato · Euthyphro, first definition",
    "read": "Read the proposal to prosecute the guilty and Socrates’ request for what pious acts have in common.",
    "terms": [
      "elenchus",
      "deduction"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Socrates",
        "https://plato.stanford.edu/entries/socrates/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Plato Ethics Shorter",
        "https://plato.stanford.edu/entries/plato-ethics-shorter/"
      ]
    ],
    "sections": [
      [
        "A prosecution in the family",
        "At the entrance to the king archon’s court in Athens, Plato brings two men together for very different reasons. Socrates faces a charge involving religion. Euthyphro has come to prosecute his own father after a man’s death. Other members of the family think the prosecution itself irreverent. Euthyphro believes he understands the divine requirements well enough to go ahead. If he is wrong, the cost will fall on a real family inside the story. The dialogue makes a definition matter before anyone offers one.",
        "Piety means proper conduct toward what is divine. As readers we can grant that Euthyphro takes the matter seriously while holding open whether his confidence is justified. Socrates asks for something that would let another person distinguish pious conduct from impiety. Pointing to the prosecution shows what Euthyphro is willing to do. It leaves unanswered how he recognized this case as an instance of the right kind. When someone offers a second, very different case, what common feature would let them settle it?",
        "Euthyphro offers his own prosecution as an instance of piety. Socrates asks what makes every pious act pious."
      ],
      [
        "The Athenian behind the literary figure",
        "Socrates was born in Athens in 469 BCE, in the deme of Alopece. His father, Sophroniscus, was a stoneworker, and his mother, Phaenarete, a midwife. In the Phaedo he recalls reading the books of Anaxagoras eagerly and being disappointed by them. He married Xanthippe and had three sons, Lamprocles, Sophroniscus and Menexenus. He served as a hoplite at Potidaea (432–429), where he saved the wounded Alcibiades, at Delium (424), where he was admired in the retreat, and at Amphipolis (422).",
        "Twice he defied those in power. In 406, serving on the presiding committee of the Council, he opposed the illegal proposal to try the generals of the Arginusae battle as a group. Under the Thirty, the oligarchy of 404–403, he refused an order to bring Leon of Salamis to be put to death. Among those close to him were Alcibiades, Charmides and Critias.",
        "In Plato's Apology Socrates tells how his friend Chaerephon asked the Delphic oracle whether anyone was wiser than Socrates, and the oracle said no one was. Knowing he had no wisdom of importance, he questioned politicians, poets and craftsmen, found that they believed they knew what they did not, and concluded that his wisdom lay in recognizing his ignorance. He took questioning as a mission from the god. His method, the elenchus, tests an interlocutor's answer to a question such as “What is piety?” in the Euthyphro against other things the interlocutor agrees to, and many conversations end in perplexity (aporia). He spoke of a sign, a kind of voice, that always held him back and never urged him on. In the Stanford entry's words, his irony “consisted in his saying that he knew nothing of importance”.",
        "In 399 Meletus, joined by Anytus and Lycon, charged him with impiety: corrupting the young, failing to believe in the gods the city believes in, and believing in new divinities of his own. Found guilty, he proposed a fine of thirty minae, and the jury voted for death. The execution waited about a month for a sacred ship to return from Delos; he refused Crito's plan for his escape and drank the poison. At his trial, in Plato's account, he said that the unexamined life is not worth living.",
        "Socrates wrote nothing, which creates the Socratic problem. Aristophanes' comedy Clouds (423) gathers into one character, Socrates, features of several intellectuals; Xenophon, whom the Stanford entry calls a practical man, wrote the Memorabilia; Plato, in his twenties at the trial, gives the richest portrait, though his dialogues do not agree with one another. Gregory Vlastos's reading, which found the historical Socrates in Plato's early dialogues, held sway until the mid-1990s. Doctrines such as the claim that actions done in ignorance are involuntary belong to this contested Socrates. Alexander Nehamas, quoted in the Stanford entry, writes that “with the exception of the Epicureans, every philosophical school in antiquity” claimed him.",
        "Plato assigns words to a character in a composed dialogue. A separate witness can support a historical inference when its evidence is independent."
      ],
      [
        "What it means to examine an answer",
        "Suppose a magistrate defines justice as returning what one has borrowed. A borrowed tool seems to fit. A weapon returned to someone in a violent frenzy makes the definition look dangerous. The second example tests the rule without requiring anyone to deny that returning the tool was just. A counterexample targets the proposed connection between feature and classification. It can leave the original example standing.",
        "Elenchus is a Greek word used for testing or refutation. In a Socratic examination the interlocutor’s own commitments matter. If the two speakers disagree about a premise from the outset, simply deriving something from it may do little to trouble the interlocutor. When Euthyphro accepts a premise himself, a consequence that conflicts with another of his commitments gives him a reason to reconsider. There may be several ways to restore consistency. Determining which belief to revise takes another argument.",
        "Incompatible commitments show that the whole set cannot stand. Rejecting a particular commitment requires a reason to retain the others."
      ],
      [
        "Follow the successive definitions",
        "In the Apology Socrates traces his questioning to Delphi, where Chaerephon asked the oracle whether anyone was wiser than Socrates, and “the Pythian prophetess answered, that there was no man wiser” (Apology 21a). Puzzled, since he knew “that I have no wisdom, small or great” (Apology 21b), he went to a politician with a reputation for wisdom, hoping to refute the oracle. The man thought himself wise and was not, and Socrates concluded that he had the advantage over him: “I neither know nor think that I know” (Apology 21d). Poets and craftsmen fared no better, and he took the oracle to mean “that God only is wise” (Apology 23a), and that the wisest man is the one who, like Socrates, knows that his wisdom “is in truth worth nothing” (Apology 23b). He calls himself “a sort of gadfly, given to the state by God” (Apology 30e), and tells the jury that “the unexamined life is not worth living” (Apology 38a). Paul Woodruff (Stanford Encyclopedia) thinks some form of elenchus probably lies behind Socrates' report that everyone he examined who claimed wisdom was found wanting.",
        "The Euthyphro shows the method at work on one question. Socrates asks, “And what is piety, and what is impiety?”, assuming that piety is “in every action always the same” (Euthyphro 5d). Euthyphro answers from his own case, prosecuting his father for the death of a serf: “Piety is doing as I am doing” (Euthyphro 5d). Socrates reminds him that he had asked him to “explain the general idea which makes all pious things to be pious” (Euthyphro 6d), something to serve as “a standard to which I may look” (Euthyphro 6e). The second answer, “Piety, then, is that which is dear to the gods” (Euthyphro 6e), fails because the gods quarrel, so that the same things are “both hateful and dear to them” (Euthyphro 8a). Euthyphro amends it: “what all the gods love is pious and holy” (Euthyphro 9e). Socrates then asks whether the holy is “beloved by the gods because it is holy”, or holy because it is beloved (Euthyphro 10a). Euthyphro grants the first, “It is loved because it is holy, not holy because it is loved” (Euthyphro 10d), and so his definition, asked for the essence, gives “an attribute only” (Euthyphro 11a); in Burnet's Greek, ousia and pathos. A third attempt makes piety “that part of justice which attends to the gods” (Euthyphro 12e), and ends as “learning how to please the gods in word and deed” (Euthyphro 14b), which brings the argument back to what is dear to the gods. “Then we must begin again and ask, What is piety?” (Euthyphro 15c), Socrates says, and Euthyphro leaves. Woodruff calls the conclusion aporia, an impasse.",
        "Woodruff sets out the requirements Socrates' question imposes: an answer must belong to every case of the virtue, to nothing that is not a case, and must explain why the cases are what they are. The rules of the exchange are that the respondent “must answer every question according to his own beliefs”, and the questioner secures agreement to premises that turn out inconsistent with the first answer. The Internet Encyclopedia's article gives Gregory Vlastos's statement of the pattern: the interlocutor “asserts a thesis, p”; “Socrates secures agreement to further premises, say q and r”; and the interlocutor agrees that q and r entail not-p. It notes that “the Socratic method is sometimes dubbed the elenchus”, and that Socrates himself never gives his method that name. Woodruff's puzzle is how the method could lead to “any firm result” when its premises “have no authority beyond the partner's agreement”.",
        "Divine love can be explained by a prior feature of the act. Defining piety by approval makes approval constitutive of piety."
      ],
      [
        "What an unresolved ending can teach",
        "Euthyphro’s departure leaves a reader without a settled definition. The discussion nevertheless changes what a successful answer must do. It must apply across cases, handle disagreement among the gods, and explain the relation between piety and divine approval. One useful result of philosophical inquiry is an exact account of why a once-plausible answer fails. That result can guide the next attempt.",
        "A dialogue can expose defects in every answer so far offered. Declaring a satisfactory answer impossible requires excluding further proposals.",
        "Plato supplies the conversation in which this happens. Readers have to distinguish the claims made by individual speakers, the design of the dialogue and the beliefs historians can responsibly attribute to the historical Socrates. In the Republic a younger interlocutor will agree with a conclusion and still insist that Socrates defend it better. Why should anyone choose justice when acting unjustly would pay?"
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Socrates",
          "https://plato.stanford.edu/entries/socrates/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Shorter",
          "https://plato.stanford.edu/entries/plato-ethics-shorter/"
        ]
      ],
      [
        [
          "Debra Nails and S. Sara Monoson, “Socrates”, Stanford Encyclopedia of Philosophy (substantive revision 26 May 2022)",
          "https://plato.stanford.edu/entries/socrates/"
        ],
        [
          "Paul Woodruff, “Plato’s Shorter Ethical Works”, Stanford Encyclopedia of Philosophy (substantive revision 18 December 2022)",
          "https://plato.stanford.edu/entries/plato-ethics-shorter/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Socrates",
          "https://plato.stanford.edu/entries/socrates/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Shorter",
          "https://plato.stanford.edu/entries/plato-ethics-shorter/"
        ]
      ],
      [
        [
          "Paul Woodruff, “Plato’s Shorter Ethical Works”, Stanford Encyclopedia of Philosophy (substantive revision 18 December 2022)",
          "https://plato.stanford.edu/entries/plato-ethics-shorter/"
        ],
        [
          "“Socratic Method”, Internet Encyclopedia of Philosophy",
          "https://iep.utm.edu/socratic-method/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Socrates",
          "https://plato.stanford.edu/entries/socrates/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Shorter",
          "https://plato.stanford.edu/entries/plato-ethics-shorter/"
        ]
      ]
    ]
  },
  {
    "id": "justice",
    "title": "Plato: why be just?",
    "tags": [
      "Greek",
      "Ethics",
      "Politics",
      "Mind"
    ],
    "period": "Ancient",
    "book": "classic-plato-republic",
    "sec": 4,
    "anchor": "hunger and thirst, and the desires in general",
    "citation": "Plato · Republic IV, thirst and opposition",
    "read": "Read the exchange about a thirsty person who refuses to drink. Identify what has to be opposed for Socrates’ argument to work.",
    "terms": [
      "tripartite-soul",
      "virtue-ethics"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
        "https://plato.stanford.edu/entries/plato-ethics-politics/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Plato",
        "https://plato.stanford.edu/entries/plato/"
      ]
    ],
    "sections": [
      [
        "The challenge at a festival",
        "Socrates expects to leave the Piraeus after a festival. In Plato’s Republic he stays among companions, and a conversation about paying what one owes grows into a challenge about the worth of justice. In Book II Glaucon asks what a perfectly unjust person could gain with the reputation of a perfectly just one. Adeimantus adds that familiar praise for justice often advertises its rewards. A parent who recommends honesty because employers trust an honest worker has given a child a reason to acquire a reputation. What happens when an excellent reputation can be acquired by deceit?",
        "This is an experiment in separating variables. Imagine changing what people believe about two lives while holding the actual conduct of each person fixed. Remove praise from the just life and attach it to the unjust one. If you still recommend living justly, you must identify some good that justice brings to its possessor. The exercise is deliberately severe. A person who says that good conduct ordinarily pays has left Glaucon’s distinctive challenge in place.",
        "A reputation for justice can bring rewards from others. Glaucon asks what justice itself contributes to the person who has it."
      ],
      [
        "Enlarge the question: from the city to the soul",
        "In Book II Glaucon and Adeimantus press Socrates to show that justice is to be chosen for itself (Rep. II); Eric Brown (Stanford Encyclopedia) notes that “Socrates' strategy depends on an analogy between a city and a person.” In the city built in Books II–IV, justice turns out to be the principle laid down at its founding, that each should do the one thing his nature suits: “justice was doing one’s own business, and not being a busybody” (Rep. 433a). Meddling among the three classes is the greatest harm to the city, and when traders, auxiliaries and guardians “each do their own business, that is justice” (Rep. 434c).",
        "Socrates then asks whether the soul has the same three principles, warning that the present method is inadequate and “the true method is another and a longer one” (Rep. 435d). His test is a principle: “The same thing clearly cannot act or be acted upon in the same part” in contrary ways at the same time (Rep. 436b); Brown calls it the principle of non-opposition. A man may be thirsty and yet unwilling to drink (Rep. 439c), so the part that reasons and forbids differs from the part that thirsts, which Jowett calls “the irrational or appetitive” (Rep. 439d). Leontius, passing the bodies of executed men, felt both a desire to see them and abhorrence; at last he ran to them crying, “Look, ye wretches, take your fill of the fair sight” (Rep. 440a). The moral is that “anger at times goes to war with desire” (Rep. 440a), and in such struggles “his spirit is on the side of his reason” (Rep. 440b). Spirit is a third part, unless corrupted by bad education “the natural auxiliary of reason” (Rep. 441a), and so the principles in city and soul are agreed to be “three in number” (Rep. 441c).",
        "The individual is just in the same way as the city: one in whom “the several qualities of his nature do their own work will be just” (Rep. 441d–e). Reason, wise and caring for the whole soul, should rule, with spirit as “the subject and ally” (Rep. 441e), and the two together govern appetite, “the largest part of the soul and by nature most insatiable of gain” (Rep. 442a). A person is courageous when spirit “retains in pleasure and in pain the commands of reason” about what to fear (Rep. 442b–c), wise by the ruling part's knowledge of what is “for the interest of each of the three parts” and of the whole (Rep. 442c), and temperate when all three “are equally agreed that reason ought to rule” (Rep. 442c–d). The city's division of labour “was a shadow of justice” (Rep. 443c); justice itself concerns the inner life, and the just man “is his own master and his own law, and at peace with himself” (Rep. 443d). Injustice is “a strife which arises among the three principles” (Rep. 444b), and virtue is “the health and beauty and well-being of the soul” (Rep. 444d–e).",
        "Socrates checks the account against common cases: such a man is the least likely to make away with a deposit of gold or silver, or to commit theft, sacrilege or treachery (Rep. 442e–443a). Brown credits David Sachs (1963) with the objection that this leaves unshown why a soul in such order will act justly in the ordinary sense, and judges that Socrates leaves the worry unaddressed at the end of Book IV, and Brown looks for answers in Books II–III and V–VII. How agent-like the three parts are is disputed: see below.",
        "In the enlarged model, groups carry out different social functions. In the individual, different sources of motivation can conflict."
      ],
      [
        "Testing the analogy",
        "Socrates asks us to look for justice in a community before searching for it in an individual. Larger letters are easier to read. An analogy transfers a relation between cases. Here it invites readers to compare divisions of work in a city with different sources of motivation in a person. It raises an immediate objection: cities contain many individual people, while the question concerned a single person. Similar vocabulary cannot guarantee similar structure. We need evidence of conflict within the individual.",
        "Think through the thirsty person’s refusal. A glass is available and the person is thirsty. A doctor has warned against drinking what is in the glass. One pull toward drinking and a contrary pull away from it show up at once. If the person were thirsty this morning and satisfied this afternoon, the case would show only a change over time. For the argument to do its work, the opposed pulls must concern the same thing at the same time in the relevant respect. Only then is there a reason to distinguish their sources.",
        "An ordinary decision brings out another difference. Suppose you know you were overcharged but your first response is embarrassment and a desire to get away. A friend objects on your behalf and you begin to feel indignant. Spirit, the capacity associated with anger and honour, may ally with the judgment that you were wronged. Treating every strong desire as appetite would erase the distinctive explanatory job this part is supposed to do.",
        "Thirst considered by itself draws the person toward a drink. A judgment about the drink’s danger can oppose thirst.",
        "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect. A sequence of different wishes is compatible with one changing motivation."
      ],
      [
        "Why the dialogue makes room for an opponent",
        "Plato (429?–347 BCE in Richard Kraut's dates) was, in Kraut's words, “An Athenian citizen of high status”. He was around 28 when Socrates was tried and executed in 399 BCE, and Socrates speaks in nearly all of his dialogues. Aristotle came to Athens at about seventeen to study in the Academy, Plato's school, and stayed there until Plato died in 347. A collection of thirteen letters is included among his works, though Kraut judges that “many or most of them are almost certainly not his”.",
        "Nearly all his works are dialogues. Plato never speaks to his readers in his own voice, so his views have to be inferred from the arguments and the drama, and scholars debate how far his Socrates speaks for Plato. The dialogues are often grouped as early, short Socratic conversations that test definitions of virtues and end in perplexity, such as the Euthyphro and Laches; middle, including the Phaedo, Symposium, Republic and Phaedrus; and late, including the Sophist, Statesman, Timaeus, Critias, Philebus and Laws. Whether the grouping gives the order of composition is disputed."
      ],
      [
        "A just person outside the argument",
        "There is a distance between the harmonious person described by the argument and the ordinary demands of justice. Consider somebody who is organized, steady under pressure and exceptionally good at planning a fraud. Any account equating justice with mere internal efficiency would give a startling verdict. The challenge to Plato is to show why a soul properly ordered by reason could not choose that plan. Say what reason understands and why that understanding would govern action. Simply repeating the word harmony leaves the critic’s example untouched.",
        "Plato connects justice with a rightly ordered relation among the soul’s parts. A person can obey a rule solely to preserve a good reputation.",
        "Now reverse the pressure. A person might return a deposit solely for fear of being discovered. The act fits an ordinary demand of justice even as fear, calculation and greed pull against one another. Plato’s account gives us a reason to distinguish doing what a just person would do on this occasion from having a just character. Both examples test how much explanatory work the idea of order can carry. In the next module Socrates must say how reason can learn to govern well. The picture he offers is a prisoner whose first encounter with the light hurts."
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato",
          "https://plato.stanford.edu/entries/plato/"
        ]
      ],
      [
        [
          "Eric Brown, “Plato’s Ethics and Politics in The Republic”, Stanford Encyclopedia of Philosophy (substantive revision 12 September 2017)",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ],
        [
          "Richard Kraut, “Plato”, Stanford Encyclopedia of Philosophy (substantive revision 24 April 2026)",
          "https://plato.stanford.edu/entries/plato/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato",
          "https://plato.stanford.edu/entries/plato/"
        ]
      ],
      [
        [
          "Richard Kraut, “Plato”, Stanford Encyclopedia of Philosophy (substantive revision 24 April 2026)",
          "https://plato.stanford.edu/entries/plato/"
        ],
        [
          "Christopher Shields, “Aristotle”, Stanford Encyclopedia of Philosophy (substantive revision 25 August 2020)",
          "https://plato.stanford.edu/entries/aristotle/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato",
          "https://plato.stanford.edu/entries/plato/"
        ]
      ]
    ]
  },
  {
    "id": "cave",
    "title": "Plato: learning to see",
    "tags": [
      "Greek",
      "Epistemology",
      "Metaphysics",
      "Education"
    ],
    "period": "Ancient",
    "book": "classic-plato-republic",
    "sec": 7,
    "anchor": "let me show in a figure",
    "citation": "Plato · Republic VII, opening of the cave",
    "read": "Follow the prisoner as he turns. Notice when the familiar shadows seem clearer than the things producing them.",
    "terms": [
      "forms",
      "dialectic"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Plato",
        "https://plato.stanford.edu/entries/plato/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
        "https://plato.stanford.edu/entries/plato-ethics-politics/"
      ]
    ],
    "sections": [
      [
        "The prisoner who wants to turn back",
        "In Book VII of the Republic, Socrates asks Glaucon to imagine people who have faced one wall since childhood. They see shadows crossing it. Give one prisoner freedom to move, turn him toward the light, and ask what he can identify. What used to be easy now hurts his eyes. The first result of education in this story is disorientation. A person can become less confident because the conditions of understanding have improved.",
        "The setting matters. In the previous argument a just soul was supposed to be governed by reason. That claim places a heavy burden on education. How could a person distinguish a reason to believe from a performance that has repeatedly won applause? Someone familiar with every shadow could predict the next appearance and gain a reputation for wisdom. If the fire, the objects and the people carrying them remained outside view, prediction alone would leave that person unable to explain what made the appearances possible.",
        "Repeated exposure makes shadows readily recognizable to a prisoner. Seeing what casts a shadow can explain why it appears as it does."
      ],
      [
        "From particular examples to an object of knowledge",
        "In the Phaedo Socrates asks Simmias, “Is there or is there not an absolute justice?” (Phaedo 65d), and Simmias agrees that there is, and an absolute beauty and good, none of which he has ever seen with his eyes. Jowett's “absolute” renders the Greek for “itself”: at 65d Burnet's text reads dikaion auto, literally the just itself. Equal sticks and stones “appear at one time equal, and at another time unequal” (Phaedo 74b), while the equal itself never appears unequal, so the sticks are “not the same with the idea of equality” (Phaedo 74c). All such equals “strive to attain absolute equality, but fall short of it” (Phaedo 75a). Socrates argues that we must have known the equal itself before we first perceived equal things, since we refer them to it, and that what we call learning is the recovery of that earlier knowledge through the senses: “may not this be rightly termed recollection?” (Phaedo 75e). The argument begins from Cebes' reminder of Socrates' “favorite doctrine” that knowledge is recollection (Phaedo 72e); the Meno sets out that doctrine at length.",
        "Asked whether the essences are ever changed, Cebes answers, “They must be always the same” (Phaedo 78d), while the many beautiful men, horses and garments are “always in a state of change” (Phaedo 78e). These can be seen and touched, but “the unchanging things you can only perceive with the mind” (Phaedo 79a). Later, giving his own account of causes, Socrates holds that a beautiful thing is beautiful “only in as far as it partakes of absolute beauty” (Phaedo 100c), and that “by beauty all beautiful things become beautiful” (Phaedo 100d). Allan Silverman (Stanford Encyclopedia) reads the Phaedo's Forms as “beings that are what they are in virtue of themselves”, “immaterial, non-spatial and atemporal”, and offers “a relation between material particulars and Forms” as a first approximation of partaking.",
        "In Republic V the lovers of sights and sounds delight in fine colours and forms, but “their mind is incapable of seeing or loving absolute beauty” (Rep. 476b). Whoever takes beautiful things for beauty itself is dreaming: he is one “who puts the copy in the place of the real object” (Rep. 476c). The philosopher is awake, able “to distinguish the idea from the objects which participate in the idea” (Rep. 476c–d). Knowledge “is relative to being” (Rep. 477b), and opinion turns out to lie between knowledge and ignorance (Rep. 478d). Those who see many beautiful things but not beauty itself “may be said to have opinion but not knowledge” (Rep. 479e); those who see “the absolute and eternal and immutable” may be said to know (Rep. 479e). What this argument sets knowledge and opinion over is disputed: scholars disagree about whether knowledge and opinion must concern different objects.",
        "A particular beautiful thing can appear beautiful in one setting and ugly in another. A Form supplies a stable object of inquiry into what makes such judgments possible."
      ],
      [
        "Why a beautiful example can disappoint",
        "Imagine two people agreeing that a particular melody is beautiful. One hears the balance between the two halves; the other hears the singer’s voice. A third listener points out that a beautiful voice can deliver an ugly performance. The discussion has moved from an example to the question of what accounts for beauty across examples. Plato’s term Form names an intelligible object such as Beauty itself, which his speakers distinguish from the many beautiful things. A capital letter signals that technical use in English.",
        "A reader can object that comparisons among particular melodies might do all the work. Perhaps people learn by making finer discriminations among cases, and an additional object beyond them explains nothing. The Platonic reply would need to show what lets us correct our judgments across cases. Disagreement by itself is no proof that Forms exist. It creates a problem to which the theory proposes a solution. Ask what that solution explains before asking whether it is necessary.",
        "Showing a beautiful performance gives an instance that invites agreement. Saying what makes performances beautiful proposes a basis for judging further instances."
      ],
      [
        "The sun, the divided line and the cave",
        "In Book VI Socrates says that Adeimantus has often been told “that the idea of good is the highest knowledge” (Rep. 505a). The many beautiful and good things, he says, “are seen but not known”, and their ideas “are known but not seen” (Rep. 507b). The sun gives visible things their visibility and their growth, and the good, in the same way, imparts truth to the known and the power of knowing to the knower (Rep. 508e), and gives the objects of knowledge their being; yet “the good is not essence, but far exceeds essence in dignity and power” (Rep. 509b). Silverman observes, citing Gerasimos Santas (1980), that Plato “never says in what sense the Good is responsible” for “the knowability and being of the objects of knowledge”.",
        "Next comes “a line which has been cut into two unequal” parts, the visible below and the intelligible above, each cut again in the same proportion (Rep. 509d). In the lower intelligible part the soul uses visible things as images and reasons from hypotheses down to conclusions (Rep. 510b), as geometers do; in the higher, dialectic uses hypotheses “as steps and points of departure” toward “the first principle of the whole” and ends in ideas (Rep. 511b–c). To the four parts answer four states of the soul, noēsis, dianoia, pistis and eikasia in Burnet's Greek, which Jowett gives as reason, understanding, faith and “perception of shadows” (Rep. 511d–e). Silverman reports that what the objects of dianoia are is a matter of great controversy, and cites Myles Burnyeat (1987) for the leading approaches.",
        "Book VII pictures human beings who have lived from childhood in an underground den (Rep. 514a), chained so that “they see only their own shadows, or the shadows of one another” (Rep. 515a). A prisoner freed and dragged up into the light sees first shadows, then reflections, then the things themselves, the heavens by night, and last the sun itself (Rep. 516a–b). Socrates applies the image: the prison is the world of sight, and the journey upward is “the ascent of the soul into the intellectual world” (Rep. 517b), where “the idea of good appears last of all” (Rep. 517b–c). Education on this account turns the whole soul around, since “the power and capacity of learning exists in the soul already” (Rep. 518c), and needs an art of “conversion” (Rep. 518d). Those who have seen the good must take their turn and “go down to the general underground abode” to rule (Rep. 520c).",
        "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight. The divided line distinguishes modes of cognition and their objects."
      ],
      [
        "The trip back down",
        "The story does not end when the prisoner sees outside. Socrates asks what will happen when someone accustomed to daylight returns to judge shadows beside people who never left. For a time that person may look clumsy. The practical question is who should govern and what a political community can ask of those it educates. Glaucon objects to sending people who could enjoy a better life back into public responsibilities. Socrates’ defence concerns the good of the city as a whole.",
        "A returning prisoner needs time to see in the dark again. The education of a guardian raises the question of service to fellow citizens.",
        "There are now two objections a careful reader can keep apart. One questions what the liberated prisoner has learned: why accept the proposed higher objects of knowledge? The other grants that the education succeeds and asks whether the graduate owes service to the city. A response about the value of truth may leave the political obligation unexplained. A response about civic duty may leave the theory of knowledge untouched. Aristotle, who studied in Plato’s Academy, will insist on beginning an inquiry into nature by distinguishing several senses of an ordinary question: why?"
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Plato",
          "https://plato.stanford.edu/entries/plato/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ]
      ],
      [
        [
          "Allan Silverman, “Plato’s Middle Period Metaphysics and Epistemology”, Stanford Encyclopedia of Philosophy (substantive revision 14 July 2014)",
          "https://plato.stanford.edu/entries/plato-metaphysics/"
        ],
        [
          "Richard Kraut, “Plato”, Stanford Encyclopedia of Philosophy (substantive revision 24 April 2026)",
          "https://plato.stanford.edu/entries/plato/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Plato",
          "https://plato.stanford.edu/entries/plato/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ]
      ],
      [
        [
          "Allan Silverman, “Plato’s Middle Period Metaphysics and Epistemology”, Stanford Encyclopedia of Philosophy (substantive revision 14 July 2014)",
          "https://plato.stanford.edu/entries/plato-metaphysics/"
        ],
        [
          "Richard Kraut, “Plato”, Stanford Encyclopedia of Philosophy (substantive revision 24 April 2026)",
          "https://plato.stanford.edu/entries/plato/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Plato",
          "https://plato.stanford.edu/entries/plato/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Plato Ethics Politics",
          "https://plato.stanford.edu/entries/plato-ethics-politics/"
        ]
      ]
    ]
  },
  {
    "id": "causes",
    "title": "Aristotle: what counts as an explanation?",
    "tags": [
      "Greek",
      "Metaphysics",
      "Philosophy of nature"
    ],
    "period": "Ancient",
    "book": "classic-aristotle-physics",
    "sec": 2,
    "anchor": "bronze of the statue",
    "citation": "Aristotle · Physics II.3",
    "read": "Read the account of the statue and the examples around it. Keep the questions about its material, structure, production and purpose distinct.",
    "terms": [
      "four-causes",
      "potentiality",
      "substance"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Aristotle Causality",
        "https://plato.stanford.edu/entries/aristotle-causality/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Aristotle Natphil",
        "https://plato.stanford.edu/entries/aristotle-natphil/"
      ]
    ],
    "sections": [
      [
        "At the bronze worker’s door",
        "Imagine an Athenian apprentice watching a worker remove the mould from a bronze statue. The apprentice wants to know why there is a figure standing here. The worker could point to the bronze, trace the lines of the design, describe the labour of casting, or explain who commissioned the figure and why. A witness could accept all four answers. Each singles out something without which the explanation the apprentice wants would be incomplete.",
        "Aristotle studied in Plato’s Academy and later taught in Athens. In the Physics he asks what it takes to know something by nature. Ancient physics here includes a broad inquiry into things that change and into the source of their changes. The Greek word aitia can name a cause or an explanatory factor. Restrict it to a push delivered by one object to another and several of Aristotle’s examples become unintelligible. A piece of bronze helps explain a statue although calling bronze a push would be nonsense."
      ],
      [
        "Four answers to a single why-question",
        "The Greek word is aitia, and Andrea Falcon suggests that “it can be useful to think of a cause as a certain type of explanation”. Aristotle gives his general account of the four causes in Physics II.3 and Metaphysics V.2, two chapters that give the same four senses with the same examples.",
        "Physics II.3 starts from knowledge: we think we know a thing only when we have grasped its ‘why’, its primary cause (Phys. II.3). It then names four senses of ‘cause’: “that out of which a thing comes to be and which persists” (Phys. II.3), as the bronze of the statue; the form, “the statement of the essence” (Phys. II.3), as the ratio 2:1 of the octave; “the primary source of the change or coming to rest” (Phys. II.3), as the father of the child; and the end, “‘that for the sake of which’ a thing is done” (Phys. II.3), as health is the cause of walking about. One thing can have several causes: the art of the sculptor and the bronze both cause the statue, “the one being the material cause, the other the cause whence the motion comes” (Phys. II.3). Metaphysics V.2 repeats the list with the same examples (Met. V.2), and Metaphysics I.3 opens its history of earlier philosophy by saying that “causes are spoken of in four senses” (Met. I.3). Falcon reads Metaphysics I.3–7 as a review in which Aristotle's predecessors “merely touched upon these causes”.",
        "Physics II.7 ties the causes to the question ‘why’: there are as many causes as there are things the question asks after (Phys. II.7). The physicist must know all four, “the matter, the form, the mover, ‘that for the sake of which’” (Phys. II.7), and the last three “often coincide” (Phys. II.7): the form and the end are one, and “the primary source of motion is the same in species as these” (Phys. II.7), “for man generates man” (Phys. II.7).",
        "Hobbes and Descartes took William Harvey's work as a turn away from Galenic and Aristotelian anatomy, with its appeal to final causes, toward mechanistic science.",
        "The bronze explains what the statue is made of. The arrangement giving bronze the shape of this statue supplies a formal explanation.",
        "The source of a change explains what brings the work about. The end of an activity explains what it is undertaken for."
      ],
      [
        "What is inside a natural thing?",
        "Consider a bed built from wood and an acorn planted in soil. A bed can fall because it is heavy; it does not grow into another bed through its own activity as a bed. The seed can develop into a living plant through a source of change internal to it, given the appropriate conditions. Aristotle uses examples like these to distinguish a natural thing from an artifact, something made by a craft. The soil, water and sun still matter. Having an internal source of growth is compatible with depending on external conditions.",
        "A critic may point out that a planted piece of wooden furniture could sprout. Aristotle has an answer available. What sprouts would do so because it is wood. The joinery accounts for its shape as a bed. Notice how much work that phrase in virtue of does. The question asks which feature of the very same object explains its behaviour. Keeping the object fixed while changing the description is one way of discovering whether an explanation has identified the relevant cause.",
        "Now apply the question to the statue. The bronze explains why melting the figure could leave metal behind. The design explains why the figure counted as this kind of object before it melted. A material inventory can be complete for the purpose of recycling the metal and inadequate for identifying the figure as a statue. Explanatory adequacy depends on the question a reason is being offered to answer.",
        "A living thing has an internal principle of its characteristic growth. An artifact’s organization as an artifact comes from the maker’s activity."
      ],
      [
        "A capacity and its exercise",
        "Metaphysics V.12 sorts the senses of ‘potency’ and names the primary one “a source of change in another thing or in the same thing qua other” (Met. V.12). The art of building is a potency in the builder and never in the house; a doctor can heal himself, though not in his capacity as the one healed (Met. V.12). In the strictest sense, S. Marc Cohen and C. D. C. Reeve write, “a dunamis is the power that a thing has to produce a change”.",
        "Book IX (Theta) turns to actuality and declines to define it: we must “be content to grasp the analogy” (Met. IX.6), as building is to being able to build, waking to sleeping, and seeing to having sight with the eyes shut (Met. IX.6). Actuality is prior to potency in formula, because being capable of building means being able to build (Met. IX.8). It is prior in time in one sense: what is potentially a man is produced by an actual man, and “there is always a first mover” (Met. IX.8). It is prior in substantiality, because the actuality is the end for whose sake the potency exists: “animals do not see in order that they may have sight” (Met. IX.8). The argument concludes that “the substance or form is actuality” (Met. IX.8).",
        "What has a potency need not exercise it, so eternal movement needs a principle “whose very essence is actuality” (Met. XII.6), and such substances “must be without matter” (Met. XII.6).",
        "A capacity is a real ability requiring suitable conditions for its exercise. The exercise or realization of a capacity is an actuality."
      ],
      [
        "Does a purpose require a planner?",
        "A final cause is the end for the sake of which something occurs. An artist can state a purpose aloud. A living thing can grow roots even in the absence of anyone who planted it. Aristotle extends explanation by ends into nature. This is the issue called teleology. Consider the difference between saying that rain happens to save a crop and saying that roots grow in a way that enables a plant to obtain nourishment. For Aristotle, the regular organization of parts toward an activity is evidence worth explaining.",
        "A rival can accept the organization while disputing the proposed explanation. Suppose a critic says that useful arrangements survive and others perish. That account offers a way to explain a fit between structure and function without assuming that the fit was already an end directing formation. In Physics II.8 Aristotle considers a challenge involving teeth that happen to be suitable for biting and grinding. His response appeals to the regular occurrence of the fit. A modern reader should distinguish that ancient exchange from a modern account of evolution with its own mechanisms and evidence.",
        "A part’s contribution to a living whole can explain its characteristic development. A plan formed by a thinking agent explains deliberate production.",
        "Return to the apprentice. Asking what the object is for may be easy when the object is a commission and difficult when the object is alive. The vocabulary of an end becomes still harder when Aristotle asks what a human life is for. Does someone who wants wealth, honour and friends want three final ends, or do those pursuits answer to a further conception of living well?"
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Causality",
          "https://plato.stanford.edu/entries/aristotle-causality/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Natphil",
          "https://plato.stanford.edu/entries/aristotle-natphil/"
        ]
      ],
      [
        [
          "Andrea Falcon, “Aristotle on Causality”, Stanford Encyclopedia of Philosophy (substantive revision 7 March 2023)",
          "https://plato.stanford.edu/entries/aristotle-causality/"
        ],
        [
          "Colin Allen and Jacob Neal, “Teleological Notions in Biology”, Stanford Encyclopedia of Philosophy (substantive revision 6 February 2026)",
          "https://plato.stanford.edu/entries/teleology-biology/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Causality",
          "https://plato.stanford.edu/entries/aristotle-causality/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Natphil",
          "https://plato.stanford.edu/entries/aristotle-natphil/"
        ]
      ],
      [
        [
          "S. Marc Cohen and C. D. C. Reeve, “Aristotle’s Metaphysics”, Stanford Encyclopedia of Philosophy (substantive revision 24 January 2025)",
          "https://plato.stanford.edu/entries/aristotle-metaphysics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Causality",
          "https://plato.stanford.edu/entries/aristotle-causality/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Natphil",
          "https://plato.stanford.edu/entries/aristotle-natphil/"
        ]
      ]
    ]
  },
  {
    "id": "character",
    "title": "Aristotle: becoming good at living",
    "tags": [
      "Greek",
      "Ethics",
      "Mind"
    ],
    "period": "Ancient",
    "book": "classic-aristotle-ethics",
    "sec": 3,
    "anchor": "where we do things by nature",
    "citation": "Aristotle · Nicomachean Ethics II.1",
    "read": "Read from the comparison with the senses through the examples of builders and musicians. Watch why practice can produce bad habits too.",
    "terms": [
      "eudaimonia",
      "virtue-mean",
      "phronesis"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Aristotle Ethics",
        "https://plato.stanford.edu/entries/aristotle-ethics/"
      ]
    ],
    "sections": [
      [
        "The apprentice plays again",
        "Imagine a young musician in Aristotle’s Athens reaching the same difficult turn in a tune every morning. A listener hears cleaner notes after a month. Has the musician become a better person? The improvement in playing is real, but the ethical question remains open. Aristotle uses crafts to explain how people acquire dispositions. He also has to explain what distinguishes a just person from someone who can produce the right outward result when an audience is watching.",
        "A disposition is a settled tendency to feel or act in a certain way. A single generous gift can be a lucky action, a calculated advertisement or an expression of settled character. To tell which, look at what the giver chose, why it mattered, and whether the choice fits a stable pattern. That investigation concerns the reasons for the physical transfer of money. It also explains why a community’s arrangements for learning and practice belong inside an ethical inquiry."
      ],
      [
        "What Aristotle means by living well",
        "Nicomachean Ethics I.7 looks for the final end of everything a person does. An end pursued for itself and never for the sake of anything else is final without qualification, and happiness fits that description: “we always choose it for itself, and never for the sake of something else” (NE I.7). It is also self-sufficient, which Aristotle takes to mean that by itself it makes life desirable and lacking in nothing (NE I.7).",
        "To say more precisely what happiness is, Aristotle asks for the function (ergon) of a human being. Nutrition and growth are shared with plants, and sensation with horses and cattle; what remains is the active life of the part of us that has reason (NE I.7). A function is done well when it is done in accordance with the thing's own excellence, so the human good is “exercise of his faculties in accordance with excellence or virtue” (NE I.7, 1097b22–1098a20). Peters's “exercise of his faculties” renders the Greek psuchēs energeia, activity of the soul. It takes a complete life: “one swallow or one fine day does not make a spring” (NE I.7). Richard Kraut sums up the definition as “activity of the rational part of the soul in accordance with virtue”, and notes that Aristotle identifies happiness with virtuous activity, where one traditional conception had identified it with virtue itself.",
        "Happiness also needs external goods, since it is impossible, or not easy, to act nobly “without some furniture of fortune” (NE I.8, 1099a31–b6). Friends, wealth and political influence serve as instruments, and the lack of good birth, children or good looks spoils it (NE I.8). A man who meets the fate of Priam is not called happy (NE I.9). Kraut puts it that “one's happiness is endangered if one is severely lacking in certain advantages”.",
        "Book X returns to the question. If happiness is the exercise of virtue, it is the exercise of the highest virtue, the excellence of the best part of us, and this, Aristotle says, “consists in speculation or contemplation” (NE X.7). Contemplation is the most continuous of activities, the most self-sufficient, and the only one loved for its own sake alone (NE X.7), while the lives of the statesman and the soldier are unleisurely and aim at further ends (NE X.7, 1177b4–15). The life of the moral virtues is happy “in a secondary sense” (NE X.8). Contemplative happiness needs “but a small supply of external goods” (NE X.8, 1178a23–b7), and “Happiness, then, extends just so far as contemplation” (NE X.8).",
        "Whether Book X fits the rest of the Ethics is disputed. Kraut reports that some scholars have held that “X.7–8 are deeply at odds with the rest of the Ethics”; his own reading is that Aristotle assumes the philosopher will need the ethical virtues too, and he names no scholar on the other side.",
        "Aristotle assesses flourishing through activity across a life. A pleasant mood can vary while the person’s settled conduct stays the same."
      ],
      [
        "Why practice can go wrong",
        "Think back to the musician. Practising a passage every morning can establish a mistake just as firmly as a success. Repetition explains part of how a stable pattern forms; it cannot by itself tell us which pattern deserves cultivation. Aristotle applies this point to communities. A lawgiver can train citizens into certain ways of acting. Asking whether the lawgiver does this well brings judgment about the ends of that training back into view.",
        "Consider someone learning to speak up against an insult. In one situation speaking immediately protects a newcomer. In another, interrupting the person who was insulted prevents them from answering on their own behalf. The mere fact that the learner spoke tells us little about courage or tact. The circumstances, the person affected and the reason for choosing the moment help determine what the action was. This is why Aristotle’s mean cannot be found by measuring two quantities and dividing their sum by two.",
        "Repeated action shapes the dispositions from which later choices arise. An instructor can state a principle before the learner has acquired the corresponding habit.",
        "A person may perform an outwardly fair act under supervision. Virtuous action in the full sense involves knowing choice and a stable disposition."
      ],
      [
        "How a mean can vary with the case",
        "Nicomachean Ethics II.6 takes it as settled that virtue is a state of character (hexis), which Peters translates “habit or trained faculty”, and asks which state it is. The excellence of a thing makes it good and makes it do its work well, so human virtue is “the habit or trained faculty that makes a man good” (NE II.6).",
        "In anything continuous and divisible one can take more, less or an equal amount, either in the thing itself or relative to us. The mean in the thing is equidistant from both extremes and “one and the same for all”; the mean relative to us is “neither too much nor too little for us”, and differs from person to person (NE II.6). If ten pounds of food is too much and two too little, the trainer will not for that reason order six, which may be “too little for Milo, too much for the beginner” (NE II.6, 1106a36–b7). Richard Kraut writes that the mean must be determined in a way that “takes into account the particular circumstances of the individual”, and that finding it “is not a mechanical or thoughtless procedure”.",
        "Virtue of character concerns feelings and actions, which admit of excess, deficiency and the intermediate. To feel fear, confidence, appetite, anger or pity at the right times, on the right occasions, towards the right people, for the right end and in the right way is the intermediate and the best (NE II.6). There are many ways of going wrong and one way of going right, so virtue is hard: “easy to miss the mark and hard to hit” (NE II.6, 1106b28–33).",
        "Aristotle's definition follows. Virtue “is a habit or trained faculty of choice” (NE II.6), lying in the mean relative to us and determined by reason, “the reason by which the prudent man would determine it” (NE II.6). The prudent man is Peters's word for the phronimos, the person of practical wisdom. In its essence virtue is a mean; judged by what is best and right it is “the extreme of perfection” (NE II.6). Peters renders mesotēs as “moderation” and to meson as “the mean”, printing the Greek beside his words (NE II.6). Kraut stresses that the right amount can be large: Aristotle's treatment “endorses the idea that we should sometimes have strong feelings”.",
        "Some feelings and actions have no mean. Malevolence, shamelessness and envy, adultery, theft and murder have names that “imply badness”, and they are wrong however they are done (NE II.6).",
        "The appropriate response takes account of the danger and the agent’s circumstances. A numerical halfway point can be calculated from two extremes alone."
      ],
      [
        "When a rule runs out",
        "Practical wisdom is the capacity to deliberate well about action in particular circumstances. Imagine a precise rule: give the same amount to every person who asks. It eliminates some forms of favouritism, yet it can direct a rich giver to contribute very little in an emergency and a poor giver to abandon a dependent. One possible objection to Aristotle is that invoking good judgment can sound like telling a beginner to do whatever the wise person does. How could a learner recognize that person without already knowing the right answers?",
        "Practical wisdom judges what is good to do in particular circumstances. Technical skill enables a person to produce a result proficiently.",
        "Look again at the order of education. Examples, corrections and habits can teach a learner to notice relevant features before the learner can formulate a general account. Giving reasons then makes those judgments available for criticism. The success of that account depends on whether habits can be corrected when a whole community trains its citizens badly. The Epicureans and the Stoics will each offer a strikingly different way to assess which parts of a life deserve our concern."
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Ethics",
          "https://plato.stanford.edu/entries/aristotle-ethics/"
        ]
      ],
      [
        [
          "Richard Kraut, “Aristotle’s Ethics”, Stanford Encyclopedia of Philosophy (substantive revision 11 August 2026)",
          "https://plato.stanford.edu/entries/aristotle-ethics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Ethics",
          "https://plato.stanford.edu/entries/aristotle-ethics/"
        ]
      ],
      [
        [
          "Richard Kraut, “Aristotle’s Ethics”, Stanford Encyclopedia of Philosophy (substantive revision 11 August 2026)",
          "https://plato.stanford.edu/entries/aristotle-ethics/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Aristotle Ethics",
          "https://plato.stanford.edu/entries/aristotle-ethics/"
        ]
      ]
    ]
  },
  {
    "id": "garden",
    "title": "Epicurus: how much is enough?",
    "tags": [
      "Greek",
      "Hellenistic",
      "Ethics",
      "Mind"
    ],
    "period": "Ancient",
    "book": "classic-lucretius-nature",
    "sec": 3,
    "anchor": "Therefore death to us",
    "citation": "Lucretius · Of the Nature of Things III, on death",
    "read": "Read the Roman poet’s argument about sensation and death. Separate being dead from the experience of dying.",
    "terms": [
      "materialism",
      "deduction"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Epicurus",
        "https://plato.stanford.edu/entries/epicurus/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Lucretius",
        "https://plato.stanford.edu/entries/lucretius/"
      ]
    ],
    "sections": [
      [
        "A school with a garden",
        "In Athens Epicurus gathered students in a community remembered as the Garden. Suppose a visitor comes expecting a lesson in choosing the most sumptuous meal. Epicurus instead asks what happens when the visitor’s hunger has been satisfied. More elaborate dishes might change the experience of eating. Will their absence now make a good life impossible? A person whose happiness requires a royal kitchen has placed happiness in an extraordinarily fragile place.",
        "Epicurus treats pleasure as the good. The claim has teeth precisely because pleasure usually suggests excitement, novelty or indulgence to a modern reader. His advice about simple food, friendship and the treatment of fear comes from asking what gives someone a secure, pleasant life taken as a whole. Imagine two futures after a meal. In one, a guest has learned that ordinary food can meet their needs. In the other, the same pleasure is followed by anxiety about how to secure a rarer dish tomorrow. The immediate experience does not settle which choice was wiser."
      ],
      [
        "What we know about the Garden",
        "Epicurus was born in 341 BCE to Athenian parents, Neocles and Chaerestrata, and grew up on Samos. He came to Athens at eighteen, then joined his family at Colophon, where he studied with Nausiphanes, a follower of Democritus, a debt Epicurus later denied. After teaching and gathering followers at Mytilene and Lampsacus, he returned to Athens in 307/306 and bought a property with a garden, which gave his school its name. He died in 270 at about seventy. His will, preserved by Diogenes Laertius, provides for the children of his friends and names a successor. His followers lived as a community of friends, met each month to honor his memory and wore rings bearing his image.",
        "Most of his writing is lost. Book 10 of Diogenes Laertius's Lives preserves three letters, To Herodotus on physics, To Pythocles on celestial phenomena and To Menoeceus on ethics, together with the Principal Doctrines, a set of maxims; another collection, the Vatican Sayings, survives in a manuscript in the Vatican. His thirty-seven-book On Nature exists only in charred papyri from a villa at Herculaneum, whose library seems to have belonged to the Epicurean Philodemus. Lucretius's poem, Cicero's hostile dialogues and a huge inscription set up at Oenoanda by another Diogenes add much.",
        "Knowledge rests on criteria: sensations, preconceptions (general concepts formed from repeated perception) and feelings of pleasure and pain. Every sensation is true; error comes from the opinions we add. Claims about what cannot be seen are accepted when nothing observed counts against them. Nothing comes from nothing, and the universe is infinite: bodies made of indivisible atoms moving through void, in infinitely many worlds. Atoms have minimal parts though they cannot be split, and at times they swerve by a minimal amount without cause, which explains how collisions begin and, in Lucretius, makes free action possible. We perceive things through thin films that stream off their surfaces. The gods exist, blessed and immortal, and take no part in running the world.",
        "The soul is a body of fine atoms spread through the body, and it disperses at death. So death is nothing to us: while we exist death is absent, and when death comes we no longer exist. The goal of life is pleasure, understood as freedom from bodily pain and from mental disturbance (ataraxia). Epicurus distinguishes the pleasure of a settled state of well-being from the pleasure of a process such as eating when hungry, and he sorts desires into the natural and necessary, the natural but unnecessary, and the empty, which aim at wealth, fame or immortality and can never be satisfied. Prudence weighs pleasures against pains, and a simple life supplies what nature needs.",
        "Justice is a compact neither to harm nor to be harmed, and it is nothing in itself apart from such agreements; the wise act justly because injustice brings fear of discovery and they want nothing that would tempt them. Friendship ranks among the greatest goods: it may begin in usefulness, but it comes to be valued for itself, and the wise person will die for a friend if need be. Epicurus advised staying out of politics where possible, a stance Plutarch later attacked in an essay about the Epicurean counsel to live unobtrusively. Opponents slandered him as a sensualist; Diogenes Laertius, and even hostile witnesses, describe a man of great kindness.",
        "The Garden in Athens provided a community for Epicurus’ teaching. Lucretius presents Epicurean arguments to readers in a later Latin poem."
      ],
      [
        "Which desires admit a limit?",
        "A natural and necessary desire, such as the desire to remove the pain of thirst, has a recognizable point of satisfaction. A taste for a particular flavour can be natural while its satisfaction is unnecessary. The desire to outrank everyone around you is different again. Someone else can always rise higher. The classification concerns what each desire requires for satisfaction and how its pursuit changes a person’s exposure to fear. Labelling every wish either good or bad would miss the practical importance of that distinction.",
        "Imagine you decline a pleasurable invitation so you can help a friend through an operation. The refusal might make sense within an Epicurean account. A painful or tiring action can be chosen for the security and friendship it sustains. Likewise someone may decline a pleasant action whose consequences will bring greater distress. Before accusing Epicurus of asking people to seize every immediate pleasure, say which period of a life your objection evaluates.",
        "A critic could grant that security matters and still object that pleasure is the wrong measure. Someone might choose a just act while expecting it to bring them enduring distress. The challenge is to determine whether the Epicurean can account for this choice through the relation between justice, friendship and freedom from fear. It would be too quick to say either that the person secretly enjoys pain or that a single uncomfortable decision disproves a theory of the good life.",
        "Food sufficient to relieve hunger meets a bodily need with a natural limit. A craving for limitless prestige has no stable point of satisfaction.",
        "A pleasant experience has an attraction in the moment. Epicurean deliberation weighs the pains or anxieties that may follow a choice."
      ],
      [
        "A Roman poet poses the fear of death",
        "Titus Lucretius Carus lived from the mid-90s to the mid-50s BCE; Jerome dates his birth to 94. Almost nothing is known of his life. The only contemporary mention comes in a letter of February 54 BCE from Cicero to his brother Quintus, which praises the poem's brilliance and its craft. Jerome's story that a love potion drove Lucretius mad, that he wrote in intervals of sanity and that he killed himself is generally treated as unreliable, perhaps a product of Christian hostility to a poet who denied providence. The poem's addressee, Memmius, was most likely Gaius Memmius, praetor in 58 BCE.",
        "De rerum natura (On the Nature of Things) sets out Epicurean physics in six books of Latin hexameters, arranged in pairs. Books 1 and 2 establish that nothing comes from nothing, that the universe is infinite and made of atoms and void, and refute Heraclitus, Empedocles and Anaxagoras; they describe atomic motion, the swerve and the image of dust dancing in a sunbeam. Books 3 and 4 offer some thirty proofs that the soul is mortal, argue that death is nothing to us, and explain perception through films (simulacra) shed by objects, along with thought, dreams and a harsh treatment of erotic love. Books 5 and 6 cover the mortality of our world, the origins of life and of human society and religion, then weather, earthquakes, magnets and disease, ending with the plague of Athens adapted from Thucydides.",
        "A person can suffer now from the anticipation of dying. On the Epicurean account death ends the sensation required to experience pain."
      ],
      [
        "Who would experience the harm?",
        "The argument about death connects ethics to the Epicurean account of nature. If consciousness depends on the organization of a material body, the dissolution of that organization ends a subject’s sensations. A person can experience fear now. They may also experience pain while dying. The argument concerns what could happen to them in the condition of being dead. To turn the absence of sensation into a conclusion about harm, one needs a premise connecting harm to possible experience.",
        "A familiar objection grants the absence of sensation and challenges that connection. Death might deprive a person of years of rewarding activity. An event could be bad for them by comparison with the life otherwise available, even if they never feel the deprivation. This reply identifies the disputed premise. Telling the critic once again that a corpse feels nothing would repeat common ground. The question has shifted from what the dead can experience to what it means for something to be bad for a person.",
        "The Epicurean argument links harm of the relevant kind to experience. A critic may argue that losing a valuable future can harm someone without a painful experience.",
        "The issue carries a practical stake. An argument that removes one ground of fear may leave grief, care for dependents and the pain of dying entirely intelligible. A philosophical treatment succeeds to the extent that it identifies which fear its reasons address. The Stoics make another proposal about what can truly harm a person, and that proposal puts the person’s own judgments at the centre."
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Epicurus",
          "https://plato.stanford.edu/entries/epicurus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Lucretius",
          "https://plato.stanford.edu/entries/lucretius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy",
          "https://plato.stanford.edu/entries/epicurus/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Epicurus",
          "https://plato.stanford.edu/entries/epicurus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Lucretius",
          "https://plato.stanford.edu/entries/lucretius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy",
          "https://plato.stanford.edu/entries/lucretius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Epicurus",
          "https://plato.stanford.edu/entries/epicurus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Lucretius",
          "https://plato.stanford.edu/entries/lucretius/"
        ]
      ]
    ]
  },
  {
    "id": "stoics",
    "title": "The Stoics: an insult and a judgment",
    "tags": [
      "Greek",
      "Roman",
      "Hellenistic",
      "Ethics",
      "Logic"
    ],
    "period": "Ancient",
    "book": "classic-aurelius-meditations",
    "sec": 2,
    "anchor": "Begin the morning by saying",
    "citation": "Marcus Aurelius · Meditations II.1",
    "read": "Read Marcus’s rehearsal of a difficult encounter. Look for the reason he gives for continuing to cooperate.",
    "terms": [
      "deduction",
      "virtue-ethics"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Stoicism",
        "https://plato.stanford.edu/entries/stoicism/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Epictetus",
        "https://plato.stanford.edu/entries/epictetus/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Marcus Aurelius",
        "https://plato.stanford.edu/entries/marcus-aurelius/"
      ]
    ],
    "sections": [
      [
        "Before the day’s first encounter",
        "Marcus Aurelius begins Book II of his private reflections by anticipating difficult people. The speaker holds imperial power, yet he is trying to govern something as immediate as his own reaction to an irritating encounter. Imagine receiving a contemptuous remark at a public hearing. You hear the words, feel your face grow warm, and judge that you have suffered a serious injury. The Stoics distinguish several events that happen so quickly they can feel like one.",
        "An impression is how something presents itself to the mind. Assent means accepting the impression’s claim. The words can reach your ears without your permission. The further judgment that your ability to live well has been damaged calls for scrutiny. Imagine another person hearing the same insult and taking it as evidence about the speaker’s poor judgment. That difference helps explain why the practice of examining impressions could change a life even when the speaker remains hostile.",
        "This module pairs two witnesses from Roman imperial life. Epictetus taught students; his teaching survives through Arrian’s reports. Marcus left personal exercises. Neither text is a transcript from the school founded by Zeno centuries earlier in Athens. Their differences in setting help explain why one speaker addresses an interlocutor and the other repeatedly addresses himself."
      ],
      [
        "A teacher, a student and the record they left",
        "Epictetus was born in the 50s CE at Hierapolis, a Greek city in Asia Minor, and was a slave of Epaphroditus, an administrator at Nero's court. While enslaved he studied with the Stoic Musonius Rufus. Once freed, he taught philosophy in Rome until Domitian's edict of 89 banished philosophers from Italy, and he then founded a school at Nicopolis in Epirus, in northwestern Greece, where he taught until his death around 135. He walked with a limp, which ancient writers put down to arthritis or to abuse in slavery. He never married, but late in life he adopted a child whose parents could not support it.",
        "He wrote nothing for publication. His student Arrian of Nicomedia recorded his teaching in the Discourses, of which four of eight or more books survive, and abridged it in the Handbook (Encheiridion); a few further fragments are quoted by other authors. The Discourses keep the voice of a teacher talking to students and visitors, by turns persuading, refuting and instructing.",
        "Everything turns on the line between what is up to us and what is not. Up to us is our volition (prohairesis): our judgments, choices, desires and aversions. Our bodies, property, reputation, offices and other people's actions are externals. Volition is “by nature unimpeded”, so no one can take our freedom, and volition is what each of us really is. Only a good state of volition, virtue, is good; externals are indifferent, though they are to be handled with care and skill, as ballplayers care about the ball while knowing it does not matter in itself. Human beings, unlike animals, can examine an impression (phantasia) before assenting to it, and the right use of impressions is the whole task. Medea killed her children because she judged it to her advantage; show her the error, and she would stop.",
        "Students work through three fields of study: desire and aversion, so that they want only what is up to them; impulse and appropriate action, which concerns duties belonging to one's relationships as child, parent, sibling or citizen; and assent, the training of judgment, with logic serving to secure the other two. Passions such as grief, fear and envy come from the false judgment that happiness lies in externals. Epictetus rejects being unfeeling “like a statue”, and teaches loving others as one loves a fragile cup, knowing it may break. Zeus is rational, benevolent and present in the order of nature, and human minds are fragments of his. Socrates and Diogenes the Cynic are his models, and he recommends reviewing one's day each night.",
        "Marcus Aurelius never heard him but counted himself a follower, and in the third century Origen remarked that Epictetus had more readers among ordinary people than Plato. Simplicius wrote a long commentary on the Handbook in the sixth century; Poliziano translated it into Latin in 1497, and Christianized versions circulated in monasteries. Justus Lipsius and Guillaume du Vair found his Stoicism compatible with Christianity, Pascal judged its confidence in self-improvement arrogant, and Descartes's personal ethics follows Epictetus's division between what depends on us and what does not.",
        "Marcus addresses himself in the Meditations to rehearse a response. Arrian records teaching associated with Epictetus in the Discourses."
      ],
      [
        "What lies within our agency?",
        "An archer chooses equipment, trains, takes careful aim and releases the arrow. A gust of wind can still carry it aside. The point of the example is that the quality of the archer’s exercise of judgment and the outcome of the shot can diverge. A Stoic can take careful aim and sincerely prefer to hit the target. Making the outcome the ultimate measure of whether the person acted well would put that measure partly in the wind.",
        "Stoics call health and other things of ordinary value preferred indifferents. The technical word indifferent concerns their relation to virtue, the good condition of character that Stoics take to be sufficient for happiness. A physician has ample reason to select treatment and strive for a patient’s recovery. If illness worsens despite an excellent decision, the outcome alone cannot establish vice in the physician. Asking which outcome deserves pursuit and asking whether the agent judged well give us two different tasks.",
        "An objection comes from Aristotle’s allowance for external goods. What about someone whose opportunities for friendship, action and participation have been destroyed? Saying that their judgment remains theirs may seem insufficient to describe the loss. Stoic and Aristotelian positions can agree that the circumstances are terrible while disagreeing about whether a person’s flourishing can survive them intact. A disagreement at that depth cannot be settled by exhorting the person to cheer up.",
        "Something can initially strike a person as insulting. Endorsing the impression as a correct judgment is a further response.",
        "How one judges and chooses belongs to the sphere Epictetus assigns to us. Success in changing another person’s conduct depends on circumstances outside one’s direction."
      ],
      [
        "How the Athenian school places judgment in nature",
        "Zeno of Citium founded the Stoic school around 300 BCE, and Chrysippus became its foremost theorist and systematizer. The Stoics treated logic, physics and ethics as one interconnected system, and their logic is what would now be called a propositional logic. Their end was living in agreement with nature; virtue, they held, is necessary and sufficient for happiness; and assent to an impression is up to us, while receiving the impression is not. The only complete Stoic works that survive come from writers of the Imperial period: Seneca, whose Moral Letters date from his last years; Epictetus, whose teaching his student Arrian recorded; and the emperor Marcus Aurelius, who wrote his Meditations to and for himself.",
        "The Stoics locate the human good in excellent rational agency. Health can reasonably be selected while its possession alone leaves character unsettled."
      ],
      [
        "Why a Stoic still owes something to others",
        "Return to the hearing. If the insult cannot take away your good judgment, are you entitled to leave the room and ignore the public business? Marcus’s answer turns on our relation to other human beings. The person who behaves badly remains someone with whom we share rational capacities and a life in common. The duty to cooperate changes what a good response looks like. Correcting a harmful decision can be appropriate. Taking revenge in order to repair an injured sense of status needs a different justification.",
        "Compare two people who both sit quietly after an insult. One suppresses anger because their position is precarious. The other examines the claim that their good has been damaged and rejects it. An observer recording only the silence would miss the difference. Stoic practice concerns judgments and reasons as well as behaviour. Judging that an insult leaves your moral agency intact can give you a reason to speak clearly on behalf of someone else.",
        "Shared rational and social life gives reasons to assist difficult people. Treating applause as necessary for a good life makes the agent hostage to others’ judgments.",
        "In the next comparison, we turn to texts from ancient China and reset the historical clock. Arranging a course by period still leaves room to place different teaching traditions side by side within a period. The Analects asks how the conduct of a person in authority shapes people around them. The Daodejing asks what a ruler’s best work might look like from the viewpoint of those being ruled."
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Stoicism",
          "https://plato.stanford.edu/entries/stoicism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Epictetus",
          "https://plato.stanford.edu/entries/epictetus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Marcus Aurelius",
          "https://plato.stanford.edu/entries/marcus-aurelius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy",
          "https://plato.stanford.edu/entries/epictetus/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Stoicism",
          "https://plato.stanford.edu/entries/stoicism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Epictetus",
          "https://plato.stanford.edu/entries/epictetus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Marcus Aurelius",
          "https://plato.stanford.edu/entries/marcus-aurelius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy, “Stoicism” (Baltzly)",
          "https://plato.stanford.edu/entries/stoicism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy, “Seneca” (Vogt)",
          "https://plato.stanford.edu/entries/seneca/"
        ],
        [
          "Stanford Encyclopedia of Philosophy, “Marcus Aurelius” (Kamtekar)",
          "https://plato.stanford.edu/entries/marcus-aurelius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Stoicism",
          "https://plato.stanford.edu/entries/stoicism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Epictetus",
          "https://plato.stanford.edu/entries/epictetus/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Marcus Aurelius",
          "https://plato.stanford.edu/entries/marcus-aurelius/"
        ]
      ]
    ]
  },
  {
    "id": "way",
    "title": "Confucius and Laozi: how should a ruler act?",
    "tags": [
      "Chinese",
      "Ethics",
      "Politics",
      "Language"
    ],
    "period": "Ancient",
    "book": "course-laozi",
    "sec": 1,
    "anchor": "In the highest antiquity",
    "citation": "Daodejing XVII · James Legge’s translation",
    "read": "Read both paragraphs. Notice who receives credit for the outcome in the final sentence.",
    "terms": [
      "ren",
      "dao"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Confucius",
        "https://plato.stanford.edu/entries/confucius/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Laozi",
        "https://plato.stanford.edu/entries/laozi/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Ethics Chinese",
        "https://plato.stanford.edu/entries/ethics-chinese/"
      ]
    ],
    "sections": [
      [
        "A ruler asks how to govern",
        "In the Analects a ruler asks Confucius about government. Such a request puts a teacher in a difficult position. A ruler can issue a command before breakfast and punish disobedience by evening. Yet the question concerns the kind of people who will inhabit the community after years of this arrangement. Can a ruler order them to become considerate? Fear may make an order effective while its author watches. What people do when the magistrate leaves is another matter.",
        "These conversations come to us in a collection transmitted and shaped across generations. Read the scene as the Analects presents a teaching. An exact transcript from the historical teacher would require evidence the collection cannot supply. The same caution matters even more for the Daodejing, whose title means something like the Classic of the Way and Its Power. Later tradition names Laozi as its author. Scholars disagree about how its layers arose. Comparing two texts gives us firmer ground than inventing a meeting at which two named founders settled their differences.",
        "Two texts can both ask how rulers shape the conduct of others. Showing that two authors give the same answer requires comparing their reasons and aims."
      ],
      [
        "Learning to inhabit a role",
        "The Analects (Lunyu), twenty chapters of short sayings and conversations, is the traditional record of his teaching, said by the historian Ban Gu to have been compiled by his first- and second-generation disciples. Some scholars doubt its authority, since it is rarely cited before the second century BCE. Manuscripts excavated in recent decades, from Guodian (1993) to a tomb of 59 BCE at Haihun that may preserve two lost chapters of another version, suggest that many more sayings of Confucius circulated, and that the Analects is one selection among them.",
        "At the center of the Analects is ren, humaneness, explained as caring for others (12.22) and as overcoming oneself and returning to ritual (12.1). Li, ritual propriety, shapes desire and character, and ritual without reverence is worthless (3.26). With yi, rightness, which refuses wealth gained wrongly (7.16), zhi, wisdom, and xin, trustworthiness, these make up the character of the junzi, the exemplary person. Filial piety is the root of humaneness (1.2), and when a man testifies that his father stole a sheep, Confucius answers that in his community fathers and sons cover for each other, and uprightness lies in that (13.18). One maxim, do not impose on others what you would not want for yourself (15.24, also 12.2), is often compared to the Golden Rule, though some scholars consider such passages later additions.",
        "Government works through example. A ruler's virtue (de) moves the people as the wind bends the grass (12.19), and leading them by virtue and ritual instills a sense of shame that laws and punishments cannot (2.3). Confucius looked to the culture of the early Zhou dynasty (3.14) and described himself as a transmitter of the ancients (7.1). Heaven (tian), he said, had given him his virtue (7.23), and he cried that Heaven had forsaken him when his best disciple, Yan Hui, died (11.9).",
        "Mencius and Xunzi developed opposed versions of his teaching. Under the Han, scholars of the Five Classics held office and Confucius received sacrifices in temples; in the Song, Zhu Xi (1130–1200) made the Analects one of the Four Books, which from the fourteenth century formed the basis of the civil service examinations and shaped education in China, Korea and Japan. Jesuit missionaries and Leibniz presented him to Europe as a rational moralist, while reformers of the May Fourth era attacked his hierarchies. Today philosophers compare his ethics with Aristotle's virtue ethics, or read it, with Henry Rosemont and Roger Ames, as an ethics of social roles.",
        "Ren names humaneness in how one treats others. Li includes the forms of ritual conduct through which regard can be expressed and learned."
      ],
      [
        "A family meal as a test case",
        "Imagine someone bringing food to an older relative. The tray arrives on time and contains everything requested. One visitor waits long enough to hear a story. Another checks the tray off a list and walks out while the relative is still speaking. Both have complied with an instruction to deliver a meal. Their difference lies in how each understood the occasion. Ritual, or li, includes patterned conduct through which attention, respect and relationships can be cultivated. Ren is often translated as humaneness. An accomplished performance of a gesture can still raise a question about whether the performer cares.",
        "This gives a reply to the charge that observing forms necessarily means empty conformity. The point of a practice may be to teach participants to perceive features of a situation they once overlooked. A beginner learns to pause; eventually the pause allows a question or a need to become audible. A critic can still ask whose roles the ritual preserves and whether a deference learned at home travels well into politics. Identifying a purpose for a practice has not yet justified every occasion when someone invokes it.",
        "A person can carry out the prescribed gestures during a shared meal. The manner of attending to another person reveals whether concern informs the gesture."
      ],
      [
        "The composite text and the art of restraint",
        "The traditional account of Laozi comes from the Han historian Sima Qian, writing around 100 BCE. It makes him Lao Dan, a keeper of archives at the Zhou court and an older contemporary of Confucius, who once sought his advice on ritual. Seeing the Zhou in decline, he left for the west; at the border pass the keeper asked him to record his teaching, and he wrote a book of some five thousand characters and was never seen again. Many scholars doubt that Laozi was a historical person, and even the name, “Old Master,” may be an honorific.",
        "The text named after him, the Laozi or Daodejing, the classic of the way and its virtue, is now generally thought to have grown from collections of sayings circulating in the fourth century BCE and to have reached a fairly stable form by the mid-third century. Bamboo slips found at Guodian, in a tomb from around 300 BCE, contain the oldest known passages, and the silk manuscripts from Mawangdui, sealed in 168 BCE, place the part on virtue (de) before the part on the way (dao). The received text, in eighty-one short chapters, descends mainly from the editions of the commentators Wang Bi and Heshang Gong.",
        "The Daodejing opens by declaring that the dao that can be spoken of is not the constant dao. Dao is the nameless source of all things, which gives birth to them and nourishes them without claiming them. It is associated with nonbeing (wu), emptiness and the feminine, and beings receive their de, their virtue or potency, from it. The text values ziran, naturalness or being so of oneself, and wuwei, nonaction, which means acting without forcing, self-seeking or contrived effort.",
        "Its images praise the soft and yielding over the hard: water, which overcomes the strongest things by giving way; the infant; the valley; the uncarved block. Reversal is the movement of the dao, so that what is pushed to an extreme turns into its opposite. The text criticizes the Confucian promotion of benevolence, righteousness and learning as signs that the way has been lost, and describes a sage ruler who governs by nonaction, keeping the people's desires few and letting them flourish without interference.",
        "The Daodejing has been read as cosmology, as metaphysics, as mysticism, as a guide to life and as political advice, and has inspired thousands of commentaries, the xuanxue commentarial tradition of the third and fourth centuries, and religious Daoism, which worships Laozi as a deity.",
        "Wuwei names a way of acting that avoids forcing affairs through intrusive effort. Abandoning a duty solely because it requires action treats all intervention as a failure."
      ],
      [
        "Two ways a good ruler might disappear",
        "The Daodejing’s chapter 17 imagines a successful undertaking whose participants attribute the achievement to themselves. Wuwei, often rendered nonaction, names an approach to action that raises a difficulty for translators. A ruler might intervene constantly and damage the very cooperation the interventions aim to secure. Giving space for others to act requires discernment; one cannot tell from the bare fact that a ruler stayed seated whether this was wise restraint or simple neglect.",
        "Try the difference on a village irrigation channel. A coordinator can make an indispensable contribution by ensuring everyone knows when the gates open. A coordinator who gives orders at every gate may displace the knowledge of the people who maintain them. A third might leave a broken gate unrepaired out of indifference. The contrast between the last two cases matters. Reducing interference is defensible when it supports the conditions in which people can act. Avoiding responsibility has a different structure even if it looks similarly quiet from a distance.",
        "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work. Chapter seventeen pictures people attributing the accomplished work to themselves.",
        "The two texts place different pressures on the reader. A Confucian response can ask how people acquired the habits that make self-direction possible. A Daoist response can ask whether conspicuous efforts to instil virtue themselves provoke competition over appearances. Each question tests a real premise of the other outlook. Neither requires pretending that all later Confucians or Daoists speak with one voice. Next we move to an early Buddhist discourse in which the demand for command is directed inward: if the body were my self, how much authority should I have over it?"
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Confucius",
          "https://plato.stanford.edu/entries/confucius/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Laozi",
          "https://plato.stanford.edu/entries/laozi/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Chinese",
          "https://plato.stanford.edu/entries/ethics-chinese/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy",
          "https://plato.stanford.edu/entries/confucius/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Confucius",
          "https://plato.stanford.edu/entries/confucius/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Laozi",
          "https://plato.stanford.edu/entries/laozi/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Chinese",
          "https://plato.stanford.edu/entries/ethics-chinese/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy",
          "https://plato.stanford.edu/entries/laozi/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Confucius",
          "https://plato.stanford.edu/entries/confucius/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Laozi",
          "https://plato.stanford.edu/entries/laozi/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Chinese",
          "https://plato.stanford.edu/entries/ethics-chinese/"
        ]
      ]
    ]
  },
  {
    "id": "buddhism",
    "title": "Early Buddhism: what can I call my self?",
    "tags": [
      "Indian",
      "Buddhist",
      "Mind",
      "Ethics",
      "Metaphysics"
    ],
    "period": "Ancient",
    "book": "course-notself",
    "sec": 1,
    "anchor": "form is not-self",
    "citation": "Linked Discourses 22.59 · Bhikkhu Sujato’s translation",
    "read": "Read the exchange about control before the exchange about impermanence. Notice the different reason given in each.",
    "terms": [
      "anatman",
      "substance"
    ],
    "sources": [
      [
        "Stanford Encyclopedia of Philosophy · Buddha",
        "https://plato.stanford.edu/entries/buddha/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
        "https://plato.stanford.edu/entries/mind-indian-buddhism/"
      ],
      [
        "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
        "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
      ]
    ],
    "sections": [
      [
        "The teacher in the deer park",
        "A discourse preserved in the Pāli collection places the Buddha near Varanasi, addressing five mendicants in a deer park. A mendicant is someone who has left ordinary household life and depends on support from others. In this setting the question of selfhood concerns a practical predicament. A body that someone regards as theirs can grow ill against their wishes. What exactly do they mean when they call it their self? The discourse invites its listeners to attend to an ordinary failure of command and to draw a consequence for how they live.",
        "The place and audience belong to the transmitted narrative. Early Buddhist discourses were preserved through oral transmission and later written collections. Reading one as evidence for an early teaching is different from treating each line as a verified transcript. This lesson follows the reasoning of SN 22.59, a standard identifier for a discourse in the Connected or Linked Discourses. Other Buddhist schools and later interpreters give elaborate accounts of personhood. Start with the relatively precise question that this text asks about the things a person might identify as self."
      ],
      [
        "The diagnosis and the point of a diagnosis",
        "Early Buddhist teaching connects the investigation of experience with dukkha. This term is translated as suffering, stress or unsatisfactoriness in different contexts. An injury can hurt in an obvious way. A pleasant afternoon raises a less obvious problem. If keeping it exactly as it is becomes a condition of contentment, the fact that it changes will matter even while the afternoon remains pleasant. Calling attention to that vulnerability does not require claiming that every instant feels painful.",
        "The four noble truths link a difficulty, its arising, its cessation and a way of practice. Consider an analogy with treating a recurring fever. Naming the fever matters because something can be done about its conditions. A diagnosis that merely renames the discomfort would contribute little. A proposed treatment needs a reason to think the identified condition actually helps sustain the difficulty. The analogy clarifies the structure of the teaching without reducing Buddhist philosophy to a set of medical propositions.",
        "In this setting craving is an especially important condition. It is possible to want to understand a lesson or to assist another person without that wish having all the features of the grasping under investigation. A theory that made every intention to reduce suffering equivalent to the craving that perpetuates it would have difficulty explaining its own practices. The distinction between intention and attachment becomes clearer once we see what the discourse asks people to examine.",
        "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation. Craving figures in the explanation of how suffering arises."
      ],
      [
        "What a person is made up of",
        "The discourse examines five aggregates, groupings of the processes through which experience and a human life are described. Translations differ. Sujato gives form, feeling, perception, choices and consciousness. Form includes the body. Feeling here concerns the pleasant, unpleasant or neutral tone of experience. Perception marks and recognizes features. The fourth category includes activities that shape action, often translated as formations. Consciousness concerns the occurrence of awareness in relation to an object. Each category offers a possible candidate when someone asks what they truly are.",
        "Think of hearing your name from across a station. Sound reaches your ears; the call feels welcome or unwelcome; you recognize the name; an inclination to turn arises; the sound is consciously heard. The example is a way of distinguishing aspects of one encounter. It need not be read as a timetable of five neatly separated events. Ask what someone who claimed to be one of these aspects would mean. Would they identify with a single tone that disappears, with the capacity for feeling, or with a continuing owner of all such feelings?",
        "Naming these alternatives is already progress. An argument showing that a particular feeling changes does not by itself settle whether an owner distinct from every feeling exists. Nor does failing to find an owner inside one category immediately tell us how conventional talk about persons works. Those are distinct demands on the reasoning, even though everyday grammar often folds them together.",
        "Feeling concerns the pleasant, painful or neutral tone of an experience. Perception involves recognizing or marking features of what is encountered."
      ],
      [
        "The argument about control",
        "SN 22.59 first invites a thought about command. If form were self in the sense being tested, the discourse reasons, it would be possible to direct it as one wishes and it would not lead to affliction. Yet the body is vulnerable and resists command. The same line of inquiry extends to other aggregates. A listener who accepts the conditional claim and its failed consequence has a reason to reject the identification. Unit 0 gave us the logical question to ask: which premise supports the move from failed command to the conclusion?",
        "A critic has an immediate reply. Someone owns a house even though they cannot prevent its roof from leaking. Might a person be their body while lacking perfect control over it? This is an objection to the proposed criterion, the standard by which a candidate is tested. It calls for an account of why the relevant sense of self would require the authority the discourse describes. Repeating that illness is involuntary simply restates the uncontested observation.",
        "The house comparison also has a limit. Owning an object and being that object express different relations. A proponent can therefore ask what the critic means by ownership, identity or mastery here. The disagreement becomes fruitful when each side identifies the relation at issue. It becomes circular when a reader defines self as whatever has perfect control and then treats that definition as the only possible conception someone could be defending.",
        "Practice can influence bodily and mental processes under favourable conditions. The control argument asks whether an aggregate can be commanded to be exactly as one wishes."
      ],
      [
        "The second line of inquiry",
        "The discourse then asks the listeners whether form is permanent, and whether something impermanent, unsatisfactory and subject to change is suitable to regard as mine or as my self. Its practical conclusion concerns the fitness of identification. Imagine saying that your standing as a person depends entirely on never feeling fear. The first unexpected fright would seem to threaten the whole basis of your self-understanding. There is a reason to loosen that identification even before attempting to give a complete inventory of everything that exists.",
        "The two arguments do different work. The first proceeds through what could be commanded. The second turns on transience and the instability of taking changing things as a secure basis for identification. Evidence that one can sometimes calm a feeling would not make it permanent. Evidence that a feeling is temporary would not by itself establish that a person lacks all influence over it. Keeping the steps separate makes it possible to say which inference you find persuasive.",
        "A further objection asks who can undertake practice if every process examined changes. One line of reply appeals to causal continuity. The person who practises today can affect what happens tomorrow even when no permanently unchanging owner of both experiences has been identified. A less angry response can be learned and repeated. The reply must still explain how responsibility and memory work; calling a succession a stream leaves those details to be supplied.",
        "What changes and is liable to distress offers an unstable basis for identification. An aggregate can afflict a person despite the person’s desire to direct it."
      ],
      [
        "Return to the ancient questions",
        "Think back to Heraclitus’ river. The idea that continuity might depend on change can help you formulate a question about a person. It cannot establish by analogy that the river fragments and the Buddhist discourse share a doctrine. The discourse directs its analysis toward ending grasping. Your comparison should name that purpose and ask whether the Greek passage sets itself a comparable task.",
        "An earlier practice can shape a later response through causal connections. A permanent subject would retain its identity independently of changes in the aggregates.",
        "The Ancient assignment asks you to choose one argument you can reconstruct closely enough for another reader to challenge. If you choose this discourse, identify the aggregate, the premise about control or change, and the conclusion about identification. Then give the best reply you can on behalf of someone who accepts the observation and rejects the inference. That is a concrete measure of what this period of study has taught you to do."
      ]
    ],
    "refs": [
      [
        [
          "Stanford Encyclopedia of Philosophy · Buddha",
          "https://plato.stanford.edu/entries/buddha/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
          "https://plato.stanford.edu/entries/mind-indian-buddhism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
          "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Buddha",
          "https://plato.stanford.edu/entries/buddha/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
          "https://plato.stanford.edu/entries/mind-indian-buddhism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
          "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Buddha",
          "https://plato.stanford.edu/entries/buddha/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
          "https://plato.stanford.edu/entries/mind-indian-buddhism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
          "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Buddha",
          "https://plato.stanford.edu/entries/buddha/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
          "https://plato.stanford.edu/entries/mind-indian-buddhism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
          "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Buddha",
          "https://plato.stanford.edu/entries/buddha/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
          "https://plato.stanford.edu/entries/mind-indian-buddhism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
          "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
        ]
      ],
      [
        [
          "Stanford Encyclopedia of Philosophy · Buddha",
          "https://plato.stanford.edu/entries/buddha/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Mind Indian Buddhism",
          "https://plato.stanford.edu/entries/mind-indian-buddhism/"
        ],
        [
          "Stanford Encyclopedia of Philosophy · Ethics Indian Buddhism",
          "https://plato.stanford.edu/entries/ethics-indian-buddhism/"
        ]
      ]
    ]
  }
];
const COURSE_BANK = {
  "foundations": [
    {
      "s": 0,
      "q": "Two groups agree about who booked first. What question still needs a philosophical reason?",
      "options": [
        "Why should arriving first give priority?",
        "What time did the applications arrive?",
        "Which group appears first in the register?"
      ],
      "e": "A booking record supplies a fact. Turning that fact into a fair decision requires a principle.",
      "target": "Their disagreement concerns the principle by which a fact about arrival becomes a reason for awarding a room."
    },
    {
      "s": 1,
      "q": "The violin now has none of its original wood. Which question concerns metaphysics?",
      "options": [
        "What makes it the same instrument through these repairs?",
        "How trustworthy is the restorer’s inventory?",
        "Would selling it to the highest bidder be fair?"
      ],
      "e": "The inventory can record every material change while leaving the identity of the violin open.",
      "target": "That question about identity belongs to metaphysics."
    },
    {
      "s": 7,
      "q": "What question does the vibrating violin raise about mind?",
      "options": [
        "What is hearing the note like for its listener?",
        "Who has permission to rehearse?",
        "Is this the original violin?"
      ],
      "e": "Philosophy of mind asks what it is to experience, perceive or think.",
      "target": "Philosophy of mind asks what it is to experience, perceive or think."
    },
    {
      "s": 1,
      "q": "Two witnesses learned the story from the same forged inscription. What changes?",
      "options": [
        "Their agreement offers less independent support.",
        "The violin has ceased to be the same object.",
        "Their agreement establishes who owned the violin."
      ],
      "e": "Both reports inherit a weakness from one source. This concerns the justification of belief.",
      "target": "An inscription might be forged, a witness might be mistaken, and two witnesses might both have copied one unreliable source."
    },
    {
      "s": 7,
      "q": "The librarian says the room is yours. Which question concerns language?",
      "options": [
        "Did the utterance grant permission or predict a meeting?",
        "Is booking by seniority fair?",
        "Is the register reliable?"
      ],
      "e": "Philosophy of language asks how words acquire meaning and how speakers use them to do things.",
      "target": "Philosophy of language asks how words acquire meaning and how speakers use them to do things."
    },
    {
      "s": 2,
      "q": "Someone promised to attend rehearsal but stops to help a stranger. Which question is ethical?",
      "options": [
        "What obligation has the stronger claim?",
        "Can a witness identify the stranger?",
        "How many seats were vacant?"
      ],
      "e": "Ethics asks what the agent ought to do and which reasons bear on that decision.",
      "target": "An ethical question concerns what you should do and why: the force of a promise, the urgency of the need, or what a dependable friend owes another person."
    },
    {
      "s": 2,
      "q": "A majority always excludes the same small group. Which question is political?",
      "options": [
        "When does a majority have legitimate authority?",
        "What percentage voted last week?",
        "Do any two voters remember the same speech?"
      ],
      "e": "Legitimacy concerns the justification of public power.",
      "target": "Political philosophy examines public power, justice, and the terms on which people live together."
    },
    {
      "s": 2,
      "q": "Why can one library dispute involve ethics and political philosophy?",
      "options": [
        "A reason about fair treatment can bear on an institutional rule.",
        "Whenever a person votes, all branches ask the same question.",
        "Political philosophy only counts the votes."
      ],
      "e": "A single reason can support claims about what an individual owes and how an institution should act.",
      "target": "The branches overlap wherever the reasons for an individual decision bear on the rules everyone must follow."
    },
    {
      "s": 3,
      "q": "Which observation most directly supports an aesthetic interpretation?",
      "options": [
        "The delayed note creates tension resolved by the next phrase.",
        "The venue has a public licence.",
        "More people attended than last year."
      ],
      "e": "It identifies a feature of the performance that listeners can examine when judging its expression.",
      "target": "Each might point to the timing of the following note and invite the other to listen again."
    },
    {
      "s": 3,
      "q": "Everyone applauded, so the performance was excellent. What needs defending?",
      "options": [
        "The link between applause and artistic merit.",
        "Whether excellence is spelled correctly.",
        "That audiences sometimes make sounds."
      ],
      "e": "Popularity alone leaves the aesthetic judgment open.",
      "target": "It would take another premise to make popularity evidence of the performance’s artistic merit."
    },
    {
      "s": 3,
      "q": "All moving performances get applause. This performance got applause. Which case tests the inference?",
      "options": [
        "A dull performance applauded out of courtesy.",
        "A moving performance that got applause.",
        "A silent audience that disliked a performance."
      ],
      "e": "Courtesy applause can make both premises true while the conclusion is false.",
      "target": "The audience might have applauded out of courtesy."
    },
    {
      "s": 4,
      "q": "The orchestra lacks another room, so give it priority. Which claim is the conclusion?",
      "options": [
        "Give the orchestra priority.",
        "The orchestra lacks another room.",
        "The group submitted a booking."
      ],
      "e": "The conclusion is the decision the argument asks us to accept.",
      "target": "The booking decision is the conclusion."
    },
    {
      "s": 4,
      "q": "Which premise connects lacking another rehearsal room to deserving priority?",
      "options": [
        "Other things equal, a group without an alternative deserves priority.",
        "The orchestra rehearses every week.",
        "Some rooms have good acoustics."
      ],
      "e": "The added principle explains why the circumstance counts in favour of the decision.",
      "target": "One further idea connects them: when other relevant claims are equal, the group without an alternative deserves priority."
    },
    {
      "s": 4,
      "q": "You supplied a premise the author never stated. What belongs in your reconstruction?",
      "options": [
        "A label identifying the premise as your addition.",
        "Quotation marks attributing it to the author.",
        "An assertion that it is beyond dispute."
      ],
      "e": "Marking a supplied premise separates interpretation from what the passage explicitly says.",
      "target": "Mark any reason you supplied yourself."
    },
    {
      "s": 5,
      "q": "Every object in the room is wooden. The steel lamp is in the room. What fails in the argument that the lamp is wooden?",
      "options": [
        "The premise about every object being wooden.",
        "The inference from the two original premises.",
        "The meaning of a conclusion."
      ],
      "e": "A steel lamp falsifies the universal premise. The original inference still has a valid form.",
      "target": "You have discovered a false premise in a valid deduction."
    },
    {
      "s": 5,
      "q": "Which situation establishes that a deduction is invalid?",
      "options": [
        "All premises true and conclusion false in one possible case.",
        "One premise false in the actual world.",
        "The conclusion unfamiliar to the reader."
      ],
      "e": "Validity rules out exactly the first combination.",
      "target": "To show invalidity, give a counterexample to the inference: a possible situation with true premises and a false conclusion."
    },
    {
      "s": 5,
      "q": "What must you add to a demonstration of validity to establish soundness?",
      "options": [
        "Evidence that every premise is true.",
        "Agreement from the majority.",
        "A second phrasing of the conclusion."
      ],
      "e": "Soundness requires both validity and true premises.",
      "target": "A sound deduction is valid and has true premises."
    },
    {
      "s": 5,
      "q": "A weather forecast promises only a probable outcome. How should you first assess it?",
      "options": [
        "Ask how strongly the evidence supports the forecast.",
        "Reject it because the weather could turn out differently.",
        "Treat probability as a guarantee."
      ],
      "e": "The standard of assessment should fit the strength the forecast claims.",
      "target": "First establish the strength the author claims, then ask whether the evidence supplies it."
    },
    {
      "s": 6,
      "q": "Which is a report of appearance from a particular position?",
      "options": [
        "From this seat a bright patch covers the left edge.",
        "The surface has one true colour under every light.",
        "The table exists independently of every observer."
      ],
      "e": "The first sentence ties the observation to a position; the others make claims beyond that report.",
      "target": "One should report something a person can see from a particular place."
    },
    {
      "s": 6,
      "q": "Two observers see different bright patches. What conclusion does that difference alone support?",
      "options": [
        "How the table looks varies with the viewing position in this case.",
        "There must be two tables.",
        "Physical objects cannot exist."
      ],
      "e": "The reports support a limited claim about appearances. The stronger conclusions need additional reasons.",
      "target": "A bright patch travels across your view; your companion sees a different pattern."
    }
  ],
  "milesians": [
    {
      "s": 1,
      "q": "Which explanation would identify the parentage of Night?",
      "options": [
        "Genealogy",
        "Material principle"
      ],
      "e": "Hesiod traces the ordering of the world through descent and divine succession.",
      "target": "Hesiod traces the ordering of the world through descent and divine succession."
    },
    {
      "s": 1,
      "q": "Why does a family tree count as an explanation for Hesiod?",
      "options": [
        "Hesiod traces the ordering of the world through descent and divine succession.",
        "A Milesian asks what underlies the different things that arise.",
        "Both accounts rely on the same principle whenever they describe the sea."
      ],
      "e": "Hesiod traces the ordering of the world through descent and divine succession.",
      "target": "Hesiod traces the ordering of the world through descent and divine succession."
    },
    {
      "s": 1,
      "q": "Which explanation would trace ice and mist to one underlying stuff?",
      "options": [
        "Material principle",
        "Genealogy"
      ],
      "e": "A Milesian asks what underlies the different things that arise.",
      "target": "A Milesian asks what underlies the different things that arise."
    },
    {
      "s": 1,
      "q": "What would make water an explanatory beginning for Thales?",
      "options": [
        "A Milesian asks what underlies the different things that arise.",
        "Hesiod traces the ordering of the world through descent and divine succession.",
        "Both accounts rely on the same principle whenever they describe the sea."
      ],
      "e": "A Milesian asks what underlies the different things that arise.",
      "target": "A Milesian asks what underlies the different things that arise."
    },
    {
      "s": 2,
      "q": "How should an editor classify the report that Thales chose water?",
      "options": [
        "Testimony",
        "Historical conjecture"
      ],
      "e": "Aristotle attributes the water principle to Thales.",
      "target": "Aristotle attributes the water principle to Thales."
    },
    {
      "s": 2,
      "q": "What can a historian safely attribute on Aristotle’s authority?",
      "options": [
        "Aristotle attributes the water principle to Thales.",
        "Aristotle suggests that moisture in nourishment may have prompted Thales’ choice.",
        "Aristotle quotes Thales’ own surviving explanation for selecting water."
      ],
      "e": "Aristotle attributes the water principle to Thales.",
      "target": "Aristotle attributes the water principle to Thales."
    },
    {
      "s": 2,
      "q": "How should an editor classify the proposed motive involving wet seeds?",
      "options": [
        "Historical conjecture",
        "Testimony"
      ],
      "e": "Aristotle suggests that moisture in nourishment may have prompted Thales’ choice.",
      "target": "Aristotle suggests that moisture in nourishment may have prompted Thales’ choice."
    },
    {
      "s": 2,
      "q": "Why should an editor qualify the story about wet seeds?",
      "options": [
        "Aristotle suggests that moisture in nourishment may have prompted Thales’ choice.",
        "Aristotle attributes the water principle to Thales.",
        "Aristotle quotes Thales’ own surviving explanation for selecting water."
      ],
      "e": "Aristotle suggests that moisture in nourishment may have prompted Thales’ choice.",
      "target": "Aristotle suggests that moisture in nourishment may have prompted Thales’ choice."
    },
    {
      "s": 3,
      "q": "Which candidate immediately raises the problem of privileging the wet over the dry?",
      "options": [
        "A determinate element",
        "The boundless"
      ],
      "e": "Water already has qualities that distinguish it from fire.",
      "target": "Water already has qualities that distinguish it from fire."
    },
    {
      "s": 3,
      "q": "Why might a critic question whether water alone can explain fire?",
      "options": [
        "Water already has qualities that distinguish it from fire.",
        "Anaximander’s apeiron supplies a source from which opposed qualities can emerge.",
        "Choosing a familiar element guarantees equal treatment of every opposite."
      ],
      "e": "Water already has qualities that distinguish it from fire.",
      "target": "Water already has qualities that distinguish it from fire."
    },
    {
      "s": 3,
      "q": "Which candidate leaves open how specific opposites first separate?",
      "options": [
        "The boundless",
        "A determinate element"
      ],
      "e": "Anaximander’s apeiron supplies a source from which opposed qualities can emerge.",
      "target": "Anaximander’s apeiron supplies a source from which opposed qualities can emerge."
    },
    {
      "s": 3,
      "q": "Why introduce an indefinite source in an account of opposites?",
      "options": [
        "Anaximander’s apeiron supplies a source from which opposed qualities can emerge.",
        "Water already has qualities that distinguish it from fire.",
        "Choosing a familiar element guarantees equal treatment of every opposite."
      ],
      "e": "Anaximander’s apeiron supplies a source from which opposed qualities can emerge.",
      "target": "Anaximander’s apeiron supplies a source from which opposed qualities can emerge."
    },
    {
      "s": 4,
      "q": "Which process would account for the change toward fire?",
      "options": [
        "Rarefaction",
        "Condensation"
      ],
      "e": "In Anaximenes’ account air becomes fire as it grows thinner.",
      "target": "In Anaximenes’ account air becomes fire as it grows thinner."
    },
    {
      "s": 4,
      "q": "What claim would explain why a change toward fire accompanies thinning?",
      "options": [
        "In Anaximenes’ account air becomes fire as it grows thinner.",
        "Air growing denser accounts for wind, cloud and ultimately stone.",
        "The density of the underlying air stays constant as it takes different forms."
      ],
      "e": "In Anaximenes’ account air becomes fire as it grows thinner.",
      "target": "In Anaximenes’ account air becomes fire as it grows thinner."
    },
    {
      "s": 4,
      "q": "Which process would continue the sequence from cloud toward water?",
      "options": [
        "Condensation",
        "Rarefaction"
      ],
      "e": "Air growing denser accounts for wind, cloud and ultimately stone.",
      "target": "Air growing denser accounts for wind, cloud and ultimately stone."
    },
    {
      "s": 4,
      "q": "What claim connects a change in density with the formation of stone?",
      "options": [
        "Air growing denser accounts for wind, cloud and ultimately stone.",
        "In Anaximenes’ account air becomes fire as it grows thinner.",
        "The density of the underlying air stays constant as it takes different forms."
      ],
      "e": "Air growing denser accounts for wind, cloud and ultimately stone.",
      "target": "Air growing denser accounts for wind, cloud and ultimately stone."
    },
    {
      "s": 5,
      "q": "What has a theorist accomplished by saying all things come from air?",
      "options": [
        "Identifying a source",
        "Explaining a transition"
      ],
      "e": "Naming the principle identifies what diverse things come from.",
      "target": "Naming the principle identifies what diverse things come from."
    },
    {
      "s": 5,
      "q": "What does the water hypothesis tell someone who asks about origins?",
      "options": [
        "Naming the principle identifies what diverse things come from.",
        "Describing successive changes in density gives a proposed mechanism.",
        "Identifying the initial material suffices to predict each intermediate stage."
      ],
      "e": "Naming the principle identifies what diverse things come from.",
      "target": "Naming the principle identifies what diverse things come from."
    },
    {
      "s": 5,
      "q": "What extra work does the account of thickening perform?",
      "options": [
        "Explaining a transition",
        "Identifying a source"
      ],
      "e": "Describing successive changes in density gives a proposed mechanism.",
      "target": "Describing successive changes in density gives a proposed mechanism."
    },
    {
      "s": 5,
      "q": "Why does Anaximenes’ density account answer an additional question?",
      "options": [
        "Describing successive changes in density gives a proposed mechanism.",
        "Naming the principle identifies what diverse things come from.",
        "Identifying the initial material suffices to predict each intermediate stage."
      ],
      "e": "Describing successive changes in density gives a proposed mechanism.",
      "target": "Describing successive changes in density gives a proposed mechanism."
    }
  ],
  "change": [
    {
      "s": 1,
      "q": "What does a dye released upstream make visible as it passes you?",
      "options": [
        "Material turnover",
        "Continuity of pattern"
      ],
      "e": "The waters entering a river differ from those flowing out.",
      "target": "The waters entering a river differ from those flowing out."
    },
    {
      "s": 1,
      "q": "What observation supports the claim that a river’s contents change?",
      "options": [
        "The waters entering a river differ from those flowing out.",
        "The ordered passage of waters helps constitute one continuing river.",
        "Numerical identity requires that each drop remain in the river."
      ],
      "e": "The waters entering a river differ from those flowing out.",
      "target": "The waters entering a river differ from those flowing out."
    },
    {
      "s": 1,
      "q": "What explains why two bridges can span the same river decades apart?",
      "options": [
        "Continuity of pattern",
        "Material turnover"
      ],
      "e": "The ordered passage of waters helps constitute one continuing river.",
      "target": "The ordered passage of waters helps constitute one continuing river."
    },
    {
      "s": 1,
      "q": "Why might stopping all flow undermine a river’s identity?",
      "options": [
        "The ordered passage of waters helps constitute one continuing river.",
        "The waters entering a river differ from those flowing out.",
        "Numerical identity requires that each drop remain in the river."
      ],
      "e": "The ordered passage of waters helps constitute one continuing river.",
      "target": "The ordered passage of waters helps constitute one continuing river."
    },
    {
      "s": 1,
      "q": "What evidence is a quotation preserved in someone else’s argument?",
      "options": [
        "A fragment",
        "A paraphrase"
      ],
      "e": "Words attributed to Heraclitus survive embedded in later works.",
      "target": "Words attributed to Heraclitus survive embedded in later works."
    },
    {
      "s": 1,
      "q": "Why do historians look inside later authors’ books for Heraclitus’ words?",
      "options": [
        "Words attributed to Heraclitus survive embedded in later works.",
        "A later author can summarize a view in the author’s own vocabulary.",
        "Agreement with the philosopher’s doctrine makes a later sentence a quotation."
      ],
      "e": "Words attributed to Heraclitus survive embedded in later works.",
      "target": "Words attributed to Heraclitus survive embedded in later works."
    },
    {
      "s": 1,
      "q": "What evidence is a historian’s restatement of the river argument?",
      "options": [
        "A paraphrase",
        "A fragment"
      ],
      "e": "A later author can summarize a view in the author’s own vocabulary.",
      "target": "A later author can summarize a view in the author’s own vocabulary."
    },
    {
      "s": 1,
      "q": "What should readers expect when a historian summarizes a fragment?",
      "options": [
        "A later author can summarize a view in the author’s own vocabulary.",
        "Words attributed to Heraclitus survive embedded in later works.",
        "Agreement with the philosopher’s doctrine makes a later sentence a quotation."
      ],
      "e": "A later author can summarize a view in the author’s own vocabulary.",
      "target": "A later author can summarize a view in the author’s own vocabulary."
    },
    {
      "s": 2,
      "q": "Which route can supply a subject for thought on the goddess’s terms?",
      "options": [
        "The way of what is",
        "The way of what is not"
      ],
      "e": "The goddess invites inquiry along the route of what is.",
      "target": "The goddess invites inquiry along the route of what is."
    },
    {
      "s": 2,
      "q": "Which claim makes inquiry possible on the goddess’s first route?",
      "options": [
        "The goddess invites inquiry along the route of what is.",
        "Parmenides presents sheer nonbeing as an unavailable object of inquiry.",
        "Both routes succeed if the thinker can imagine a sufficiently empty space."
      ],
      "e": "The goddess invites inquiry along the route of what is.",
      "target": "The goddess invites inquiry along the route of what is."
    },
    {
      "s": 2,
      "q": "Which route would a search for sheer nothing attempt?",
      "options": [
        "The way of what is not",
        "The way of what is"
      ],
      "e": "Parmenides presents sheer nonbeing as an unavailable object of inquiry.",
      "target": "Parmenides presents sheer nonbeing as an unavailable object of inquiry."
    },
    {
      "s": 2,
      "q": "Why does the goddess reject starting with sheer nonbeing?",
      "options": [
        "Parmenides presents sheer nonbeing as an unavailable object of inquiry.",
        "The goddess invites inquiry along the route of what is.",
        "Both routes succeed if the thinker can imagine a sufficiently empty space."
      ],
      "e": "Parmenides presents sheer nonbeing as an unavailable object of inquiry.",
      "target": "Parmenides presents sheer nonbeing as an unavailable object of inquiry."
    },
    {
      "s": 3,
      "q": "Which part of the reasoning challenges an absolute beginning?",
      "options": [
        "A constraint on generation",
        "A report of appearance"
      ],
      "e": "Coming into being from sheer nonbeing would require treating nonbeing as a source.",
      "target": "Coming into being from sheer nonbeing would require treating nonbeing as a source."
    },
    {
      "s": 3,
      "q": "Why would Parmenides object to generation from absolute nothing?",
      "options": [
        "Coming into being from sheer nonbeing would require treating nonbeing as a source.",
        "The poem also presents an ordered account of the world as mortals understand it.",
        "A description of the heavens proves generation from sheer nothing."
      ],
      "e": "Coming into being from sheer nonbeing would require treating nonbeing as a source.",
      "target": "Coming into being from sheer nonbeing would require treating nonbeing as a source."
    },
    {
      "s": 3,
      "q": "Where does an account of the experienced heavens belong?",
      "options": [
        "A report of appearance",
        "A constraint on generation"
      ],
      "e": "The poem also presents an ordered account of the world as mortals understand it.",
      "target": "The poem also presents an ordered account of the world as mortals understand it."
    },
    {
      "s": 3,
      "q": "How can accounts of the heavens figure in a poem that challenges becoming?",
      "options": [
        "The poem also presents an ordered account of the world as mortals understand it.",
        "Coming into being from sheer nonbeing would require treating nonbeing as a source.",
        "A description of the heavens proves generation from sheer nothing."
      ],
      "e": "The poem also presents an ordered account of the world as mortals understand it.",
      "target": "The poem also presents an ordered account of the world as mortals understand it."
    },
    {
      "s": 4,
      "q": "Which approach asks how the river would survive if its water stopped flowing?",
      "options": [
        "Heraclitean reconstruction",
        "Parmenidean challenge"
      ],
      "e": "A continuing pattern may require changes in its constituents.",
      "target": "A continuing pattern may require changes in its constituents."
    },
    {
      "s": 4,
      "q": "How can fresh waters support the continued identity of a river?",
      "options": [
        "A continuing pattern may require changes in its constituents.",
        "An explanation of becoming must say what it means for something to come to be.",
        "A description of successive appearances settles what it is for something to begin."
      ],
      "e": "A continuing pattern may require changes in its constituents.",
      "target": "A continuing pattern may require changes in its constituents."
    },
    {
      "s": 4,
      "q": "Which approach asks what the alleged new thing was supposed to arise from?",
      "options": [
        "Parmenidean challenge",
        "Heraclitean reconstruction"
      ],
      "e": "An explanation of becoming must say what it means for something to come to be.",
      "target": "An explanation of becoming must say what it means for something to come to be."
    },
    {
      "s": 4,
      "q": "Why might a critic press an account of change for its starting point?",
      "options": [
        "An explanation of becoming must say what it means for something to come to be.",
        "A continuing pattern may require changes in its constituents.",
        "A description of successive appearances settles what it is for something to begin."
      ],
      "e": "An explanation of becoming must say what it means for something to come to be.",
      "target": "An explanation of becoming must say what it means for something to come to be."
    }
  ],
  "socrates": [
    {
      "s": 0,
      "q": "What does pointing to a second pious prosecution supply?",
      "options": [
        "A case",
        "A definition"
      ],
      "e": "Euthyphro offers his own prosecution as an instance of piety.",
      "target": "Euthyphro offers his own prosecution as an instance of piety."
    },
    {
      "s": 0,
      "q": "Why can Euthyphro’s first reply illustrate his belief?",
      "options": [
        "Euthyphro offers his own prosecution as an instance of piety.",
        "Socrates asks what makes every pious act pious.",
        "The fairness of a prosecution can be decided by counting similar prosecutions."
      ],
      "e": "Euthyphro offers his own prosecution as an instance of piety.",
      "target": "Euthyphro offers his own prosecution as an instance of piety."
    },
    {
      "s": 0,
      "q": "What would a criterion applicable even outside court supply?",
      "options": [
        "A definition",
        "A case"
      ],
      "e": "Socrates asks what makes every pious act pious.",
      "target": "Socrates asks what makes every pious act pious."
    },
    {
      "s": 0,
      "q": "Why does Socrates keep asking what all the acts share?",
      "options": [
        "Socrates asks what makes every pious act pious.",
        "Euthyphro offers his own prosecution as an instance of piety.",
        "The fairness of a prosecution can be decided by counting similar prosecutions."
      ],
      "e": "Socrates asks what makes every pious act pious.",
      "target": "Socrates asks what makes every pious act pious."
    },
    {
      "s": 1,
      "q": "What kind of source supplies the courthouse conversation as we read it?",
      "options": [
        "A dramatic portrayal",
        "An independent historical witness"
      ],
      "e": "Plato assigns words to a character in a composed dialogue.",
      "target": "Plato assigns words to a character in a composed dialogue."
    },
    {
      "s": 1,
      "q": "What warrants saying that Plato presents Socrates asking a particular question?",
      "options": [
        "Plato assigns words to a character in a composed dialogue.",
        "A separate witness can support a historical inference when its evidence is independent.",
        "Several copies of the same dialogue count as separate eyewitnesses."
      ],
      "e": "Plato assigns words to a character in a composed dialogue.",
      "target": "Plato assigns words to a character in a composed dialogue."
    },
    {
      "s": 1,
      "q": "What would a separately attested contemporary account add?",
      "options": [
        "An independent historical witness",
        "A dramatic portrayal"
      ],
      "e": "A separate witness can support a historical inference when its evidence is independent.",
      "target": "A separate witness can support a historical inference when its evidence is independent."
    },
    {
      "s": 1,
      "q": "How could a historian strengthen a claim about the historical Socrates?",
      "options": [
        "A separate witness can support a historical inference when its evidence is independent.",
        "Plato assigns words to a character in a composed dialogue.",
        "Several copies of the same dialogue count as separate eyewitnesses."
      ],
      "e": "A separate witness can support a historical inference when its evidence is independent.",
      "target": "A separate witness can support a historical inference when its evidence is independent."
    },
    {
      "s": 2,
      "q": "What follows immediately when the examiner derives incompatible answers?",
      "options": [
        "A contradiction",
        "A refutation of one particular premise"
      ],
      "e": "Incompatible commitments show that the whole set cannot stand.",
      "target": "Incompatible commitments show that the whole set cannot stand."
    },
    {
      "s": 2,
      "q": "What does examination establish if two concessions conflict?",
      "options": [
        "Incompatible commitments show that the whole set cannot stand.",
        "Rejecting a particular commitment requires a reason to retain the others.",
        "Any contradiction proves that the first answer must be false."
      ],
      "e": "Incompatible commitments show that the whole set cannot stand.",
      "target": "Incompatible commitments show that the whole set cannot stand."
    },
    {
      "s": 2,
      "q": "What further result requires defending the remaining answers?",
      "options": [
        "A refutation of one particular premise",
        "A contradiction"
      ],
      "e": "Rejecting a particular commitment requires a reason to retain the others.",
      "target": "Rejecting a particular commitment requires a reason to retain the others."
    },
    {
      "s": 2,
      "q": "Why would a critic hesitate before rejecting one specific concession?",
      "options": [
        "Rejecting a particular commitment requires a reason to retain the others.",
        "Incompatible commitments show that the whole set cannot stand.",
        "Any contradiction proves that the first answer must be false."
      ],
      "e": "Rejecting a particular commitment requires a reason to retain the others.",
      "target": "Rejecting a particular commitment requires a reason to retain the others."
    },
    {
      "s": 3,
      "q": "Which reading says that the gods recognize what is already pious?",
      "options": [
        "Approval as a response",
        "Approval as the standard"
      ],
      "e": "Divine love can be explained by a prior feature of the act.",
      "target": "Divine love can be explained by a prior feature of the act."
    },
    {
      "s": 3,
      "q": "Why might an act’s piety explain the gods’ agreement about it?",
      "options": [
        "Divine love can be explained by a prior feature of the act.",
        "Defining piety by approval makes approval constitutive of piety.",
        "Unanimity settles which direction the explanation runs."
      ],
      "e": "Divine love can be explained by a prior feature of the act.",
      "target": "Divine love can be explained by a prior feature of the act."
    },
    {
      "s": 3,
      "q": "Which reading makes being loved by all the gods sufficient by definition?",
      "options": [
        "Approval as the standard",
        "Approval as a response"
      ],
      "e": "Defining piety by approval makes approval constitutive of piety.",
      "target": "Defining piety by approval makes approval constitutive of piety."
    },
    {
      "s": 3,
      "q": "What would have to hold if divine approval defined piety?",
      "options": [
        "Defining piety by approval makes approval constitutive of piety.",
        "Divine love can be explained by a prior feature of the act.",
        "Unanimity settles which direction the explanation runs."
      ],
      "e": "Defining piety by approval makes approval constitutive of piety.",
      "target": "Defining piety by approval makes approval constitutive of piety."
    },
    {
      "s": 4,
      "q": "What does the failure of the definitions actually tested establish?",
      "options": [
        "An unresolved inquiry",
        "A claim of impossibility"
      ],
      "e": "A dialogue can expose defects in every answer so far offered.",
      "target": "A dialogue can expose defects in every answer so far offered."
    },
    {
      "s": 4,
      "q": "Why might the reader keep looking after Euthyphro leaves?",
      "options": [
        "A dialogue can expose defects in every answer so far offered.",
        "Declaring a satisfactory answer impossible requires excluding further proposals.",
        "An unresolved ending establishes that piety has no content."
      ],
      "e": "A dialogue can expose defects in every answer so far offered.",
      "target": "A dialogue can expose defects in every answer so far offered."
    },
    {
      "s": 4,
      "q": "What would a critic claim by ruling out every future definition?",
      "options": [
        "A claim of impossibility",
        "An unresolved inquiry"
      ],
      "e": "Declaring a satisfactory answer impossible requires excluding further proposals.",
      "target": "Declaring a satisfactory answer impossible requires excluding further proposals."
    },
    {
      "s": 4,
      "q": "What stronger argument would rule out finding any definition?",
      "options": [
        "Declaring a satisfactory answer impossible requires excluding further proposals.",
        "A dialogue can expose defects in every answer so far offered.",
        "An unresolved ending establishes that piety has no content."
      ],
      "e": "Declaring a satisfactory answer impossible requires excluding further proposals.",
      "target": "Declaring a satisfactory answer impossible requires excluding further proposals."
    }
  ],
  "justice": [
    {
      "s": 0,
      "q": "Which value disappears when public honours are withdrawn?",
      "options": [
        "An instrumental good",
        "A good valued in itself"
      ],
      "e": "A reputation for justice can bring rewards from others.",
      "target": "A reputation for justice can bring rewards from others."
    },
    {
      "s": 0,
      "q": "Why does Glaucon strip away reputation in his challenge?",
      "options": [
        "A reputation for justice can bring rewards from others.",
        "Glaucon asks what justice itself contributes to the person who has it.",
        "A reward counts as intrinsic whenever receiving it feels satisfying."
      ],
      "e": "A reputation for justice can bring rewards from others.",
      "target": "A reputation for justice can bring rewards from others."
    },
    {
      "s": 0,
      "q": "Which value must survive the ring’s promise of secrecy?",
      "options": [
        "A good valued in itself",
        "An instrumental good"
      ],
      "e": "Glaucon asks what justice itself contributes to the person who has it.",
      "target": "Glaucon asks what justice itself contributes to the person who has it."
    },
    {
      "s": 0,
      "q": "What benefit would survive even if justice brought public disgrace?",
      "options": [
        "Glaucon asks what justice itself contributes to the person who has it.",
        "A reputation for justice can bring rewards from others.",
        "A reward counts as intrinsic whenever receiving it feels satisfying."
      ],
      "e": "Glaucon asks what justice itself contributes to the person who has it.",
      "target": "Glaucon asks what justice itself contributes to the person who has it."
    },
    {
      "s": 1,
      "q": "Where does Socrates first seek justice in larger letters?",
      "options": [
        "The city",
        "The soul"
      ],
      "e": "In the enlarged model, groups carry out different social functions.",
      "target": "In the enlarged model, groups carry out different social functions."
    },
    {
      "s": 1,
      "q": "Why describe a community before describing a just person?",
      "options": [
        "In the enlarged model, groups carry out different social functions.",
        "In the individual, different sources of motivation can conflict.",
        "A division of labour in society by itself proves a division in each soul."
      ],
      "e": "In the enlarged model, groups carry out different social functions.",
      "target": "In the enlarged model, groups carry out different social functions."
    },
    {
      "s": 1,
      "q": "Where does the thirsty person’s refusal furnish evidence?",
      "options": [
        "The soul",
        "The city"
      ],
      "e": "In the individual, different sources of motivation can conflict.",
      "target": "In the individual, different sources of motivation can conflict."
    },
    {
      "s": 1,
      "q": "What evidence connects the account with an individual’s motives?",
      "options": [
        "In the individual, different sources of motivation can conflict.",
        "In the enlarged model, groups carry out different social functions.",
        "A division of labour in society by itself proves a division in each soul."
      ],
      "e": "In the individual, different sources of motivation can conflict.",
      "target": "In the individual, different sources of motivation can conflict."
    },
    {
      "s": 2,
      "q": "Which motive persists when a patient refuses contaminated water?",
      "options": [
        "Appetite",
        "Reason"
      ],
      "e": "Thirst considered by itself draws the person toward a drink.",
      "target": "Thirst considered by itself draws the person toward a drink."
    },
    {
      "s": 2,
      "q": "What does thirst contribute before the person judges the water dangerous?",
      "options": [
        "Thirst considered by itself draws the person toward a drink.",
        "A judgment about the drink’s danger can oppose thirst.",
        "Refusing a drink establishes that the person never felt thirst."
      ],
      "e": "Thirst considered by itself draws the person toward a drink.",
      "target": "Thirst considered by itself draws the person toward a drink."
    },
    {
      "s": 2,
      "q": "Which capacity weighs the evidence that drinking would harm the patient?",
      "options": [
        "Reason",
        "Appetite"
      ],
      "e": "A judgment about the drink’s danger can oppose thirst.",
      "target": "A judgment about the drink’s danger can oppose thirst."
    },
    {
      "s": 2,
      "q": "What explains withholding the drink on the basis of a warning?",
      "options": [
        "A judgment about the drink’s danger can oppose thirst.",
        "Thirst considered by itself draws the person toward a drink.",
        "Refusing a drink establishes that the person never felt thirst."
      ],
      "e": "A judgment about the drink’s danger can oppose thirst.",
      "target": "A judgment about the drink’s danger can oppose thirst."
    },
    {
      "s": 2,
      "q": "Which condition does wanting and resisting the same drink now illustrate?",
      "options": [
        "Opposition in the same respect",
        "A change of mind over time"
      ],
      "e": "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect.",
      "target": "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect."
    },
    {
      "s": 2,
      "q": "Which conflict gives the partition argument its purchase?",
      "options": [
        "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect.",
        "A sequence of different wishes is compatible with one changing motivation.",
        "Any alteration in preference requires two simultaneously active faculties."
      ],
      "e": "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect.",
      "target": "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect."
    },
    {
      "s": 2,
      "q": "What does wanting water at noon and refusing it after lunch illustrate?",
      "options": [
        "A change of mind over time",
        "Opposition in the same respect"
      ],
      "e": "A sequence of different wishes is compatible with one changing motivation.",
      "target": "A sequence of different wishes is compatible with one changing motivation."
    },
    {
      "s": 2,
      "q": "Why does a succession of different wants fail to establish divided motives?",
      "options": [
        "A sequence of different wishes is compatible with one changing motivation.",
        "The partition argument needs simultaneous opposed tendencies directed at the same object in the relevant respect.",
        "Any alteration in preference requires two simultaneously active faculties."
      ],
      "e": "A sequence of different wishes is compatible with one changing motivation.",
      "target": "A sequence of different wishes is compatible with one changing motivation."
    },
    {
      "s": 4,
      "q": "Which would the defence of justice need to explain in an unseen agent?",
      "options": [
        "Inner order",
        "An outwardly compliant act"
      ],
      "e": "Plato connects justice with a rightly ordered relation among the soul’s parts.",
      "target": "Plato connects justice with a rightly ordered relation among the soul’s parts."
    },
    {
      "s": 4,
      "q": "What state of the person is Plato trying to defend?",
      "options": [
        "Plato connects justice with a rightly ordered relation among the soul’s parts.",
        "A person can obey a rule solely to preserve a good reputation.",
        "The existence of a reward excludes an agent’s acting from justice."
      ],
      "e": "Plato connects justice with a rightly ordered relation among the soul’s parts.",
      "target": "Plato connects justice with a rightly ordered relation among the soul’s parts."
    },
    {
      "s": 4,
      "q": "Which result alone leaves Glaucon’s challenge open?",
      "options": [
        "An outwardly compliant act",
        "Inner order"
      ],
      "e": "A person can obey a rule solely to preserve a good reputation.",
      "target": "A person can obey a rule solely to preserve a good reputation."
    },
    {
      "s": 4,
      "q": "Why can an observer’s report of honest conduct leave the case unresolved?",
      "options": [
        "A person can obey a rule solely to preserve a good reputation.",
        "Plato connects justice with a rightly ordered relation among the soul’s parts.",
        "The existence of a reward excludes an agent’s acting from justice."
      ],
      "e": "A person can obey a rule solely to preserve a good reputation.",
      "target": "A person can obey a rule solely to preserve a good reputation."
    }
  ],
  "cave": [
    {
      "s": 0,
      "q": "What advantage does the skilled predictor of shadows initially possess?",
      "options": [
        "Familiarity",
        "Understanding a cause"
      ],
      "e": "Repeated exposure makes shadows readily recognizable to a prisoner.",
      "target": "Repeated exposure makes shadows readily recognizable to a prisoner."
    },
    {
      "s": 0,
      "q": "Why might a prisoner take the sharpest shadow for the most real thing?",
      "options": [
        "Repeated exposure makes shadows readily recognizable to a prisoner.",
        "Seeing what casts a shadow can explain why it appears as it does.",
        "Accurate predictions alone identify what produces each appearance."
      ],
      "e": "Repeated exposure makes shadows readily recognizable to a prisoner.",
      "target": "Repeated exposure makes shadows readily recognizable to a prisoner."
    },
    {
      "s": 0,
      "q": "What gain comes from connecting a moving figure to the shadow it produces?",
      "options": [
        "Understanding a cause",
        "Familiarity"
      ],
      "e": "Seeing what casts a shadow can explain why it appears as it does.",
      "target": "Seeing what casts a shadow can explain why it appears as it does."
    },
    {
      "s": 0,
      "q": "What explanatory advantage does the freed prisoner gain by turning?",
      "options": [
        "Seeing what casts a shadow can explain why it appears as it does.",
        "Repeated exposure makes shadows readily recognizable to a prisoner.",
        "Accurate predictions alone identify what produces each appearance."
      ],
      "e": "Seeing what casts a shadow can explain why it appears as it does.",
      "target": "Seeing what casts a shadow can explain why it appears as it does."
    },
    {
      "s": 1,
      "q": "Which is a vase whose appearance changes under a different light?",
      "options": [
        "A particular instance",
        "A Form"
      ],
      "e": "A particular beautiful thing can appear beautiful in one setting and ugly in another.",
      "target": "A particular beautiful thing can appear beautiful in one setting and ugly in another."
    },
    {
      "s": 1,
      "q": "Why is a particular beautiful object an unstable standard?",
      "options": [
        "A particular beautiful thing can appear beautiful in one setting and ugly in another.",
        "A Form supplies a stable object of inquiry into what makes such judgments possible.",
        "Agreement among spectators ensures their example remains beautiful in every respect."
      ],
      "e": "A particular beautiful thing can appear beautiful in one setting and ugly in another.",
      "target": "A particular beautiful thing can appear beautiful in one setting and ugly in another."
    },
    {
      "s": 1,
      "q": "Which is beauty itself in the argument under discussion?",
      "options": [
        "A Form",
        "A particular instance"
      ],
      "e": "A Form supplies a stable object of inquiry into what makes such judgments possible.",
      "target": "A Form supplies a stable object of inquiry into what makes such judgments possible."
    },
    {
      "s": 1,
      "q": "What role does beauty itself play in Plato’s proposal?",
      "options": [
        "A Form supplies a stable object of inquiry into what makes such judgments possible.",
        "A particular beautiful thing can appear beautiful in one setting and ugly in another.",
        "Agreement among spectators ensures their example remains beautiful in every respect."
      ],
      "e": "A Form supplies a stable object of inquiry into what makes such judgments possible.",
      "target": "A Form supplies a stable object of inquiry into what makes such judgments possible."
    },
    {
      "s": 2,
      "q": "What does playing a favourite recording offer the inquirer?",
      "options": [
        "An example",
        "A criterion"
      ],
      "e": "Showing a beautiful performance gives an instance that invites agreement.",
      "target": "Showing a beautiful performance gives an instance that invites agreement."
    },
    {
      "s": 2,
      "q": "Why can critics agree about a recording yet disagree about beauty?",
      "options": [
        "Showing a beautiful performance gives an instance that invites agreement.",
        "Saying what makes performances beautiful proposes a basis for judging further instances.",
        "An additional favourite recording supplies a definition of beauty."
      ],
      "e": "Showing a beautiful performance gives an instance that invites agreement.",
      "target": "Showing a beautiful performance gives an instance that invites agreement."
    },
    {
      "s": 2,
      "q": "What does an account applicable to an unfamiliar melody offer?",
      "options": [
        "A criterion",
        "An example"
      ],
      "e": "Saying what makes performances beautiful proposes a basis for judging further instances.",
      "target": "Saying what makes performances beautiful proposes a basis for judging further instances."
    },
    {
      "s": 2,
      "q": "What would let a listener apply a judgment to a genuinely new case?",
      "options": [
        "Saying what makes performances beautiful proposes a basis for judging further instances.",
        "Showing a beautiful performance gives an instance that invites agreement.",
        "An additional favourite recording supplies a definition of beauty."
      ],
      "e": "Saying what makes performances beautiful proposes a basis for judging further instances.",
      "target": "Saying what makes performances beautiful proposes a basis for judging further instances."
    },
    {
      "s": 3,
      "q": "Which image asks what makes both visibility and vision possible?",
      "options": [
        "The sun analogy",
        "The divided line"
      ],
      "e": "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight.",
      "target": "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight."
    },
    {
      "s": 3,
      "q": "Why does Plato ask what enables the eye to see?",
      "options": [
        "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight.",
        "The divided line distinguishes modes of cognition and their objects.",
        "The diagrams show that every familiar object is already understood."
      ],
      "e": "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight.",
      "target": "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight."
    },
    {
      "s": 3,
      "q": "Which image orders ways of grasping things by their clarity?",
      "options": [
        "The divided line",
        "The sun analogy"
      ],
      "e": "The divided line distinguishes modes of cognition and their objects.",
      "target": "The divided line distinguishes modes of cognition and their objects."
    },
    {
      "s": 3,
      "q": "Why does the divided line distinguish mathematical thought from other ways of knowing?",
      "options": [
        "The divided line distinguishes modes of cognition and their objects.",
        "The sun helps Plato explain the Good’s relation to knowledge through an analogy with sight.",
        "The diagrams show that every familiar object is already understood."
      ],
      "e": "The divided line distinguishes modes of cognition and their objects.",
      "target": "The divided line distinguishes modes of cognition and their objects."
    },
    {
      "s": 4,
      "q": "What explains the returner’s temporary clumsiness?",
      "options": [
        "Intellectual adjustment",
        "A political obligation"
      ],
      "e": "A returning prisoner needs time to see in the dark again.",
      "target": "A returning prisoner needs time to see in the dark again."
    },
    {
      "s": 4,
      "q": "Why might a well-educated returner perform poorly at first?",
      "options": [
        "A returning prisoner needs time to see in the dark again.",
        "The education of a guardian raises the question of service to fellow citizens.",
        "A person’s early difficulty in darkness removes every civic obligation."
      ],
      "e": "A returning prisoner needs time to see in the dark again.",
      "target": "A returning prisoner needs time to see in the dark again."
    },
    {
      "s": 4,
      "q": "What justifies asking educated guardians to return at all?",
      "options": [
        "A political obligation",
        "Intellectual adjustment"
      ],
      "e": "The education of a guardian raises the question of service to fellow citizens.",
      "target": "The education of a guardian raises the question of service to fellow citizens."
    },
    {
      "s": 4,
      "q": "What does the city’s claim on the educated prisoner require explaining?",
      "options": [
        "The education of a guardian raises the question of service to fellow citizens.",
        "A returning prisoner needs time to see in the dark again.",
        "A person’s early difficulty in darkness removes every civic obligation."
      ],
      "e": "The education of a guardian raises the question of service to fellow citizens.",
      "target": "The education of a guardian raises the question of service to fellow citizens."
    }
  ],
  "causes": [
    {
      "s": 1,
      "q": "What does a metallurgist identify by testing the alloy?",
      "options": [
        "Material cause",
        "Formal cause"
      ],
      "e": "The bronze explains what the statue is made of.",
      "target": "The bronze explains what the statue is made of."
    },
    {
      "s": 1,
      "q": "Why might identical statues receive different answers about their material?",
      "options": [
        "The bronze explains what the statue is made of.",
        "The arrangement giving bronze the shape of this statue supplies a formal explanation.",
        "The artisan’s original intention fixes the identity of the metal."
      ],
      "e": "The bronze explains what the statue is made of.",
      "target": "The bronze explains what the statue is made of."
    },
    {
      "s": 1,
      "q": "What does a model showing the figure’s organization help identify?",
      "options": [
        "Formal cause",
        "Material cause"
      ],
      "e": "The arrangement giving bronze the shape of this statue supplies a formal explanation.",
      "target": "The arrangement giving bronze the shape of this statue supplies a formal explanation."
    },
    {
      "s": 1,
      "q": "What explains how the same bronze can constitute different figures?",
      "options": [
        "The arrangement giving bronze the shape of this statue supplies a formal explanation.",
        "The bronze explains what the statue is made of.",
        "The artisan’s original intention fixes the identity of the metal."
      ],
      "e": "The arrangement giving bronze the shape of this statue supplies a formal explanation.",
      "target": "The arrangement giving bronze the shape of this statue supplies a formal explanation."
    },
    {
      "s": 1,
      "q": "Which cause does the sculptor supply as maker?",
      "options": [
        "Efficient cause",
        "Final cause"
      ],
      "e": "The source of a change explains what brings the work about.",
      "target": "The source of a change explains what brings the work about."
    },
    {
      "s": 1,
      "q": "What does naming the sculptor explain about this statue?",
      "options": [
        "The source of a change explains what brings the work about.",
        "The end of an activity explains what it is undertaken for.",
        "Every cause in this example must be an event earlier than the statue."
      ],
      "e": "The source of a change explains what brings the work about.",
      "target": "The source of a change explains what brings the work about."
    },
    {
      "s": 1,
      "q": "Which cause is commemorating a victory for the commission?",
      "options": [
        "Final cause",
        "Efficient cause"
      ],
      "e": "The end of an activity explains what it is undertaken for.",
      "target": "The end of an activity explains what it is undertaken for."
    },
    {
      "s": 1,
      "q": "What does explaining the commission in terms of a victory add?",
      "options": [
        "The end of an activity explains what it is undertaken for.",
        "The source of a change explains what brings the work about.",
        "Every cause in this example must be an event earlier than the statue."
      ],
      "e": "The end of an activity explains what it is undertaken for.",
      "target": "The end of an activity explains what it is undertaken for."
    },
    {
      "s": 2,
      "q": "Which explains an acorn developing into an oak?",
      "options": [
        "Nature",
        "Craft"
      ],
      "e": "A living thing has an internal principle of its characteristic growth.",
      "target": "A living thing has an internal principle of its characteristic growth."
    },
    {
      "s": 2,
      "q": "Why does Aristotle distinguish a growing oak from an assembled bed?",
      "options": [
        "A living thing has an internal principle of its characteristic growth.",
        "An artifact’s organization as an artifact comes from the maker’s activity.",
        "An artifact loses the natural properties of its material once shaped."
      ],
      "e": "A living thing has an internal principle of its characteristic growth.",
      "target": "A living thing has an internal principle of its characteristic growth."
    },
    {
      "s": 2,
      "q": "Which explains timber acquiring the form of a bed?",
      "options": [
        "Craft",
        "Nature"
      ],
      "e": "An artifact’s organization as an artifact comes from the maker’s activity.",
      "target": "An artifact’s organization as an artifact comes from the maker’s activity."
    },
    {
      "s": 2,
      "q": "What accounts for timber having this particular arrangement as furniture?",
      "options": [
        "An artifact’s organization as an artifact comes from the maker’s activity.",
        "A living thing has an internal principle of its characteristic growth.",
        "An artifact loses the natural properties of its material once shaped."
      ],
      "e": "An artifact’s organization as an artifact comes from the maker’s activity.",
      "target": "An artifact’s organization as an artifact comes from the maker’s activity."
    },
    {
      "s": 3,
      "q": "Which describes a trained musician while asleep in relation to performing?",
      "options": [
        "Potentiality",
        "Actuality"
      ],
      "e": "A capacity is a real ability requiring suitable conditions for its exercise.",
      "target": "A capacity is a real ability requiring suitable conditions for its exercise."
    },
    {
      "s": 3,
      "q": "Why can Aristotle call the sleeping musician able to perform?",
      "options": [
        "A capacity is a real ability requiring suitable conditions for its exercise.",
        "The exercise or realization of a capacity is an actuality.",
        "A capacity exists only during the moments when it is exercised."
      ],
      "e": "A capacity is a real ability requiring suitable conditions for its exercise.",
      "target": "A capacity is a real ability requiring suitable conditions for its exercise."
    },
    {
      "s": 3,
      "q": "Which describes the musician playing a phrase now?",
      "options": [
        "Actuality",
        "Potentiality"
      ],
      "e": "The exercise or realization of a capacity is an actuality.",
      "target": "The exercise or realization of a capacity is an actuality."
    },
    {
      "s": 3,
      "q": "What changes in the explanation once the musician actually plays?",
      "options": [
        "The exercise or realization of a capacity is an actuality.",
        "A capacity is a real ability requiring suitable conditions for its exercise.",
        "A capacity exists only during the moments when it is exercised."
      ],
      "e": "The exercise or realization of a capacity is an actuality.",
      "target": "The exercise or realization of a capacity is an actuality."
    },
    {
      "s": 4,
      "q": "What does an account of teeth in terms of chewing supply?",
      "options": [
        "A functional explanation",
        "A conscious intention"
      ],
      "e": "A part’s contribution to a living whole can explain its characteristic development.",
      "target": "A part’s contribution to a living whole can explain its characteristic development."
    },
    {
      "s": 4,
      "q": "Why would chewing figure in an explanation of a tooth’s shape?",
      "options": [
        "A part’s contribution to a living whole can explain its characteristic development.",
        "A plan formed by a thinking agent explains deliberate production.",
        "Every functional explanation requires evidence of a conscious decision."
      ],
      "e": "A part’s contribution to a living whole can explain its characteristic development.",
      "target": "A part’s contribution to a living whole can explain its characteristic development."
    },
    {
      "s": 4,
      "q": "What does a potter’s decision to design a pouring lip supply?",
      "options": [
        "A conscious intention",
        "A functional explanation"
      ],
      "e": "A plan formed by a thinking agent explains deliberate production.",
      "target": "A plan formed by a thinking agent explains deliberate production."
    },
    {
      "s": 4,
      "q": "Why is a craftsperson’s aim relevant to an artifact?",
      "options": [
        "A plan formed by a thinking agent explains deliberate production.",
        "A part’s contribution to a living whole can explain its characteristic development.",
        "Every functional explanation requires evidence of a conscious decision."
      ],
      "e": "A plan formed by a thinking agent explains deliberate production.",
      "target": "A plan formed by a thinking agent explains deliberate production."
    }
  ],
  "character": [
    {
      "s": 1,
      "q": "Which is at issue in judging how a whole life is lived?",
      "options": [
        "Eudaimonia",
        "A passing feeling of satisfaction"
      ],
      "e": "Aristotle assesses flourishing through activity across a life.",
      "target": "Aristotle assesses flourishing through activity across a life."
    },
    {
      "s": 1,
      "q": "Why would Aristotle hesitate to judge a whole life from one good day?",
      "options": [
        "Aristotle assesses flourishing through activity across a life.",
        "A pleasant mood can vary while the person’s settled conduct stays the same.",
        "The excellence of an entire life can be inferred from a single happy moment."
      ],
      "e": "Aristotle assesses flourishing through activity across a life.",
      "target": "Aristotle assesses flourishing through activity across a life."
    },
    {
      "s": 1,
      "q": "What could a cheerful afternoon establish by itself?",
      "options": [
        "A passing feeling of satisfaction",
        "Eudaimonia"
      ],
      "e": "A pleasant mood can vary while the person’s settled conduct stays the same.",
      "target": "A pleasant mood can vary while the person’s settled conduct stays the same."
    },
    {
      "s": 1,
      "q": "What can a report of feeling satisfied actually tell us?",
      "options": [
        "A pleasant mood can vary while the person’s settled conduct stays the same.",
        "Aristotle assesses flourishing through activity across a life.",
        "The excellence of an entire life can be inferred from a single happy moment."
      ],
      "e": "A pleasant mood can vary while the person’s settled conduct stays the same.",
      "target": "A pleasant mood can vary while the person’s settled conduct stays the same."
    },
    {
      "s": 2,
      "q": "Which explains gradual change through repeated fair dealing?",
      "options": [
        "Habituation",
        "Instruction in a rule"
      ],
      "e": "Repeated action shapes the dispositions from which later choices arise.",
      "target": "Repeated action shapes the dispositions from which later choices arise."
    },
    {
      "s": 2,
      "q": "Why does repeatedly sharing fairly matter to moral development?",
      "options": [
        "Repeated action shapes the dispositions from which later choices arise.",
        "An instructor can state a principle before the learner has acquired the corresponding habit.",
        "Reciting the right rule is sufficient evidence of a stable virtue."
      ],
      "e": "Repeated action shapes the dispositions from which later choices arise.",
      "target": "Repeated action shapes the dispositions from which later choices arise."
    },
    {
      "s": 2,
      "q": "Which occurs when a novice can repeat the advice after a lecture?",
      "options": [
        "Instruction in a rule",
        "Habituation"
      ],
      "e": "An instructor can state a principle before the learner has acquired the corresponding habit.",
      "target": "An instructor can state a principle before the learner has acquired the corresponding habit."
    },
    {
      "s": 2,
      "q": "What has an apprentice gained by learning the statement of a rule?",
      "options": [
        "An instructor can state a principle before the learner has acquired the corresponding habit.",
        "Repeated action shapes the dispositions from which later choices arise.",
        "Reciting the right rule is sufficient evidence of a stable virtue."
      ],
      "e": "An instructor can state a principle before the learner has acquired the corresponding habit.",
      "target": "An instructor can state a principle before the learner has acquired the corresponding habit."
    },
    {
      "s": 2,
      "q": "What does one correctly divided payment establish on its own?",
      "options": [
        "Acting justly in this instance",
        "Having a just disposition"
      ],
      "e": "A person may perform an outwardly fair act under supervision.",
      "target": "A person may perform an outwardly fair act under supervision."
    },
    {
      "s": 2,
      "q": "What can one fair transaction show about an inexperienced agent?",
      "options": [
        "A person may perform an outwardly fair act under supervision.",
        "Virtuous action in the full sense involves knowing choice and a stable disposition.",
        "Doing the right thing once establishes a disposition even under coercion."
      ],
      "e": "A person may perform an outwardly fair act under supervision.",
      "target": "A person may perform an outwardly fair act under supervision."
    },
    {
      "s": 2,
      "q": "What needs evidence about why the agent chooses and how consistently?",
      "options": [
        "Having a just disposition",
        "Acting justly in this instance"
      ],
      "e": "Virtuous action in the full sense involves knowing choice and a stable disposition.",
      "target": "Virtuous action in the full sense involves knowing choice and a stable disposition."
    },
    {
      "s": 2,
      "q": "Why does Aristotle ask whether the agent knowingly chose the act?",
      "options": [
        "Virtuous action in the full sense involves knowing choice and a stable disposition.",
        "A person may perform an outwardly fair act under supervision.",
        "Doing the right thing once establishes a disposition even under coercion."
      ],
      "e": "Virtuous action in the full sense involves knowing choice and a stable disposition.",
      "target": "Virtuous action in the full sense involves knowing choice and a stable disposition."
    },
    {
      "s": 3,
      "q": "Which would explain why a rescuer and a bystander should face different risks?",
      "options": [
        "A mean relative to us",
        "An arithmetic midpoint"
      ],
      "e": "The appropriate response takes account of the danger and the agent’s circumstances.",
      "target": "The appropriate response takes account of the danger and the agent’s circumstances."
    },
    {
      "s": 3,
      "q": "Why might the appropriate response vary with the rescuer’s experience?",
      "options": [
        "The appropriate response takes account of the danger and the agent’s circumstances.",
        "A numerical halfway point can be calculated from two extremes alone.",
        "The same quantity of fear is correct for all agents facing any danger."
      ],
      "e": "The appropriate response takes account of the danger and the agent’s circumstances.",
      "target": "The appropriate response takes account of the danger and the agent’s circumstances."
    },
    {
      "s": 3,
      "q": "Which would choosing precisely half the largest possible risk exemplify?",
      "options": [
        "An arithmetic midpoint",
        "A mean relative to us"
      ],
      "e": "A numerical halfway point can be calculated from two extremes alone.",
      "target": "A numerical halfway point can be calculated from two extremes alone."
    },
    {
      "s": 3,
      "q": "What mistake arises from averaging the two largest available risks?",
      "options": [
        "A numerical halfway point can be calculated from two extremes alone.",
        "The appropriate response takes account of the danger and the agent’s circumstances.",
        "The same quantity of fear is correct for all agents facing any danger."
      ],
      "e": "A numerical halfway point can be calculated from two extremes alone.",
      "target": "A numerical halfway point can be calculated from two extremes alone."
    },
    {
      "s": 4,
      "q": "What does choosing whether a promise should yield to an emergency require?",
      "options": [
        "Practical wisdom",
        "Technical skill"
      ],
      "e": "Practical wisdom judges what is good to do in particular circumstances.",
      "target": "Practical wisdom judges what is good to do in particular circumstances."
    },
    {
      "s": 4,
      "q": "What kind of deliberation is needed when duties pull in different directions?",
      "options": [
        "Practical wisdom judges what is good to do in particular circumstances.",
        "Technical skill enables a person to produce a result proficiently.",
        "Ability to produce a good tool by itself decides whether its use is just."
      ],
      "e": "Practical wisdom judges what is good to do in particular circumstances.",
      "target": "Practical wisdom judges what is good to do in particular circumstances."
    },
    {
      "s": 4,
      "q": "What does making an excellent instrument to a supplied specification display?",
      "options": [
        "Technical skill",
        "Practical wisdom"
      ],
      "e": "Technical skill enables a person to produce a result proficiently.",
      "target": "Technical skill enables a person to produce a result proficiently."
    },
    {
      "s": 4,
      "q": "What does technical proficiency establish about a maker?",
      "options": [
        "Technical skill enables a person to produce a result proficiently.",
        "Practical wisdom judges what is good to do in particular circumstances.",
        "Ability to produce a good tool by itself decides whether its use is just."
      ],
      "e": "Technical skill enables a person to produce a result proficiently.",
      "target": "Technical skill enables a person to produce a result proficiently."
    }
  ],
  "garden": [
    {
      "s": 2,
      "q": "Which kind of desire can a plain meal satisfy?",
      "options": [
        "A natural and necessary desire",
        "An empty desire"
      ],
      "e": "Food sufficient to relieve hunger meets a bodily need with a natural limit.",
      "target": "Food sufficient to relieve hunger meets a bodily need with a natural limit."
    },
    {
      "s": 2,
      "q": "Why can Epicurus specify a limit to the desire for food?",
      "options": [
        "Food sufficient to relieve hunger meets a bodily need with a natural limit.",
        "A craving for limitless prestige has no stable point of satisfaction.",
        "Every desire that gives pleasure has a natural point of completion."
      ],
      "e": "Food sufficient to relieve hunger meets a bodily need with a natural limit.",
      "target": "Food sufficient to relieve hunger meets a bodily need with a natural limit."
    },
    {
      "s": 2,
      "q": "Which kind keeps moving its target as competitors gain honours?",
      "options": [
        "An empty desire",
        "A natural and necessary desire"
      ],
      "e": "A craving for limitless prestige has no stable point of satisfaction.",
      "target": "A craving for limitless prestige has no stable point of satisfaction."
    },
    {
      "s": 2,
      "q": "Why might winning another honour leave the desire for prestige undiminished?",
      "options": [
        "A craving for limitless prestige has no stable point of satisfaction.",
        "Food sufficient to relieve hunger meets a bodily need with a natural limit.",
        "Every desire that gives pleasure has a natural point of completion."
      ],
      "e": "A craving for limitless prestige has no stable point of satisfaction.",
      "target": "A craving for limitless prestige has no stable point of satisfaction."
    },
    {
      "s": 2,
      "q": "Which explains why the first taste appeals?",
      "options": [
        "Immediate pleasure",
        "Considered choice"
      ],
      "e": "A pleasant experience has an attraction in the moment.",
      "target": "A pleasant experience has an attraction in the moment."
    },
    {
      "s": 2,
      "q": "Why might an Epicurean acknowledge the attraction of a choice they decline?",
      "options": [
        "A pleasant experience has an attraction in the moment.",
        "Epicurean deliberation weighs the pains or anxieties that may follow a choice.",
        "A pleasant option must always be chosen whenever it is available."
      ],
      "e": "A pleasant experience has an attraction in the moment.",
      "target": "A pleasant experience has an attraction in the moment."
    },
    {
      "s": 2,
      "q": "Which explains declining a treat that reliably brings prolonged discomfort?",
      "options": [
        "Considered choice",
        "Immediate pleasure"
      ],
      "e": "Epicurean deliberation weighs the pains or anxieties that may follow a choice.",
      "target": "Epicurean deliberation weighs the pains or anxieties that may follow a choice."
    },
    {
      "s": 2,
      "q": "How can declining a pleasant experience accord with the pursuit of pleasure?",
      "options": [
        "Epicurean deliberation weighs the pains or anxieties that may follow a choice.",
        "A pleasant experience has an attraction in the moment.",
        "A pleasant option must always be chosen whenever it is available."
      ],
      "e": "Epicurean deliberation weighs the pains or anxieties that may follow a choice.",
      "target": "Epicurean deliberation weighs the pains or anxieties that may follow a choice."
    },
    {
      "s": 3,
      "q": "Which can philosophical reassurance ease today?",
      "options": [
        "Fear while alive",
        "Being dead"
      ],
      "e": "A person can suffer now from the anticipation of dying.",
      "target": "A person can suffer now from the anticipation of dying."
    },
    {
      "s": 3,
      "q": "What distress can the argument about death address during a person’s life?",
      "options": [
        "A person can suffer now from the anticipation of dying.",
        "On the Epicurean account death ends the sensation required to experience pain.",
        "If being dead is painless, the process of dying must also be painless."
      ],
      "e": "A person can suffer now from the anticipation of dying.",
      "target": "A person can suffer now from the anticipation of dying."
    },
    {
      "s": 3,
      "q": "Which condition excludes a subject currently feeling torment?",
      "options": [
        "Being dead",
        "Fear while alive"
      ],
      "e": "On the Epicurean account death ends the sensation required to experience pain.",
      "target": "On the Epicurean account death ends the sensation required to experience pain."
    },
    {
      "s": 3,
      "q": "Why does Lucretius ask who will feel the injury after death?",
      "options": [
        "On the Epicurean account death ends the sensation required to experience pain.",
        "A person can suffer now from the anticipation of dying.",
        "If being dead is painless, the process of dying must also be painless."
      ],
      "e": "On the Epicurean account death ends the sensation required to experience pain.",
      "target": "On the Epicurean account death ends the sensation required to experience pain."
    },
    {
      "s": 4,
      "q": "What must one accept to infer harmlessness directly from the absence of sensation?",
      "options": [
        "The experiential premise",
        "The deprivation objection"
      ],
      "e": "The Epicurean argument links harm of the relevant kind to experience.",
      "target": "The Epicurean argument links harm of the relevant kind to experience."
    },
    {
      "s": 4,
      "q": "Which premise lets an Epicurean infer that being dead cannot hurt its subject?",
      "options": [
        "The Epicurean argument links harm of the relevant kind to experience.",
        "A critic may argue that losing a valuable future can harm someone without a painful experience.",
        "A loss can matter only when someone later remembers experiencing it."
      ],
      "e": "The Epicurean argument links harm of the relevant kind to experience.",
      "target": "The Epicurean argument links harm of the relevant kind to experience."
    },
    {
      "s": 4,
      "q": "What is a critic invoking by comparing the actual life with a longer one?",
      "options": [
        "The deprivation objection",
        "The experiential premise"
      ],
      "e": "A critic may argue that losing a valuable future can harm someone without a painful experience.",
      "target": "A critic may argue that losing a valuable future can harm someone without a painful experience."
    },
    {
      "s": 4,
      "q": "What would challenge that premise while granting that the dead feel nothing?",
      "options": [
        "A critic may argue that losing a valuable future can harm someone without a painful experience.",
        "The Epicurean argument links harm of the relevant kind to experience.",
        "A loss can matter only when someone later remembers experiencing it."
      ],
      "e": "A critic may argue that losing a valuable future can harm someone without a painful experience.",
      "target": "A critic may argue that losing a valuable future can harm someone without a painful experience."
    },
    {
      "s": 1,
      "q": "Which setting helps explain the role of shared practice and friendship?",
      "options": [
        "Epicurus’ school",
        "Lucretius’ exposition"
      ],
      "e": "The Garden in Athens provided a community for Epicurus’ teaching.",
      "target": "The Garden in Athens provided a community for Epicurus’ teaching."
    },
    {
      "s": 1,
      "q": "Why consider the Garden’s communal arrangements when interpreting Epicurus?",
      "options": [
        "The Garden in Athens provided a community for Epicurus’ teaching.",
        "Lucretius presents Epicurean arguments to readers in a later Latin poem.",
        "The Latin poem is a transcript of Epicurus teaching in Athens."
      ],
      "e": "The Garden in Athens provided a community for Epicurus’ teaching.",
      "target": "The Garden in Athens provided a community for Epicurus’ teaching."
    },
    {
      "s": 1,
      "q": "Which source supplies the shelf passage defending the view about death?",
      "options": [
        "Lucretius’ exposition",
        "Epicurus’ school"
      ],
      "e": "Lucretius presents Epicurean arguments to readers in a later Latin poem.",
      "target": "Lucretius presents Epicurean arguments to readers in a later Latin poem."
    },
    {
      "s": 1,
      "q": "Why distinguish the shelf author from the founder of the school?",
      "options": [
        "Lucretius presents Epicurean arguments to readers in a later Latin poem.",
        "The Garden in Athens provided a community for Epicurus’ teaching.",
        "The Latin poem is a transcript of Epicurus teaching in Athens."
      ],
      "e": "Lucretius presents Epicurean arguments to readers in a later Latin poem.",
      "target": "Lucretius presents Epicurean arguments to readers in a later Latin poem."
    }
  ],
  "stoics": [
    {
      "s": 2,
      "q": "What is present as soon as the remark seems humiliating?",
      "options": [
        "An impression",
        "Assent"
      ],
      "e": "Something can initially strike a person as insulting.",
      "target": "Something can initially strike a person as insulting."
    },
    {
      "s": 2,
      "q": "Why might a Stoic pause after a remark seems offensive?",
      "options": [
        "Something can initially strike a person as insulting.",
        "Endorsing the impression as a correct judgment is a further response.",
        "The arrival of an unpleasant appearance proves a moral injury has occurred."
      ],
      "e": "Something can initially strike a person as insulting.",
      "target": "Something can initially strike a person as insulting."
    },
    {
      "s": 2,
      "q": "What occurs when the hearer accepts that humiliation is a genuine evil?",
      "options": [
        "Assent",
        "An impression"
      ],
      "e": "Endorsing the impression as a correct judgment is a further response.",
      "target": "Endorsing the impression as a correct judgment is a further response."
    },
    {
      "s": 2,
      "q": "What step commits the listener to an evaluation of the insult?",
      "options": [
        "Endorsing the impression as a correct judgment is a further response.",
        "Something can initially strike a person as insulting.",
        "The arrival of an unpleasant appearance proves a moral injury has occurred."
      ],
      "e": "Endorsing the impression as a correct judgment is a further response.",
      "target": "Endorsing the impression as a correct judgment is a further response."
    },
    {
      "s": 2,
      "q": "What can a deliberating agent examine in their own response?",
      "options": [
        "The agent’s judgment",
        "An external outcome"
      ],
      "e": "How one judges and chooses belongs to the sphere Epictetus assigns to us.",
      "target": "How one judges and chooses belongs to the sphere Epictetus assigns to us."
    },
    {
      "s": 2,
      "q": "Why does Epictetus direct attention to the agent’s use of impressions?",
      "options": [
        "How one judges and chooses belongs to the sphere Epictetus assigns to us.",
        "Success in changing another person’s conduct depends on circumstances outside one’s direction.",
        "Good judgment guarantees the desired result when the advice is sound."
      ],
      "e": "How one judges and chooses belongs to the sphere Epictetus assigns to us.",
      "target": "How one judges and chooses belongs to the sphere Epictetus assigns to us."
    },
    {
      "s": 2,
      "q": "What remains uncertain after even a well-judged intervention?",
      "options": [
        "An external outcome",
        "The agent’s judgment"
      ],
      "e": "Success in changing another person’s conduct depends on circumstances outside one’s direction.",
      "target": "Success in changing another person’s conduct depends on circumstances outside one’s direction."
    },
    {
      "s": 2,
      "q": "Why can even excellent advice fail to reform a neighbour?",
      "options": [
        "Success in changing another person’s conduct depends on circumstances outside one’s direction.",
        "How one judges and chooses belongs to the sphere Epictetus assigns to us.",
        "Good judgment guarantees the desired result when the advice is sound."
      ],
      "e": "Success in changing another person’s conduct depends on circumstances outside one’s direction.",
      "target": "Success in changing another person’s conduct depends on circumstances outside one’s direction."
    },
    {
      "s": 3,
      "q": "Which makes a choice good on Stoic terms?",
      "options": [
        "Virtue",
        "A preferred indifferent"
      ],
      "e": "The Stoics locate the human good in excellent rational agency.",
      "target": "The Stoics locate the human good in excellent rational agency."
    },
    {
      "s": 3,
      "q": "What would make an unsuccessful rescue an excellent choice?",
      "options": [
        "The Stoics locate the human good in excellent rational agency.",
        "Health can reasonably be selected while its possession alone leaves character unsettled.",
        "Whatever a rational person selects must itself make a life good."
      ],
      "e": "The Stoics locate the human good in excellent rational agency.",
      "target": "The Stoics locate the human good in excellent rational agency."
    },
    {
      "s": 3,
      "q": "How would a Stoic classify recovery from illness?",
      "options": [
        "A preferred indifferent",
        "Virtue"
      ],
      "e": "Health can reasonably be selected while its possession alone leaves character unsettled.",
      "target": "Health can reasonably be selected while its possession alone leaves character unsettled."
    },
    {
      "s": 3,
      "q": "Why can a Stoic reasonably seek medical care?",
      "options": [
        "Health can reasonably be selected while its possession alone leaves character unsettled.",
        "The Stoics locate the human good in excellent rational agency.",
        "Whatever a rational person selects must itself make a life good."
      ],
      "e": "Health can reasonably be selected while its possession alone leaves character unsettled.",
      "target": "Health can reasonably be selected while its possession alone leaves character unsettled."
    },
    {
      "s": 4,
      "q": "Which attitude explains Marcus’s intention to work with an offensive neighbour?",
      "options": [
        "Cooperation",
        "Dependence on approval"
      ],
      "e": "Shared rational and social life gives reasons to assist difficult people.",
      "target": "Shared rational and social life gives reasons to assist difficult people."
    },
    {
      "s": 4,
      "q": "Why would Marcus continue helping someone who insulted him?",
      "options": [
        "Shared rational and social life gives reasons to assist difficult people.",
        "Treating applause as necessary for a good life makes the agent hostage to others’ judgments.",
        "Caring for another person requires surrendering judgment to that person."
      ],
      "e": "Shared rational and social life gives reasons to assist difficult people.",
      "target": "Shared rational and social life gives reasons to assist difficult people."
    },
    {
      "s": 4,
      "q": "Which attitude would give the neighbour control over the agent’s good?",
      "options": [
        "Dependence on approval",
        "Cooperation"
      ],
      "e": "Treating applause as necessary for a good life makes the agent hostage to others’ judgments.",
      "target": "Treating applause as necessary for a good life makes the agent hostage to others’ judgments."
    },
    {
      "s": 4,
      "q": "Why would needing the insulter’s admiration jeopardize Stoic freedom?",
      "options": [
        "Treating applause as necessary for a good life makes the agent hostage to others’ judgments.",
        "Shared rational and social life gives reasons to assist difficult people.",
        "Caring for another person requires surrendering judgment to that person."
      ],
      "e": "Treating applause as necessary for a good life makes the agent hostage to others’ judgments.",
      "target": "Treating applause as necessary for a good life makes the agent hostage to others’ judgments."
    },
    {
      "s": 1,
      "q": "What kind of evidence is Marcus’s morning rehearsal?",
      "options": [
        "A private reminder",
        "A reported teaching exchange"
      ],
      "e": "Marcus addresses himself in the Meditations to rehearse a response.",
      "target": "Marcus addresses himself in the Meditations to rehearse a response."
    },
    {
      "s": 1,
      "q": "Why attend to the first-person exercises in Marcus’s book?",
      "options": [
        "Marcus addresses himself in the Meditations to rehearse a response.",
        "Arrian records teaching associated with Epictetus in the Discourses.",
        "Every text connected with the school has the same speaker and audience."
      ],
      "e": "Marcus addresses himself in the Meditations to rehearse a response.",
      "target": "Marcus addresses himself in the Meditations to rehearse a response."
    },
    {
      "s": 1,
      "q": "What kind of evidence is a pupil’s record of the teacher’s discussion?",
      "options": [
        "A reported teaching exchange",
        "A private reminder"
      ],
      "e": "Arrian records teaching associated with Epictetus in the Discourses.",
      "target": "Arrian records teaching associated with Epictetus in the Discourses."
    },
    {
      "s": 1,
      "q": "Why does Arrian matter when attributing words to Epictetus?",
      "options": [
        "Arrian records teaching associated with Epictetus in the Discourses.",
        "Marcus addresses himself in the Meditations to rehearse a response.",
        "Every text connected with the school has the same speaker and audience."
      ],
      "e": "Arrian records teaching associated with Epictetus in the Discourses.",
      "target": "Arrian records teaching associated with Epictetus in the Discourses."
    }
  ],
  "way": [
    {
      "s": 1,
      "q": "Which concerns the quality of care in a visit to an elder?",
      "options": [
        "Ren",
        "Li"
      ],
      "e": "Ren names humaneness in how one treats others.",
      "target": "Ren names humaneness in how one treats others."
    },
    {
      "s": 1,
      "q": "Why would a Confucian ask whether an elder was treated humanely?",
      "options": [
        "Ren names humaneness in how one treats others.",
        "Li includes the forms of ritual conduct through which regard can be expressed and learned.",
        "Knowing the formal sequence establishes by itself that the guest was cared for."
      ],
      "e": "Ren names humaneness in how one treats others.",
      "target": "Ren names humaneness in how one treats others."
    },
    {
      "s": 1,
      "q": "Which includes the customary greeting performed during that visit?",
      "options": [
        "Li",
        "Ren"
      ],
      "e": "Li includes the forms of ritual conduct through which regard can be expressed and learned.",
      "target": "Li includes the forms of ritual conduct through which regard can be expressed and learned."
    },
    {
      "s": 1,
      "q": "Why do small conventional gestures figure in moral education?",
      "options": [
        "Li includes the forms of ritual conduct through which regard can be expressed and learned.",
        "Ren names humaneness in how one treats others.",
        "Knowing the formal sequence establishes by itself that the guest was cared for."
      ],
      "e": "Li includes the forms of ritual conduct through which regard can be expressed and learned.",
      "target": "Li includes the forms of ritual conduct through which regard can be expressed and learned."
    },
    {
      "s": 2,
      "q": "What can an observer record by listing the order of bows?",
      "options": [
        "A ritual’s form",
        "The disposition expressed"
      ],
      "e": "A person can carry out the prescribed gestures during a shared meal.",
      "target": "A person can carry out the prescribed gestures during a shared meal."
    },
    {
      "s": 2,
      "q": "What can two observers agree on when they describe a ceremonial meal?",
      "options": [
        "A person can carry out the prescribed gestures during a shared meal.",
        "The manner of attending to another person reveals whether concern informs the gesture.",
        "Any deviation from the usual order demonstrates a lack of regard."
      ],
      "e": "A person can carry out the prescribed gestures during a shared meal.",
      "target": "A person can carry out the prescribed gestures during a shared meal."
    },
    {
      "s": 2,
      "q": "What is tested when a guest needs help outside the usual routine?",
      "options": [
        "The disposition expressed",
        "A ritual’s form"
      ],
      "e": "The manner of attending to another person reveals whether concern informs the gesture.",
      "target": "The manner of attending to another person reveals whether concern informs the gesture."
    },
    {
      "s": 2,
      "q": "What additional question arises when a guest struggles to participate?",
      "options": [
        "The manner of attending to another person reveals whether concern informs the gesture.",
        "A person can carry out the prescribed gestures during a shared meal.",
        "Any deviation from the usual order demonstrates a lack of regard."
      ],
      "e": "The manner of attending to another person reveals whether concern informs the gesture.",
      "target": "The manner of attending to another person reveals whether concern informs the gesture."
    },
    {
      "s": 3,
      "q": "Which describes a ruler creating conditions for people to act for themselves?",
      "options": [
        "Wuwei",
        "Withdrawal from every responsibility"
      ],
      "e": "Wuwei names a way of acting that avoids forcing affairs through intrusive effort.",
      "target": "Wuwei names a way of acting that avoids forcing affairs through intrusive effort."
    },
    {
      "s": 3,
      "q": "How could a ruler practice wuwei while still governing?",
      "options": [
        "Wuwei names a way of acting that avoids forcing affairs through intrusive effort.",
        "Abandoning a duty solely because it requires action treats all intervention as a failure.",
        "The ruler’s actions count as restrained whenever subjects praise them."
      ],
      "e": "Wuwei names a way of acting that avoids forcing affairs through intrusive effort.",
      "target": "Wuwei names a way of acting that avoids forcing affairs through intrusive effort."
    },
    {
      "s": 3,
      "q": "Which interpretation would forbid even a timely unobtrusive intervention?",
      "options": [
        "Withdrawal from every responsibility",
        "Wuwei"
      ],
      "e": "Abandoning a duty solely because it requires action treats all intervention as a failure.",
      "target": "Abandoning a duty solely because it requires action treats all intervention as a failure."
    },
    {
      "s": 3,
      "q": "What mistaken inference treats restraint as permission to abandon a responsibility?",
      "options": [
        "Abandoning a duty solely because it requires action treats all intervention as a failure.",
        "Wuwei names a way of acting that avoids forcing affairs through intrusive effort.",
        "The ruler’s actions count as restrained whenever subjects praise them."
      ],
      "e": "Abandoning a duty solely because it requires action treats all intervention as a failure.",
      "target": "Abandoning a duty solely because it requires action treats all intervention as a failure."
    },
    {
      "s": 4,
      "q": "Which attitude would make the people’s silence count as failure?",
      "options": [
        "Reliance on praise",
        "Unobtrusive government"
      ],
      "e": "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work.",
      "target": "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work."
    },
    {
      "s": 4,
      "q": "Why would a ruler who seeks applause find the final scene disappointing?",
      "options": [
        "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work.",
        "Chapter seventeen pictures people attributing the accomplished work to themselves.",
        "Subjects’ lack of praise proves they opposed the outcome."
      ],
      "e": "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work.",
      "target": "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work."
    },
    {
      "s": 4,
      "q": "Which ideal allows success even when the ruler receives little credit?",
      "options": [
        "Unobtrusive government",
        "Reliance on praise"
      ],
      "e": "Chapter seventeen pictures people attributing the accomplished work to themselves.",
      "target": "Chapter seventeen pictures people attributing the accomplished work to themselves."
    },
    {
      "s": 4,
      "q": "How can the people’s taking credit count as successful government?",
      "options": [
        "Chapter seventeen pictures people attributing the accomplished work to themselves.",
        "A ruler who needs acclaim depends on subjects publicly recognizing the ruler’s work.",
        "Subjects’ lack of praise proves they opposed the outcome."
      ],
      "e": "Chapter seventeen pictures people attributing the accomplished work to themselves.",
      "target": "Chapter seventeen pictures people attributing the accomplished work to themselves."
    },
    {
      "s": 0,
      "q": "What has been identified when both passages address the conduct of rulers?",
      "options": [
        "A shared practical question",
        "A shared doctrine"
      ],
      "e": "Two texts can both ask how rulers shape the conduct of others.",
      "target": "Two texts can both ask how rulers shape the conduct of others."
    },
    {
      "s": 0,
      "q": "What makes a comparison between the two texts possible?",
      "options": [
        "Two texts can both ask how rulers shape the conduct of others.",
        "Showing that two authors give the same answer requires comparing their reasons and aims.",
        "Two passages about governing have identical standards of success."
      ],
      "e": "Two texts can both ask how rulers shape the conduct of others.",
      "target": "Two texts can both ask how rulers shape the conduct of others."
    },
    {
      "s": 0,
      "q": "What further claim would require reconciling their attitudes toward cultivated forms?",
      "options": [
        "A shared doctrine",
        "A shared practical question"
      ],
      "e": "Showing that two authors give the same answer requires comparing their reasons and aims.",
      "target": "Showing that two authors give the same answer requires comparing their reasons and aims."
    },
    {
      "s": 0,
      "q": "What further evidence would justify attributing the same theory to both?",
      "options": [
        "Showing that two authors give the same answer requires comparing their reasons and aims.",
        "Two texts can both ask how rulers shape the conduct of others.",
        "Two passages about governing have identical standards of success."
      ],
      "e": "Showing that two authors give the same answer requires comparing their reasons and aims.",
      "target": "Showing that two authors give the same answer requires comparing their reasons and aims."
    }
  ],
  "buddhism": [
    {
      "s": 1,
      "q": "Which describes the trouble for which a remedy is sought?",
      "options": [
        "Dukkha",
        "Craving"
      ],
      "e": "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation.",
      "target": "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation."
    },
    {
      "s": 1,
      "q": "Why begin the Buddhist account by identifying distress?",
      "options": [
        "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation.",
        "Craving figures in the explanation of how suffering arises.",
        "Identifying a cause of suffering implies that every wish is harmful."
      ],
      "e": "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation.",
      "target": "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation."
    },
    {
      "s": 1,
      "q": "Which is a proposed causal factor that practice can address?",
      "options": [
        "Craving",
        "Dukkha"
      ],
      "e": "Craving figures in the explanation of how suffering arises.",
      "target": "Craving figures in the explanation of how suffering arises."
    },
    {
      "s": 1,
      "q": "What changes when the inquiry turns from a diagnosis to its origin?",
      "options": [
        "Craving figures in the explanation of how suffering arises.",
        "Dukkha identifies suffering or unsatisfactoriness as the condition under investigation.",
        "Identifying a cause of suffering implies that every wish is harmful."
      ],
      "e": "Craving figures in the explanation of how suffering arises.",
      "target": "Craving figures in the explanation of how suffering arises."
    },
    {
      "s": 2,
      "q": "Which is the unpleasantness of a sharp sound?",
      "options": [
        "Feeling",
        "Perception"
      ],
      "e": "Feeling concerns the pleasant, painful or neutral tone of an experience.",
      "target": "Feeling concerns the pleasant, painful or neutral tone of an experience."
    },
    {
      "s": 2,
      "q": "What does calling a sound painful pick out in the analysis of experience?",
      "options": [
        "Feeling concerns the pleasant, painful or neutral tone of an experience.",
        "Perception involves recognizing or marking features of what is encountered.",
        "Recognizing the bell by itself determines whether the sound is pleasant."
      ],
      "e": "Feeling concerns the pleasant, painful or neutral tone of an experience.",
      "target": "Feeling concerns the pleasant, painful or neutral tone of an experience."
    },
    {
      "s": 2,
      "q": "Which is recognizing the sound as a bicycle bell?",
      "options": [
        "Perception",
        "Feeling"
      ],
      "e": "Perception involves recognizing or marking features of what is encountered.",
      "target": "Perception involves recognizing or marking features of what is encountered."
    },
    {
      "s": 2,
      "q": "What does identifying a familiar bell contribute to the same event?",
      "options": [
        "Perception involves recognizing or marking features of what is encountered.",
        "Feeling concerns the pleasant, painful or neutral tone of an experience.",
        "Recognizing the bell by itself determines whether the sound is pleasant."
      ],
      "e": "Perception involves recognizing or marking features of what is encountered.",
      "target": "Perception involves recognizing or marking features of what is encountered."
    },
    {
      "s": 3,
      "q": "What does gradually learning to calm the breath demonstrate?",
      "options": [
        "Influence",
        "Sovereign control"
      ],
      "e": "Practice can influence bodily and mental processes under favourable conditions.",
      "target": "Practice can influence bodily and mental processes under favourable conditions."
    },
    {
      "s": 3,
      "q": "Why is learning to regulate a bodily process compatible with the control argument?",
      "options": [
        "Practice can influence bodily and mental processes under favourable conditions.",
        "The control argument asks whether an aggregate can be commanded to be exactly as one wishes.",
        "Occasional success at directing a feeling establishes unlimited command."
      ],
      "e": "Practice can influence bodily and mental processes under favourable conditions.",
      "target": "Practice can influence bodily and mental processes under favourable conditions."
    },
    {
      "s": 3,
      "q": "What would guaranteed freedom from illness by sheer decision require?",
      "options": [
        "Sovereign control",
        "Influence"
      ],
      "e": "The control argument asks whether an aggregate can be commanded to be exactly as one wishes.",
      "target": "The control argument asks whether an aggregate can be commanded to be exactly as one wishes."
    },
    {
      "s": 3,
      "q": "What kind of control does the discourse invite a listener to test?",
      "options": [
        "The control argument asks whether an aggregate can be commanded to be exactly as one wishes.",
        "Practice can influence bodily and mental processes under favourable conditions.",
        "Occasional success at directing a feeling establishes unlimited command."
      ],
      "e": "The control argument asks whether an aggregate can be commanded to be exactly as one wishes.",
      "target": "The control argument asks whether an aggregate can be commanded to be exactly as one wishes."
    },
    {
      "s": 4,
      "q": "Which argument begins from the passing of a pleasant feeling?",
      "options": [
        "The argument from change",
        "The argument from control"
      ],
      "e": "What changes and is liable to distress offers an unstable basis for identification.",
      "target": "What changes and is liable to distress offers an unstable basis for identification."
    },
    {
      "s": 4,
      "q": "Why examine whether a pleasant experience lasts?",
      "options": [
        "What changes and is liable to distress offers an unstable basis for identification.",
        "An aggregate can afflict a person despite the person’s desire to direct it.",
        "Evidence of change by itself establishes that practice can have no effect."
      ],
      "e": "What changes and is liable to distress offers an unstable basis for identification.",
      "target": "What changes and is liable to distress offers an unstable basis for identification."
    },
    {
      "s": 4,
      "q": "Which argument asks whether one can simply order a painful feeling to cease?",
      "options": [
        "The argument from control",
        "The argument from change"
      ],
      "e": "An aggregate can afflict a person despite the person’s desire to direct it.",
      "target": "An aggregate can afflict a person despite the person’s desire to direct it."
    },
    {
      "s": 4,
      "q": "Why ask if the body always obeys a wish to remain healthy?",
      "options": [
        "An aggregate can afflict a person despite the person’s desire to direct it.",
        "What changes and is liable to distress offers an unstable basis for identification.",
        "Evidence of change by itself establishes that practice can have no effect."
      ],
      "e": "An aggregate can afflict a person despite the person’s desire to direct it.",
      "target": "An aggregate can afflict a person despite the person’s desire to direct it."
    },
    {
      "s": 5,
      "q": "Which helps explain learning without assuming an enduring substance?",
      "options": [
        "Causal continuity",
        "An unchanging owner"
      ],
      "e": "An earlier practice can shape a later response through causal connections.",
      "target": "An earlier practice can shape a later response through causal connections."
    },
    {
      "s": 5,
      "q": "How could repeated practice shape tomorrow’s response?",
      "options": [
        "An earlier practice can shape a later response through causal connections.",
        "A permanent subject would retain its identity independently of changes in the aggregates.",
        "Remembering yesterday establishes that every component of experience persists unchanged."
      ],
      "e": "An earlier practice can shape a later response through causal connections.",
      "target": "An earlier practice can shape a later response through causal connections."
    },
    {
      "s": 5,
      "q": "Which further entity does a critic seek by asking who owns every stage of experience?",
      "options": [
        "An unchanging owner",
        "Causal continuity"
      ],
      "e": "A permanent subject would retain its identity independently of changes in the aggregates.",
      "target": "A permanent subject would retain its identity independently of changes in the aggregates."
    },
    {
      "s": 5,
      "q": "What further assumption is at issue when a critic demands a permanent experiencer?",
      "options": [
        "A permanent subject would retain its identity independently of changes in the aggregates.",
        "An earlier practice can shape a later response through causal connections.",
        "Remembering yesterday establishes that every component of experience persists unchanged."
      ],
      "e": "A permanent subject would retain its identity independently of changes in the aggregates.",
      "target": "A permanent subject would retain its identity independently of changes in the aggregates."
    }
  ]
};
