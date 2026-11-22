# Glossary entries to audit, along the reading route

Owner's decision, 2026-11-01: audit the entries the reading route (Aristotle → Spinoza → Deleuze → Land) reaches, in the order below,
and leave the rest unchecked until a reading needs them. Unchecked entries say so in the app ("Unchecked: not yet audited against its
sources"), so reviewed and provisional material stay apart. Take the next batch from the top; take its lines off in the change that
ships its audit, and add the ids to `VERIFIED_TERMS`.

## Next route: Deleuze's own texts, then back to Land (owner's decision, 2026-11-12)

Read Deleuze in his own books before returning to Land, so the glossary can tell Deleuze's concepts apart from Land's
transformations of them: Difference and Repetition first (the critique of representation, difference in itself, the three syntheses
of time), then Anti-Oedipus, then A Thousand Plateaus. The books are under copyright (Deleuze died in 1995), so they are read from the
owner's own imported copies; quotations from them stay under 15 words, and a quotation the audit can't check against a copy it can
read is marked so in `unread`. Entries already checked from the encyclopedias are re-read against the books as the reading reaches
them, and any that the primary text shows to be too smooth are re-audited.

### Waiting for books

"Immanence: A Life" (one sentence of plane-of-immanence) stays resting on the IEP until the owner imports the essay
(glossary-wip.json, `unread`).

### Next: back to Land

The Deleuze books are read; the route returns to Land, whose entries (glossary-route2.json) are re-read against his own texts as the
owner imports them.

"Circuitries" (1992, Fanged Noumena pp. 289–318) read 2026-11-20: accelerationism and hyperstition re-read against it, its 24 Anti-Oedipus
quotations checked against the book, and the Land → Deleuze and Guattari connection re-checked (glossary-route2.json `reread_circuitries`,
connections.json). "Meat (or How to Kill Oedipus in Cyberspace)" (1995, pp. 411–439) read 2026-11-20 the same way (`reread_meat`); O'Sullivan now quoted from
his published pages. Next: further Land texts as the owner imports them.

### Hume, read in his own texts (owner's request, 2026-11-21)

Justified by the route through Deleuze's Empiricism and Subjectivity and the first synthesis of time (Difference and Repetition, pp. 70–71).
Read 2026-11-21 in the bundled Treatise and first Enquiry: impressions-ideas, association-of-ideas, necessary-connection, custom and
personal-identity (new, glossary-hume.json), and the Hume thinker card (thinkers-route.json). The Deleuze → Hume connection waits for
Empiricism and Subjectivity. Still unread: Millican's later sections, the original works of the New Hume debate and of the Appendix
readings (given through the encyclopedias, Millican and Yang), Giles pp. 186–200 (the audit's `unread`).

### Kant, read in the Critique of Pure Reason (owner's request, 2026-11-21)

Justified by the Deleuze and Land readings, which need Kant; the route is unchanged. The Critique comes with the app in Meiklejohn's
translation (second edition, with the first edition's preface; its primer lists the first-edition passages it lacks). Read 2026-11-21:
transcendental-idealism, categories and antinomy (new) and noumenon and synthetic-a-priori (re-read), in glossary-kant.json, with A/B
pages matched by content to Kemp Smith's Commentary and the SEP entries and checked against the Akademie pages. Still unread: Stang §§5.3–7
(noumena), Rohlf from §5.1, A/B pages for the antinomy statements (the audit's `unread`). "Kantian joke" waits for a named source (first
place to look: the editors' introduction to Fanged Noumena); Land's 1988 essay waits for the owner's pages of Fanged Noumena pp. 55–80.

### Aristotle, read in the Nicomachean Ethics (owner's request, 2026-11-22)

The route turns to Plato and Aristotle after Deleuze. Read 2026-11-22 in the bundled Peters: eudaimonia re-read (its first record kept under
`superseded` in glossary-aristotle.json), and virtue-mean, phronesis and akrasia (new), in glossary-aristotle-texts.json, with Bekker numbers
taken from Kraut's Stanford entry and checked against Bywater's Greek. Next: the Metaphysics entries (four-causes, potentiality, essence,
substance) once a translation is bundled; then Plato. Still unread: the scholarship Kraut only cites (the audit's `unread`).

### Plato, read in his own dialogues (owner's request, 2026-11-22)

The owner moves to Plato and Aristotle after Deleuze. Read 2026-11-22 in the bundled Jowett (Euthyphro–Phaedo volume and Republic):
forms, elenchus and tripartite-soul (new, glossary-plato.json), and the Socrates and Plato thinker cards (thinkers-route.json). Jowett prints
no Stephanus numbers; each one is matched to Burnet's Greek (Perseus) and listed in PLATO_ST. Recollection has one Phaedo sentence; the Meno
is not bundled. Still unread: Brown from §4.2, Woodruff §§14–20, the IEP's §§6–10 (the audit's `unread`). Aristotle's ethics was read the same day (above).

## Audited

The 15 Deleuze and Guattari entries and structuralism (glossary-dg.json); Spinoza's metaphysics (glossary-spinoza.json); the ancient and
early modern ground (glossary-aristotle.json); Kant and Hegel (glossary-kant-hegel.json), Kant re-read in the Critique (glossary-kant.json); Nietzsche (glossary-nietzsche.json); Land and
accelerationism, and the terms the Spinoza → Deleuze close reading points to (glossary-route2.json); ontology, metaphysics, accident,
universals, deduction, essentialism and existentialism (glossary-route3.json). Difference and Repetition, read in the book itself: representation and repetition (new), and difference-in-itself,
syntheses-of-time, virtual-actual and univocity re-read (glossary-dr.json, superseding their records in glossary-dg.json). Anti-Oedipus, read in the book itself: desiring-production, body-without-organs, syntheses-unconscious,
schizoanalysis and coding-decoding re-read (glossary-ao.json, likewise superseding glossary-dg.json). A Thousand Plateaus, read in the book itself: rhizome, assemblage,
deterritorialization, plane-of-immanence and minor-literature re-read, and the A Thousand Plateaus sentences of body-without-organs and
coding-decoding re-checked (glossary-atp.json, likewise superseding glossary-dg.json). What Is Philosophy?, read in the book itself: plane-of-immanence
re-read, and two sentences of deterritorialization from it (glossary-wip.json, superseding plane-of-immanence's record in glossary-atp.json). Kafka: Toward a Minor Literature, read in the book itself:
minor-literature re-read, and the Kafka sentences of rhizome and deterritorialization (glossary-kaf.json, superseding minor-literature's record
in glossary-atp.json). The Logic of Sense, read in the book itself at the owner's request: sense-event, aion-chronos and counter-actualization (new),
and the Logic of Sense sentence of body-without-organs re-checked (glossary-los.json). A second batch (2026-11-19) added double causality, the quasi-cause
and the static genesis to sense-event, gave James Williams's reading (Gilles Deleuze's Logic of Sense, 2008) with his pages in all three
new entries, and recorded three new open disputes. Still unread (its `unread` has the full list): Williams's guide outside pp. 55–56, 122–132, 152–158
and 169–174, Badiou's Logiques des mondes, the book's series 12–13 and 18–19 (apart from pp. 88–93 and 129), and the book's pages from
p. 169 on that the entries don't cite.
